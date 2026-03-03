import { NextRequest, NextResponse } from 'next/server';
import {
  ALL_AFFILIATE_PARAMS,
  AFFILIATE_DOMAINS,
  detectAffiliateParams,
  compareParamSurvival,
  type ParamSurvival,
} from '@/config/affiliate-params';
import {
  BROWSER_ENVIRONMENTS,
  type BrowserEnvironment,
} from '@/config/browser-environments';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HopInfo {
  url: string;
  status: number;
  jsRedirect?: boolean;
}

export interface EnvResult {
  environmentId: string;
  label: string;
  status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  finalStatus: number;
  finalUrl: string;
  chain: HopInfo[];
  redirectCount: number;
  affiliateTagPreserved: boolean | null;
  paramsLost: boolean;
  paramDetails: ParamSurvival[];
  errorMessage: string | null;
  differsFromBaseline: boolean;
  issue: string | null;
  testMethod: 'header-simulation' | 'browser-test';
  jsRedirectDetected: boolean;
}

/* ------------------------------------------------------------------ */
/*  Rate limiter (in-memory, per Vercel instance)                      */
/* ------------------------------------------------------------------ */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  );
}

function isAffiliateByDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return AFFILIATE_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

function detectAffiliateSimple(url: string): { isAffiliate: boolean; params: string[] } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { isAffiliate: false, params: [] };
  }

  const foundParams: string[] = [];
  for (const [key] of parsed.searchParams) {
    if (ALL_AFFILIATE_PARAMS.has(key.toLowerCase())) {
      foundParams.push(key);
    }
  }

  return {
    isAffiliate: isAffiliateByDomain(url) || foundParams.length > 0,
    params: foundParams,
  };
}

function classifyStatus(
  finalStatus: number,
  chainLength: number,
  errorMessage: string | null,
): 'ok' | 'broken' | 'redirect' | 'timeout' | 'error' {
  if (errorMessage?.includes('timed out')) return 'timeout';
  if (finalStatus >= 200 && finalStatus < 300) {
    return chainLength > 1 ? 'redirect' : 'ok';
  }
  if (finalStatus >= 400 || finalStatus === 0) return 'broken';
  return 'error';
}

/** Extract meta http-equiv="refresh" target URL from HTML */
function extractMetaRefresh(html: string, baseUrl: string): string | null {
  const match = html.match(
    /<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]+content\s*=\s*["']?\d+\s*;\s*url\s*=\s*["']?([^"'\s>]+)/i,
  );
  if (!match?.[1]) return null;
  try {
    return new URL(match[1], baseUrl).toString();
  } catch {
    return null;
  }
}

/** Try to extract window.location or document.location JS redirect from a small HTML body */
function extractJsRedirect(html: string, baseUrl: string): string | null {
  // Only check small bodies to avoid scanning large pages
  if (html.length > 10_000) return null;

  const patterns = [
    /window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i,
    /document\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i,
    /window\.location\.replace\s*\(\s*["']([^"']+)["']\s*\)/i,
    /location\.assign\s*\(\s*["']([^"']+)["']\s*\)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return new URL(match[1], baseUrl).toString();
      } catch {
        continue;
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Core redirect-chain follower (Layer A)                             */
/* ------------------------------------------------------------------ */

async function followChain(
  startUrl: string,
  env: BrowserEnvironment,
): Promise<{
  chain: HopInfo[];
  finalStatus: number;
  errorMessage: string | null;
  jsRedirectDetected: boolean;
}> {
  const chain: HopInfo[] = [];
  let current = startUrl;
  let finalStatus = 0;
  let errorMessage: string | null = null;
  let jsRedirectDetected = false;

  const headers: Record<string, string> = {
    'User-Agent': env.userAgent,
    ...env.headers,
  };

  try {
    for (let i = 0; i < 10; i++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      let res: Response;
      let usedGet = false;
      try {
        res = await fetch(current, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
          headers,
        });
      } catch (err: unknown) {
        if (
          err instanceof TypeError &&
          (err.message.includes('fetch') || err.message.includes('network'))
        ) {
          throw err;
        }
        res = await fetch(current, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers,
        });
        usedGet = true;
      } finally {
        clearTimeout(timeout);
      }

      chain.push({ url: current, status: res.status });
      finalStatus = res.status;

      // Follow HTTP redirect (3xx)
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) break;
        try {
          current = new URL(location, current).toString();
        } catch {
          break;
        }
        const dest = new URL(current);
        if (isPrivateHost(dest.hostname)) break;
        continue;
      }

      // For 200 responses, check for meta-refresh and JS redirects
      if (res.status >= 200 && res.status < 300) {
        // Only read body if we used GET or if it's a small response
        let body: string | null = null;
        if (usedGet) {
          try {
            body = await res.text();
          } catch {
            // Can't read body, skip meta-refresh check
          }
        } else {
          // Do a GET to check for meta-refresh / JS redirects
          try {
            const getController = new AbortController();
            const getTimeout = setTimeout(() => getController.abort(), 5_000);
            const getRes = await fetch(current, {
              method: 'GET',
              redirect: 'manual',
              signal: getController.signal,
              headers,
            });
            clearTimeout(getTimeout);
            body = await getRes.text();
          } catch {
            // Ignore — meta-refresh check is best-effort
          }
        }

        if (body) {
          // Check for meta refresh
          const metaTarget = extractMetaRefresh(body, current);
          if (metaTarget && metaTarget !== current) {
            try {
              const dest = new URL(metaTarget);
              if (!isPrivateHost(dest.hostname)) {
                current = metaTarget;
                continue;
              }
            } catch {
              // Invalid URL, skip
            }
          }

          // Check for JS redirect (flag only, don't follow — Layer B handles these)
          const jsTarget = extractJsRedirect(body, current);
          if (jsTarget && jsTarget !== current) {
            jsRedirectDetected = true;
            // Add the JS redirect target as a flagged hop
            chain.push({ url: jsTarget, status: 0, jsRedirect: true });
          }
        }
      }

      break;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('abort') || message.includes('timeout')) {
      errorMessage = 'Request timed out';
    } else {
      errorMessage = 'Could not reach URL';
    }
    finalStatus = 0;
  }

  return { chain, finalStatus, errorMessage, jsRedirectDetected };
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error: "You've used your free checks for this hour. Create a free account for more.",
        rateLimited: true,
      },
      { status: 429 },
    );
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawUrl = (body.url ?? '').trim();
  if (!rawUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const urlStr = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are supported' }, { status: 400 });
  }

  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Private/internal URLs are not allowed' }, { status: 400 });
  }

  const affiliateInfo = detectAffiliateSimple(urlStr);
  const hasAffParams = affiliateInfo.isAffiliate && affiliateInfo.params.length > 0;
  const detectedParams = detectAffiliateParams(urlStr);
  const detectedNetwork = detectedParams.length > 0 ? detectedParams[0].network : null;

  // Run all environments in parallel
  const envResults = await Promise.all(
    BROWSER_ENVIRONMENTS.map(async (env): Promise<EnvResult> => {
      const { chain, finalStatus, errorMessage, jsRedirectDetected } = await followChain(urlStr, env);

      const finalUrl = chain.filter((h) => !h.jsRedirect).at(-1)?.url ?? urlStr;
      const paramDetails = hasAffParams ? compareParamSurvival(urlStr, finalUrl) : [];
      const paramsLost = paramDetails.some((p) => !p.survived);

      const status = classifyStatus(finalStatus, chain.filter((h) => !h.jsRedirect).length, errorMessage);

      let affiliateTagPreserved: boolean | null = null;
      if (hasAffParams) {
        affiliateTagPreserved = !paramsLost;
      }

      // Issue description
      let issue: string | null = null;
      if (errorMessage) {
        issue = errorMessage;
      } else if (paramsLost) {
        const lostParams = paramDetails.filter((p) => !p.survived).map((p) => p.param);
        if (env.cookiePolicy !== 'standard') {
          issue = `Privacy restrictions stripped ${lostParams.join(', ')}`;
        } else {
          issue = `Parameter ${lostParams.join(', ')} lost in redirect`;
        }
      } else if (jsRedirectDetected) {
        issue = 'JavaScript redirect detected — browser test will verify';
      } else if (status === 'broken') {
        issue = `HTTP ${finalStatus} error`;
      }

      return {
        environmentId: env.id,
        label: env.label,
        status,
        finalStatus,
        finalUrl,
        chain,
        redirectCount: Math.max(0, chain.filter((h) => !h.jsRedirect).length - 1),
        affiliateTagPreserved,
        paramsLost,
        paramDetails,
        errorMessage,
        differsFromBaseline: false,
        issue,
        testMethod: 'header-simulation',
        jsRedirectDetected,
      };
    }),
  );

  // Mark environments that differ from the desktop-chrome baseline
  const baseline = envResults.find((r) => r.environmentId === 'desktop-chrome');
  if (baseline) {
    for (const r of envResults) {
      if (r.environmentId === 'desktop-chrome') continue;
      r.differsFromBaseline =
        r.finalUrl !== baseline.finalUrl ||
        r.paramsLost !== baseline.paramsLost ||
        r.redirectCount !== baseline.redirectCount ||
        r.status !== baseline.status;
    }
  }

  return NextResponse.json({
    originalUrl: urlStr,
    isAffiliate: affiliateInfo.isAffiliate,
    affiliateParams: affiliateInfo.params,
    detectedNetwork,
    environments: envResults,
  });
}
