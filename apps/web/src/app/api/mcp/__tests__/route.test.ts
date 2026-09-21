import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { authenticateApiRequest } = vi.hoisted(() => ({ authenticateApiRequest: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ authenticateApiRequest }));

import { POST } from '../route';

const ORIGIN = 'https://www.linkrescue.io';
const KEY = 'Bearer lr_test_key';

function rpc(method: string, params: unknown = {}, headers: Record<string, string> = { authorization: KEY }) {
  return POST(
    new NextRequest(`${ORIGIN}/api/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
  );
}

const callTool = (name: string, args: unknown) => rpc('tools/call', { name, arguments: args });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  authenticateApiRequest.mockResolvedValue({
    success: true,
    context: { userId: 'u1', plan: 'free', apiKeyId: 'k1' },
  });
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('POST /api/mcp — auth', () => {
  it('rejects a request with no API key before touching the key store', async () => {
    const res = await rpc('initialize', {}, {});
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toMatch(/linkrescue\.io\/signup/);
    expect(authenticateApiRequest).not.toHaveBeenCalled();
  });

  it('rejects an invalid key with the API error message', async () => {
    authenticateApiRequest.mockResolvedValue({ success: false, error: 'Invalid API key', status: 401 });
    const res = await rpc('initialize');
    expect(res.status).toBe(401);
    expect((await res.json()).error.message).toBe('Invalid API key');
  });
});

describe('POST /api/mcp — protocol', () => {
  it('initializes statelessly and identifies as linkrescue', async () => {
    const res = await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.serverInfo.name).toBe('linkrescue');
    expect(body.result.instructions).toMatch(/never estimates lost revenue/);
    expect(res.headers.get('mcp-session-id')).toBeNull();
  });

  it('lists exactly the four tools', async () => {
    const body = await (await rpc('tools/list')).json();
    const names = body.result.tools.map((t: { name: string }) => t.name).sort();
    expect(names).toEqual(['check_links', 'get_fix_suggestions', 'get_scan', 'start_site_scan']);
    const check = body.result.tools.find((t: { name: string }) => t.name === 'check_links');
    expect(check.inputSchema.properties.urls.maxItems).toBe(20);
  });
});

describe('POST /api/mcp — tools', () => {
  it('check_links forwards the caller key to the v1 API and returns its JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ checked: 1, results: [{ url: 'https://a.test', params_lost: ['tag'] }] }), {
        status: 200,
      }),
    );
    const body = await (await callTool('check_links', { urls: ['https://a.test'] })).json();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${ORIGIN}/api/v1/check-links`);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(KEY);
    expect(JSON.parse(init.body)).toEqual({ urls: ['https://a.test'] });

    expect(body.result.isError).toBeFalsy();
    expect(body.result.content[0].text).toContain('"params_lost"');
  });

  // The whole point of the remote endpoint: an API failure must reach the agent
  // as an error, never as a plausible-looking result.
  it('surfaces a rate-limit error as a tool error, with the reset time', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Daily scan limit reached' }), {
        status: 429,
        headers: { 'X-RateLimit-Reset': '2026-09-22T00:00:00.000Z' },
      }),
    );
    const body = await (await callTool('start_site_scan', { url: 'https://a.test' })).json();

    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toBe(
      'LinkRescue API error 429: Daily scan limit reached (rate limit resets 2026-09-22T00:00:00.000Z)',
    );
  });

  it('get_scan hits the scan route for that id', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'running' }), { status: 200 }));
    const id = '3f2b8c1e-9d4a-4e6b-8a1c-2d3e4f5a6b7c';
    await callTool('get_scan', { scan_id: id });
    expect(fetchMock.mock.calls[0][0]).toBe(`${ORIGIN}/api/v1/scans/${id}`);
    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
  });

  it('refuses more than 20 URLs without calling the API', async () => {
    const urls = Array.from({ length: 21 }, (_, i) => `https://a.test/${i}`);
    const body = await (await callTool('check_links', { urls })).json();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(body.error ?? body.result?.isError).toBeTruthy();
  });
});
