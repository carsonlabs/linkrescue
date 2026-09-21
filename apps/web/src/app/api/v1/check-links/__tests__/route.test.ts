import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { authenticateApiRequest, checkRateLimit } = vi.hoisted(() => ({
  authenticateApiRequest: vi.fn(),
  checkRateLimit: vi.fn(),
}));
vi.mock('@/lib/api-auth', () => ({ authenticateApiRequest, checkRateLimit }));

import { POST } from '../route';

/** url -> [status, location?] — a redirect chain the mocked network will serve. */
type Route = [number, string?];

function serve(routes: Record<string, Route>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      const hit = routes[url];
      if (!hit) throw new Error(`unexpected fetch ${url}`);
      const [status, location] = hit;
      return new Response(null, { status, headers: location ? { location } : {} });
    }),
  );
}

async function check(url: string) {
  const res = await POST(
    new NextRequest('https://www.linkrescue.io/api/v1/check-links', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer lr_test' },
      body: JSON.stringify({ urls: [url] }),
    }),
  );
  expect(res.status).toBe(200);
  return (await res.json()).results[0];
}

beforeEach(() => {
  authenticateApiRequest.mockResolvedValue({ success: true, context: { userId: 'u', plan: 'free', apiKeyId: 'k' } });
  checkRateLimit.mockResolvedValue({ allowed: true, limit: 20, remaining: 19, resetAt: new Date() });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// Each case is a link shape from the June 2026 study, where the old logic
// called network hand-offs and share buttons "lost params".
describe('POST /api/v1/check-links — attribution verdicts', () => {
  it('Awin -> merchant is delivered, not lost', async () => {
    const start = 'https://www.awin1.com/awclick.php?awinmid=67240&awinaffid=103504';
    serve({
      [start]: [302, 'https://naturehills.com/products/x?sscid=67240_1781'],
      'https://naturehills.com/products/x?sscid=67240_1781': [200],
    });
    const r = await check(start);
    expect(r.is_affiliate).toBe(true);
    expect(r.params_lost).toEqual([]);
    expect(r.affiliate_params_preserved).toBe(true);
    expect(r.issue).toBeNull();
  });

  it('Awin -> Booking without a visible click id is still delivered', async () => {
    const start = 'https://www.awin1.com/cread.php?awinmid=6776&awinaffid=250759';
    serve({
      [start]: [302, 'https://www.booking.com/searchresults.html?dest_id=5268'],
      'https://www.booking.com/searchresults.html?dest_id=5268': [200],
    });
    const r = await check(start);
    expect(r.params_lost).toEqual([]);
    expect(r.issue).toBeNull();
  });

  it('a Facebook share button is not an affiliate link and raises no issue', async () => {
    const start = 'https://www.facebook.com/sharer/sharer.php?u=https://a.test/&ref=plugin&src=share_button';
    serve({
      [start]: [302, 'https://www.facebook.com/share_channel/?type=reshare'],
      'https://www.facebook.com/share_channel/?type=reshare': [200],
    });
    const r = await check(start);
    expect(r.is_affiliate).toBe(false);
    expect(r.params_lost).toEqual([]);
    expect(r.issue).toBeNull();
  });

  it('an expired partner program is reported as such', async () => {
    const start = 'https://www.worldnomads.com/Turnstile/AffiliateLink?partnerCode=expvaga';
    serve({
      [start]: [302, 'https://www.worldnomads.com/travel-insurance/expired-partner-link'],
      'https://www.worldnomads.com/travel-insurance/expired-partner-link': [200],
    });
    const r = await check(start);
    expect(r.issue).toBe('Lands on an expired or closed affiliate-program page');
  });

  it('a bot wall is "could not verify", not a clean result', async () => {
    const start = 'https://goto.walmart.com/c/2773249/565706/9383?subid1=abc';
    serve({
      [start]: [302, 'https://www.walmart.com/blocked?url=abc'],
      'https://www.walmart.com/blocked?url=abc': [200],
    });
    const r = await check(start);
    expect(r.issue).toMatch(/could not verify/);
  });

  it('an intermediary that drops the tag on the way to another domain is lost', async () => {
    const start = 'https://short.example/go?aff=publisher123';
    serve({
      [start]: [302, 'https://merchant.example/product'],
      'https://merchant.example/product': [200],
    });
    const r = await check(start);
    expect(r.params_lost).toEqual(['aff']);
    expect(r.affiliate_params_preserved).toBe(false);
    expect(r.issue).toBe('Affiliate tracking never reached the merchant or network: aff');
  });
});
