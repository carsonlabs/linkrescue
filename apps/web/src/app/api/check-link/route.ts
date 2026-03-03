import { NextRequest, NextResponse } from 'next/server';
import {
  ALL_AFFILIATE_PARAMS,
  AFFILIATE_DOMAINS,
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
}

export interface EnvResult {
  environmentId: string;
  label: string;
  status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  finalStatus: number;
  finalUrl: string;
  chain: HopInfo[];
  redirectCount: number;
  affiliateTagPreserved: boolean | null; // null = no affiliate params to check
  paramsLost: boolean;
  errorMessage: string | null;
  /** True when redirect chain differs from the baseline (desktop_chrome) */
  differsFromBaseline: boolean;
  issue: string | null;
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

function detectAffiliate(url: string): { isAffiliate: boolean; params: string[] } {
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

  const isAffiliateDomain = AFFILIATE_DOMAINS.some(
    (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`),
  );

  return { isAffiliate: isAffiliateDomain || foundParams.length > 0, params: foundParams };
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

async function followChain(
  startUrl: string,
  env: BrowserEnvironment,
): Promise<{ chain: HopInfo[]; finalStatus: number; errorMessage: string | null }> {
  const chain: HopInfo[] = [];
  let current = startUrl;
  let finalStatus = 0;
  let errorMessage: string | null = null;

  const headers: Record<string, string> = {
    'User-Agent': env.userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  if (env.referer) headers['Referer'] = env.referer;
  // ITP environments: omit Cookie header entirely (simulates blocked 3rd-party cookies)

  try {
    for (let i = 0; i < 8; i++) {
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
      } else {
        break;
      }
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
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
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

  const affiliateInfo = detectAffiliate(urlStr);
  const hasAffParams = affiliateInfo.isAffiliate && affiliateInfo.params.length > 0;

  // Run all environments in parallel
  const envResults = await Promise.all(
    BROWSER_ENVIRONMENTS.map(async (env): Promise<EnvResult> => {
      const { chain, finalStatus, errorMessage } = await followChain(urlStr, env);

      const finalUrl = chain.at(-1)?.url ?? urlStr;
      const finalAffiliate = detectAffiliate(finalUrl);

      const paramsLost =
        hasAffParams &&
        chain.length > 1 &&
        finalAffiliate.params.length < affiliateInfo.params.length;

      const status = classifyStatus(finalStatus, chain.length, errorMessage);

      let affiliateTagPreserved: boolean | null = null;
      if (hasAffParams) {
        affiliateTagPreserved = !paramsLost;
      }

      // Issue description
      let issue: string | null = null;
      if (errorMessage) {
        issue = errorMessage;
      } else if (paramsLost) {
        // Find which hop lost the params
        const lostAtHop = chain.findIndex((hop, idx) => {
          if (idx === 0) return false;
          const prevAffiliate = detectAffiliate(chain[idx - 1].url);
          const curAffiliate = detectAffiliate(hop.url);
          return curAffiliate.params.length < prevAffiliate.params.length;
        });
        if (env.simulateITP && lostAtHop > 0) {
          issue = `ITP/privacy restrictions removed tag at hop ${lostAtHop}`;
        } else if (lostAtHop > 0) {
          issue = `Parameter lost in redirect at hop ${lostAtHop}`;
        } else {
          issue = 'Parameter lost in redirect';
        }
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
        redirectCount: Math.max(0, chain.length - 1),
        affiliateTagPreserved,
        paramsLost,
        errorMessage,
        differsFromBaseline: false, // filled in below
        issue,
      };
    }),
  );

  // Mark environments that differ from the desktop_chrome baseline
  const baseline = envResults.find((r) => r.environmentId === 'desktop_chrome');
  if (baseline) {
    for (const r of envResults) {
      if (r.environmentId === 'desktop_chrome') continue;
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
    environments: envResults,
  });
}
