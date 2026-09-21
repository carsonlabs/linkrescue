import type { IssueType } from '@linkrescue/types';

import {
  assessAttribution,
  isAffiliateLink,
  isAmazonUrl,
  isBotWallLanding,
  isExpiredProgramLanding,
} from './attribution';

export { isAffiliateLink };

export function classifyIssue(
  statusCode: number | null,
  finalUrl: string | null,
  originalUrl: string,
  timedOut: boolean
): IssueType {
  if (timedOut) return 'TIMEOUT';

  if (statusCode === null) return 'TIMEOUT';

  // Bot-blocks, not breaks: 403 (forbidden to bots), 405 (HEAD rejected),
  // 429 (rate limited). These survive even the GET retry in the link checker,
  // but the link almost always works for a human visitor. Reporting them as
  // broken is crying wolf — June 2026 study run 1 had 1,000 of 1,474 "4xx"
  // links in this category.
  if (statusCode === 403 || statusCode === 405 || statusCode === 429) return 'BLOCKED';

  if (statusCode >= 400 && statusCode < 500) return 'BROKEN_4XX';

  // Amazon answers automated checkers with 500/503 when throttling; a product
  // that is really gone returns 404. Seen on every amzn.to link in the Sept re-run test.
  if (statusCode >= 500 && finalUrl && isAmazonUrl(finalUrl)) return 'BLOCKED';
  if (statusCode >= 500) return 'SERVER_5XX';

  if (statusCode >= 200 && statusCode < 400 && finalUrl) {
    // Landed on a captcha / bot wall: we could not see the real destination.
    if (isBotWallLanding(finalUrl)) return 'BLOCKED';

    // The link "works" but the affiliate program behind it is gone — the
    // commission-bearing failure a human clicking through would still miss.
    if (isAffiliateLink(originalUrl) && isExpiredProgramLanding(finalUrl)) return 'SOFT_404';

    if (isRedirectToHome(finalUrl, originalUrl)) return 'REDIRECT_TO_HOME';

    // Only affiliate tracking counts, and only when it never reached the
    // tracker. A network consuming its own params is delivery, not loss.
    if (assessAttribution(originalUrl, finalUrl).outcome === 'lost') return 'LOST_PARAMS';
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
