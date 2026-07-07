import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchWithCrawlerFallback,
  BROWSER_HEADERS,
  resetCrawlerFallbackMemory,
} from '../browser-fetch';

function res(status: number, body = ''): Response {
  return new Response(body, { status });
}

type FetchArgs = [input: string | URL | Request, init?: RequestInit];

function headersOfCall(fetchMock: { mock: { calls: unknown[][] } }, callIndex: number): Record<string, string> {
  const [, init] = fetchMock.mock.calls[callIndex] as FetchArgs;
  return (init?.headers ?? {}) as Record<string, string>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetCrawlerFallbackMemory();
});

describe('fetchWithCrawlerFallback', () => {
  it('uses the honest crawler UA and does not retry on a 200', async () => {
    const fetchMock = vi.fn(async () => res(200, '<html></html>'));
    vi.stubGlobal('fetch', fetchMock);

    const { response, usedBrowserFallback } = await fetchWithCrawlerFallback('https://ok.example');

    expect(usedBrowserFallback).toBe(false);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(headersOfCall(fetchMock, 0)['User-Agent']).toMatch(/LinkRescue-Crawler/);
  });

  it('retries with a browser profile and flags the site when the honest UA is 403', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403))
      .mockResolvedValueOnce(res(200, '<html></html>'));
    vi.stubGlobal('fetch', fetchMock);

    const { response, usedBrowserFallback } = await fetchWithCrawlerFallback('https://walled.example');

    expect(usedBrowserFallback).toBe(true);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(headersOfCall(fetchMock, 1)['User-Agent']).toBe(BROWSER_HEADERS['User-Agent']);
  });

  it('does not flag the site when both honest and browser attempts are blocked', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(403));
    vi.stubGlobal('fetch', fetchMock);

    const { response, usedBrowserFallback } = await fetchWithCrawlerFallback('https://hardwall.example');

    expect(usedBrowserFallback).toBe(false);
    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('honors a custom honest UA (e.g. the CLI identity)', async () => {
    const fetchMock = vi.fn(async () => res(200));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCrawlerFallback('https://ok.example', { honestUserAgent: 'LinkRescue-CLI/1.0' });

    expect(headersOfCall(fetchMock, 0)['User-Agent']).toBe('LinkRescue-CLI/1.0');
  });

  it('falls back to the honest response when the browser retry throws', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403))
      .mockRejectedValueOnce(new Error('network'));
    vi.stubGlobal('fetch', fetchMock);

    const { response, usedBrowserFallback } = await fetchWithCrawlerFallback('https://flaky.example');

    expect(usedBrowserFallback).toBe(false);
    expect(response.status).toBe(403);
  });

  it('does NOT retry on 429 — rate limiting is not UA-gating', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(429));
    vi.stubGlobal('fetch', fetchMock);

    const { response, usedBrowserFallback } = await fetchWithCrawlerFallback('https://ratelimited.example');

    expect(usedBrowserFallback).toBe(false);
    expect(response.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('remembers a blocked origin and skips the honest probe on later fetches', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403)) // page 1, honest tier
      .mockResolvedValueOnce(res(200)) // page 1, browser tier — origin remembered
      .mockResolvedValueOnce(res(200)); // page 2 — straight to browser tier
    vi.stubGlobal('fetch', fetchMock);

    const first = await fetchWithCrawlerFallback('https://walled.example/page-1');
    const second = await fetchWithCrawlerFallback('https://walled.example/page-2');

    expect(first.usedBrowserFallback).toBe(true);
    expect(second.usedBrowserFallback).toBe(true);
    // 3 requests total, not 4: page 2 skipped the guaranteed-403 honest probe.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(headersOfCall(fetchMock, 2)['User-Agent']).toBe(BROWSER_HEADERS['User-Agent']);
  });

  it('does not let one blocked origin poison other origins', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403)) // walled origin, honest
      .mockResolvedValueOnce(res(200)) // walled origin, browser — remembered
      .mockResolvedValueOnce(res(200)); // different origin — honest tier again
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCrawlerFallback('https://walled.example/');
    const other = await fetchWithCrawlerFallback('https://friendly.example/');

    expect(other.usedBrowserFallback).toBe(false);
    expect(headersOfCall(fetchMock, 2)['User-Agent']).toMatch(/LinkRescue-Crawler/);
  });

  it('does not remember an origin when the browser tier is also blocked (hard wall)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(403));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCrawlerFallback('https://hardwall.example/a');
    await fetchWithCrawlerFallback('https://hardwall.example/b');

    // Both pages tried honest first (4 calls total) — hard walls are the
    // headless tier's job, not the header tier's.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(headersOfCall(fetchMock, 2)['User-Agent']).toMatch(/LinkRescue-Crawler/);
  });
});

describe('fetchWithCrawlerFallback — headless tier (BROWSER_API_URL set)', () => {
  const API_URL = 'https://headless.internal.example';

  function stubEnv() {
    vi.stubEnv('BROWSER_API_URL', API_URL);
    vi.stubEnv('BROWSER_API_KEY', 'test-key');
  }

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function headlessOk(html = '<html>rendered</html>'): Response {
    return new Response(JSON.stringify({ status: 200, finalUrl: 'https://wall.example/', html }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  it('escalates to headless when both plain tiers are blocked', async () => {
    stubEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403)) // honest
      .mockResolvedValueOnce(res(403)) // browser headers
      .mockResolvedValueOnce(headlessOk()); // headless API
    vi.stubGlobal('fetch', fetchMock);

    const { response, usedBrowserFallback, usedHeadlessFallback } =
      await fetchWithCrawlerFallback('https://wall.example/');

    expect(usedHeadlessFallback).toBe(true);
    expect(usedBrowserFallback).toBe(false);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('rendered');
    // Third call went to the API, authenticated
    const apiCall = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(apiCall[0]).toBe(`${API_URL}/fetch`);
    expect((apiCall[1].headers as Record<string, string>)['x-api-key']).toBe('test-key');
  });

  it('remembers a hard-wall origin and goes straight to headless on later pages', async () => {
    stubEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403)) // page 1: honest
      .mockResolvedValueOnce(res(403)) // page 1: browser
      .mockResolvedValueOnce(headlessOk()) // page 1: headless — remembered
      .mockResolvedValueOnce(headlessOk()); // page 2: straight to headless
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCrawlerFallback('https://wall.example/page-1');
    const second = await fetchWithCrawlerFallback('https://wall.example/page-2');

    expect(second.usedHeadlessFallback).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect((fetchMock.mock.calls[3] as [string, RequestInit])[0]).toBe(`${API_URL}/fetch`);
  });

  it('returns the plain-fetch block response when the headless service is down', async () => {
    stubEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403)) // honest
      .mockResolvedValueOnce(res(403)) // browser
      .mockRejectedValueOnce(new Error('ECONNREFUSED')); // headless API down
    vi.stubGlobal('fetch', fetchMock);

    const { response, usedHeadlessFallback } = await fetchWithCrawlerFallback('https://wall.example/');

    expect(usedHeadlessFallback).toBe(false);
    expect(response.status).toBe(403);
  });

  it('never calls the headless API when the env var is unset (prod default)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(403));
    vi.stubGlobal('fetch', fetchMock);

    const { usedHeadlessFallback } = await fetchWithCrawlerFallback('https://wall.example/');

    expect(usedHeadlessFallback).toBe(false);
    // honest + browser only — no third call to any API
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
