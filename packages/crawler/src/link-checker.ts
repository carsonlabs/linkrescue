import { classifyIssue } from './classifier';
import type { LinkCheckResult, ExtractedLink } from './types';

const MAX_REDIRECT_HOPS = 5;
const TIMEOUT_MS = 10000;

export async function checkLink(link: ExtractedLink): Promise<LinkCheckResult> {
  const { href, isAffiliate } = link;

  try {
    const result = await followRedirects(href);
    const issueType = classifyIssue(result.statusCode, result.finalUrl, href, false);

    return {
      href,
      statusCode: result.statusCode,
      finalUrl: result.finalUrl,
      redirectHops: result.hops,
      issueType,
      isAffiliate,
    };
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError');

    return {
      href,
      statusCode: null,
      finalUrl: null,
      redirectHops: 0,
      issueType: isTimeout ? 'TIMEOUT' : 'TIMEOUT',
      isAffiliate,
    };
  }
}

async function followRedirects(
  url: string
): Promise<{ statusCode: number; finalUrl: string; hops: number }> {
  let currentUrl = url;
  let hops = 0;

  while (hops < MAX_REDIRECT_HOPS) {
    // Try HEAD first, then GET fallback
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'LinkRescue-Checker/1.0' },
      });
    } catch {
      // HEAD failed, try GET
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'LinkRescue-Checker/1.0' },
      });
    }

    const status = response.status;

    // Not a redirect, we're done
    if (status < 300 || status >= 400) {
      return { statusCode: status, finalUrl: currentUrl, hops };
    }

    // It's a redirect
    const location = response.headers.get('location');
    if (!location) {
      return { statusCode: status, finalUrl: currentUrl, hops };
    }

    // Resolve relative redirects
    try {
      currentUrl = new URL(location, currentUrl).href;
    } catch {
      return { statusCode: status, finalUrl: currentUrl, hops };
    }

    hops++;
  }

  // Too many redirects — do a final check on the last URL
  try {
    const finalResponse = await fetch(currentUrl, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'LinkRescue-Checker/1.0' },
    });
    return { statusCode: finalResponse.status, finalUrl: currentUrl, hops };
  } catch {
    return { statusCode: 0, finalUrl: currentUrl, hops };
  }
}

export async function checkLinks(
  pageUrls: string[],
  _domain: string
): Promise<LinkCheckResult[]> {
  // Kept for backwards compatibility — real usage goes through runScan
  return [];
}
