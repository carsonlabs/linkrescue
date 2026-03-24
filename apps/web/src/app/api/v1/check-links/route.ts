import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, checkRateLimit } from '@/lib/api-auth';
import {
  ALL_AFFILIATE_PARAMS,
  AFFILIATE_DOMAINS,
  detectAffiliateParams,
  compareParamSurvival,
} from '@/config/affiliate-params';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LinkResult {
  url: string;
  status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  status_code: number;
  final_url: string;
  redirect_count: number;
  is_affiliate: boolean;
  affiliate_params_preserved: boolean | null;
  params_lost: string[];
  issue: string | null;
}

interface HopInfo {
  url: string;
  status: number;
}

/* ------------------------------------------------------------------ */
/*  CORS headers                                                       */
/* ------------------------------------------------------------------ */

function getCorsHeaders(req?: NextRequest): Record<string, string> {
  const origin = req?.headers.get('origin') ?? '';
  const allowedOrigins = [
    'https://linkrescue.io',
    'https://www.linkrescue.io',
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  // For API consumers using Bearer tokens (not browser requests), allow the origin
  // Browser CORS is only relevant for fetch from other websites
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? 'https://linkrescue.io';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
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

/* ------------------------------------------------------------------ */
/*  Core redirect-chain follower                                       */
/* ------------------------------------------------------------------ */

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function followChain(startUrl: string): Promise<{
  chain: HopInfo[];
  finalStatus: number;
  errorMessage: string | null;
}> {
  const chain: HopInfo[] = [];
  let current = startUrl;
  let finalStatus = 0;
  let errorMessage: string | null = null;

  const headers: Record<string, string> = {
    'User-Agent': CHROME_UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };

  try {
    for (let i = 0; i < 10; i++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      let res: Response;
      try {
        res = await fetch(current, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
          headers,
        });
      } catch {
        res = await fetch(current, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers,
        });
      } finally {
        clearTimeout(timeout);
      }

      chain.push({ url: current, status: res.status });
      finalStatus = res.status;

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

  return { chain, finalStatus, errorMessage };
}

/* ------------------------------------------------------------------ */
/*  Check a single URL                                                 */
/* ------------------------------------------------------------------ */

async function checkOneLink(rawUrl: string): Promise<LinkResult> {
  const urlStr = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return {
      url: rawUrl,
      status: 'error',
      status_code: 0,
      final_url: rawUrl,
      redirect_count: 0,
      is_affiliate: false,
      affiliate_params_preserved: null,
      params_lost: [],
      issue: 'Invalid URL format',
    };
  }

  if (isPrivateHost(parsed.hostname)) {
    return {
      url: rawUrl,
      status: 'error',
      status_code: 0,
      final_url: rawUrl,
      redirect_count: 0,
      is_affiliate: false,
      affiliate_params_preserved: null,
      params_lost: [],
      issue: 'Private/internal URLs not allowed',
    };
  }

  const affiliateInfo = detectAffiliateSimple(urlStr);
  const { chain, finalStatus, errorMessage } = await followChain(urlStr);

  const finalUrl = chain.at(-1)?.url ?? urlStr;
  const redirectCount = Math.max(0, chain.length - 1);
  const status = classifyStatus(finalStatus, chain.length, errorMessage);

  let affiliateParamsPreserved: boolean | null = null;
  let paramsLost: string[] = [];

  if (affiliateInfo.isAffiliate && affiliateInfo.params.length > 0) {
    const paramDetails = compareParamSurvival(urlStr, finalUrl);
    paramsLost = paramDetails.filter((p) => !p.survived).map((p) => p.param);
    affiliateParamsPreserved = paramsLost.length === 0;
  }

  let issue: string | null = null;
  if (errorMessage) {
    issue = errorMessage;
  } else if (paramsLost.length > 0) {
    issue = `Affiliate params lost: ${paramsLost.join(', ')}`;
  } else if (status === 'broken') {
    issue = `HTTP ${finalStatus}`;
  }

  return {
    url: urlStr,
    status,
    status_code: finalStatus,
    final_url: finalUrl,
    redirect_count: redirectCount,
    is_affiliate: affiliateInfo.isAffiliate,
    affiliate_params_preserved: affiliateParamsPreserved,
    params_lost: paramsLost,
    issue,
  };
}

/* ------------------------------------------------------------------ */
/*  Route handlers                                                     */
/* ------------------------------------------------------------------ */

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  // Auth
  const auth = await authenticateApiRequest(req);
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: getCorsHeaders(req) },
    );
  }

  // Rate limit
  const rateLimit = await checkRateLimit(auth.context.userId, auth.context.plan, 'read');
  const rateLimitHeaders = {
    ...getCorsHeaders(req),
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', reset_at: rateLimit.resetAt.toISOString() },
      { status: 429, headers: rateLimitHeaders },
    );
  }

  // Parse body
  let body: { url?: string; urls?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: getCorsHeaders(req) },
    );
  }

  // Support single URL or array
  let urls: string[] = [];
  if (body.urls && Array.isArray(body.urls)) {
    urls = body.urls.slice(0, 20); // Max 20 URLs per request
  } else if (body.url && typeof body.url === 'string') {
    urls = [body.url];
  }

  if (urls.length === 0) {
    return NextResponse.json(
      { error: 'Provide "url" (string) or "urls" (array, max 20)' },
      { status: 400, headers: getCorsHeaders(req) },
    );
  }

  // Check all URLs in parallel
  const results = await Promise.all(urls.map(checkOneLink));

  // Summary stats
  const broken = results.filter((r) => r.status === 'broken').length;
  const redirects = results.filter((r) => r.status === 'redirect').length;
  const params_lost = results.filter((r) => r.params_lost.length > 0).length;

  return NextResponse.json(
    {
      checked: results.length,
      summary: { broken, redirects, params_lost },
      results,
    },
    { status: 200, headers: rateLimitHeaders },
  );
}
