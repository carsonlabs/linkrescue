import type { IssueType } from '@linkrescue/types';

const AFFILIATE_PATTERNS = [
  /[?&]ref=/i,
  /[?&]aff=/i,
  /[?&]affiliate/i,
  /[?&]tag=/i,
  /[?&]utm_/i,
];

const AFFILIATE_DOMAINS = [
  'amzn.to',
  'shareasale.com',
  'cj.com',
  'commission-junction.com',
  'impact.com',
  'clickbank.net',
  'clickbank.com',
  'jdoqocy.com',
  'tkqlhce.com',
  'dpbolvw.net',
  'anrdoezrs.net',
  'kqzyfj.com',
  'avantlink.com',
  'partnerize.com',
  'pepperjam.com',
  'flexoffers.com',
  'awin1.com',
  'webgains.com',
  'rakuten.com',
  'rakutenmarketing.com',
  'linksynergy.com',
  'go.skimresources.com',
  'skimlinks.com',
  'redirectingat.com',
  'partnerstack.com',
  'refersion.com',
];

export function isAffiliateLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check known affiliate domains
    if (AFFILIATE_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return true;
    }

    // Check URL patterns
    const fullUrl = parsed.href;
    if (AFFILIATE_PATTERNS.some((pattern) => pattern.test(fullUrl))) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function classifyIssue(
  statusCode: number | null,
  finalUrl: string | null,
  originalUrl: string,
  timedOut: boolean
): IssueType {
  if (timedOut) return 'TIMEOUT';

  if (statusCode === null) return 'TIMEOUT';

  if (statusCode >= 400 && statusCode < 500) return 'BROKEN_4XX';
  if (statusCode >= 500) return 'SERVER_5XX';

  if (statusCode >= 200 && statusCode < 400 && finalUrl) {
    // Check redirect to home
    if (isRedirectToHome(finalUrl, originalUrl)) return 'REDIRECT_TO_HOME';

    // Check lost params
    if (hasLostParams(originalUrl, finalUrl)) return 'LOST_PARAMS';
  }

  return 'OK';
}

function isRedirectToHome(finalUrl: string, originalUrl: string): boolean {
  try {
    const final = new URL(finalUrl);
    const original = new URL(originalUrl);

    const originalPath = original.pathname.replace(/\/+$/, '');
    const finalPath = final.pathname.replace(/\/+$/, '');

    // Skip if the original link was already pointing to the root.
    // That's a homepage link, not a redirect-to-home issue.
    if (originalPath === '' || originalPath === '/') return false;

    // Flag only when the original path was non-root but final resolved to root.
    // apex/www canonicalization (hostname mismatch, same root path) is NOT a real issue
    // if the link already targeted the root — but if it targeted a deep path that got
    // flattened to `/`, that IS a lost-context redirect.
    const finalIsRoot = finalPath === '' || finalPath === '/';
    if (!finalIsRoot) return false;

    // Final is root AND original had a real path — genuine lost-context redirect.
    return true;
  } catch {
    return false;
  }
}

function hasLostParams(originalUrl: string, finalUrl: string): boolean {
  try {
    const original = new URL(originalUrl);
    const final = new URL(finalUrl);

    if (original.search && !final.search) return true;

    // Check if important params were dropped
    const originalParams = new Set(original.searchParams.keys());
    const finalParams = new Set(final.searchParams.keys());

    for (const param of originalParams) {
      if (!finalParams.has(param)) return true;
    }
  } catch {
    // ignore
  }
  return false;
}
