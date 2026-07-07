/**
 * Tiered fetch strategy for sites that block declared crawlers.
 *
 * Tier 1 — honest: we identify ourselves (`LinkRescue-Crawler` UA). Well-behaved
 *   sites never see anything else; the crawler stays identifiable and
 *   robots-respecting on the happy path.
 * Tier 2 — browser headers: some sites (Varnish/Cloudflare UA rules) serve real
 *   browsers but 403 any declared bot. One retry with a browser header profile
 *   wins those, and the site is reported as "blocks declared crawlers" — a
 *   published Link Rot Index stat rather than a silent zero-page failure.
 * Tier 3 — headless browser (opt-in): fingerprint walls (Cloudflare/DataDome)
 *   block plain fetch regardless of headers — they fingerprint the TLS client
 *   (verified on apartmenttherapy.com, 2026-07-06: node fetch with a perfect
 *   Chrome profile still 403s). When `BROWSER_API_URL` is set, blocked pages
 *   are fetched through the linkrescue-browser-api headless service (same
 *   service + `BROWSER_API_KEY` the web app's /api/check-link/browser uses).
 *   Unset (e.g. Vercel prod today) = tiers 1–2 only, behavior unchanged.
 *
 * Per-origin memory: once an origin blocks a tier, later fetches skip straight
 * to the tier that worked. Re-probing lower tiers on every page doubles request
 * volume with differing UAs from one IP — a bot-like signature that escalates
 * real-world blocks (observed on apartmenttherapy.com) — and it's ruder to the
 * site. The origin still counts toward the corresponding index stat for every
 * page served this way.
 */
import { CRAWLER_USER_AGENT } from './crawl-config';

/** A realistic desktop-Chrome header profile, used only as the 403 fallback. */
export const BROWSER_HEADERS: Readonly<Record<string, string>> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Status codes that signal "we're blocking your declared bot" rather than a
 * genuine error. Only these trigger tier escalation; transient 5xx and network
 * timeouts are left to the caller's normal retry path.
 *
 * 429 is deliberately NOT here: that's rate limiting, and re-sending the same
 * request immediately with different headers aggravates it instead of
 * detecting UA-gating.
 */
const DECLARED_CRAWLER_BLOCK_CODES: ReadonlySet<number> = new Set([401, 403, 405]);

type FetchTier = 'browser' | 'headless';

/**
 * Origins where a lower tier has already been blocked this process, mapped to
 * the tier that got through. Bounded so a pass over thousands of domains can't
 * grow it unbounded.
 */
const originTierMemory = new Map<string, FetchTier>();
const ORIGIN_MEMORY_MAX = 1000;

/** Test/long-lived-process hook: forget which origins blocked which tiers. */
export function resetCrawlerFallbackMemory(): void {
  originTierMemory.clear();
}

function rememberOriginTier(origin: string | null, tier: FetchTier): void {
  if (origin && originTierMemory.size < ORIGIN_MEMORY_MAX) {
    originTierMemory.set(origin, tier);
  }
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function isBlocked(status: number): boolean {
  return DECLARED_CRAWLER_BLOCK_CODES.has(status);
}

export interface CrawlerFetchOptions {
  /** When set, each tier gets its own `AbortSignal.timeout(timeoutMs)`. */
  timeoutMs?: number;
  /** Honest declared-crawler UA to try first. Defaults to `CRAWLER_USER_AGENT`. */
  honestUserAgent?: string;
}

export interface CrawlerFetchResult {
  response: Response;
  /**
   * True when this response came from the browser-header tier because the
   * origin blocks the honest UA (observed on this request or earlier in the
   * scan) — the site serves browsers but blocks honest bots. Callers surface
   * this as the "blocks declared crawlers" flag.
   */
  usedBrowserFallback: boolean;
  /**
   * True when this response came from the headless-browser tier because the
   * origin blocks plain fetch regardless of headers — a fingerprint wall.
   * Separate published stat from `usedBrowserFallback`.
   */
  usedHeadlessFallback: boolean;
}

/**
 * Read lazily so tests and long-lived processes can toggle the env. Reuses the
 * same `BROWSER_API_URL` / `BROWSER_API_KEY` the web app's browser-test route
 * already uses — one service, one credential.
 */
function headlessApiConfig(): { url: string; key: string } | null {
  const url = process.env.BROWSER_API_URL;
  if (!url) return null;
  return { url: url.replace(/\/$/, ''), key: process.env.BROWSER_API_KEY ?? '' };
}

/**
 * Fetch a blocked page through the linkrescue-browser-api headless service.
 * Returns null when the service is not configured, unreachable, or also
 * blocked — callers fall back to the best plain-fetch response they have.
 */
async function headlessFetch(url: string, timeoutMs?: number): Promise<Response | null> {
  const api = headlessApiConfig();
  if (!api) return null;

  try {
    const apiResponse = await fetch(`${api.url}/fetch`, {
      method: 'POST',
      // The service navigates a real page; give the round trip headroom.
      signal: AbortSignal.timeout(Math.max(timeoutMs ?? 0, 35000)),
      headers: { 'Content-Type': 'application/json', 'x-api-key': api.key },
      body: JSON.stringify({ url, timeoutMs: timeoutMs ?? 20000 }),
    });
    if (!apiResponse.ok) return null;

    const payload = (await apiResponse.json()) as {
      status: number;
      finalUrl: string;
      html: string;
    };
    if (!payload || typeof payload.status !== 'number' || isBlocked(payload.status)) {
      return null;
    }
    // Present the rendered page as a plain Response so call sites need no
    // special casing (they check response.ok + content-type, then .text()).
    return new Response(payload.html ?? '', {
      status: payload.status,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    return null;
  }
}

async function plainFetch(
  url: string,
  headers: Record<string, string>,
  timeoutMs?: number,
): Promise<Response> {
  return fetch(url, {
    signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
    headers,
  });
}

/**
 * Fetch `url` honestly first; on a declared-crawler block (401/403/405),
 * escalate: browser header profile, then (when configured) the headless
 * browser service. Origins that block a tier are remembered and skipped
 * straight to the working tier for the rest of the process.
 */
export async function fetchWithCrawlerFallback(
  url: string,
  opts: CrawlerFetchOptions = {},
): Promise<CrawlerFetchResult> {
  const origin = originOf(url);
  const knownTier = origin ? originTierMemory.get(origin) : undefined;

  // Tier 1 — honest, unless this origin already blocked it.
  if (!knownTier) {
    const honest = await plainFetch(
      url,
      { 'User-Agent': opts.honestUserAgent ?? CRAWLER_USER_AGENT },
      opts.timeoutMs,
    );
    if (!isBlocked(honest.status)) {
      return { response: honest, usedBrowserFallback: false, usedHeadlessFallback: false };
    }

    // Tier 2 — browser header profile.
    let browser: Response | null = null;
    try {
      browser = await plainFetch(url, { ...BROWSER_HEADERS }, opts.timeoutMs);
    } catch {
      // Timeout/network on the retry — fall through to tier 3, else honest.
    }
    if (browser && !isBlocked(browser.status)) {
      rememberOriginTier(origin, 'browser');
      return { response: browser, usedBrowserFallback: true, usedHeadlessFallback: false };
    }

    // Tier 3 — headless service (no-op unless BROWSER_API_URL is set).
    const headless = await headlessFetch(url, opts.timeoutMs);
    if (headless) {
      rememberOriginTier(origin, 'headless');
      return { response: headless, usedBrowserFallback: false, usedHeadlessFallback: true };
    }

    // Everything blocked — hand back the most honest picture of the block.
    return {
      response: browser ?? honest,
      usedBrowserFallback: false,
      usedHeadlessFallback: false,
    };
  }

  if (knownTier === 'browser') {
    // Origin blocks honest bots — one request per page at the tier that works.
    const browser = await plainFetch(url, { ...BROWSER_HEADERS }, opts.timeoutMs);
    if (!isBlocked(browser.status)) {
      return { response: browser, usedBrowserFallback: true, usedHeadlessFallback: false };
    }
    // The wall escalated mid-scan (observed in the wild) — try headless.
    const headless = await headlessFetch(url, opts.timeoutMs);
    if (headless) {
      rememberOriginTier(origin, 'headless');
      return { response: headless, usedBrowserFallback: false, usedHeadlessFallback: true };
    }
    return { response: browser, usedBrowserFallback: false, usedHeadlessFallback: false };
  }

  // knownTier === 'headless'
  const headless = await headlessFetch(url, opts.timeoutMs);
  if (headless) {
    return { response: headless, usedBrowserFallback: false, usedHeadlessFallback: true };
  }
  // Service went away mid-scan — degrade to the browser-header tier.
  const browser = await plainFetch(url, { ...BROWSER_HEADERS }, opts.timeoutMs);
  return {
    response: browser,
    usedBrowserFallback: !isBlocked(browser.status),
    usedHeadlessFallback: false,
  };
}
