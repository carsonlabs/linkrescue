import { NextRequest, NextResponse } from 'next/server';

const AFFILIATE_PARAMS = new Set([
  'ref', 'aff', 'affiliate', 'partner', 'tag', 'utm_source', 'utm_medium', 'utm_campaign',
  'subid', 'sub_id', 'clickref', 'cid', 'pid', 'aid', 'rid', 'tid', 'source',
]);

const AFFILIATE_DOMAINS = [
  'amzn.to', 'amazon.com', 'shareasale.com', 'cj.com', 'awin1.com', 'prf.hn',
  'go.redirectingat.com', 'click.linksynergy.com', 'commission-junction.com',
  'impact.com', 'partnerize.com', 'rakuten.com', 'flexoffers.com',
];

interface HopInfo {
  url: string;
  status: number;
}

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
    if (AFFILIATE_PARAMS.has(key.toLowerCase())) {
      foundParams.push(key);
    }
  }

  const isAffiliateDomain = AFFILIATE_DOMAINS.some(
    (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`),
  );

  return { isAffiliate: isAffiliateDomain || foundParams.length > 0, params: foundParams };
}

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

  // Normalise — add https:// if no scheme
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

  // Affiliate detection on the input URL
  const affiliateInfo = detectAffiliate(urlStr);

  // Follow redirect chain manually (up to 8 hops)
  const chain: HopInfo[] = [];
  let current = urlStr;
  let finalStatus = 0;
  let errorMessage: string | null = null;

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
          headers: {
            'User-Agent':
              'LinkRescue-Checker/1.0 (https://linkrescue.io; link health check)',
            Accept: '*/*',
          },
        });
      } catch (err: unknown) {
        // HEAD not supported by some servers — try GET
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
          headers: {
            'User-Agent': 'LinkRescue-Checker/1.0 (https://linkrescue.io)',
          },
        });
      } finally {
        clearTimeout(timeout);
      }

      chain.push({ url: current, status: res.status });
      finalStatus = res.status;

      // Follow redirect
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) break;

        // Resolve relative redirects
        try {
          current = new URL(location, current).toString();
        } catch {
          break;
        }

        // SSRF check on redirect destination
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
      finalStatus = 0;
    } else {
      errorMessage = 'Could not reach URL';
      finalStatus = 0;
    }
  }

  const finalUrl = chain.at(-1)?.url ?? urlStr;
  const finalAffiliate = detectAffiliate(finalUrl);

  // Check if affiliate params were lost during redirect
  const paramsLost =
    affiliateInfo.isAffiliate &&
    affiliateInfo.params.length > 0 &&
    chain.length > 1 &&
    finalAffiliate.params.length < affiliateInfo.params.length;

  let status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  if (errorMessage?.includes('timed out')) {
    status = 'timeout';
  } else if (finalStatus >= 200 && finalStatus < 300) {
    status = chain.length > 1 ? 'redirect' : 'ok';
  } else if (finalStatus >= 400 || finalStatus === 0) {
    status = 'broken';
  } else {
    status = 'error';
  }

  return NextResponse.json({
    status,
    finalStatus,
    originalUrl: urlStr,
    finalUrl,
    chain,
    redirectCount: Math.max(0, chain.length - 1),
    isAffiliate: affiliateInfo.isAffiliate,
    affiliateParams: affiliateInfo.params,
    paramsLost,
    errorMessage,
  });
}
