import { classifyIssue } from './classifier';
import { validateFetchUrlWithDns } from './url-safety';
import {
  LINK_CHECK_TIMEOUT_MS,
  MAX_REDIRECT_HOPS,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
  RETRY_JITTER_MAX_MS,
  CHECKER_USER_AGENT,
} from './crawl-config';
import type { LinkCheckResult, ExtractedLink } from './types';

/**
 * Check a single outbound link for reachability and attribution integrity.
 *
 * This is used for validating external affiliate destinations — it does NOT
 * respect robots.txt on the target domain. robots.txt governs crawling (page
 * discovery / indexing), not one-off link validation requests. We send HEAD
 * requests only, with clear bot UA, which is standard for link checkers.
 */
export async function checkLink(link: ExtractedLink): Promise<LinkCheckResult> {
  const { href, isAffiliate } = link;

  // SSRF: block private/internal hosts (DNS-aware — resolves hostname to check IPs)
  if (!(await validateFetchUrlWithDns(href))) {
    return {
      href,
      statusCode: null,
      finalUrl: null,
      redirectHops: 0,
      issueType: 'OK', // silently skip — not a real broken link
      isAffiliate,
    };
  }

  // Attempt with retries for transient failures
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await retryDelay(attempt);
    }

    try {
      const result = await followRedirects(href);

      // Don't retry 403 — it's a deliberate block, not transient
      if (result.statusCode === 403) {
        return makeResult(link, result);
      }

      // Retry 429 (rate limited) and 5xx (server error) on next attempt
      if (result.statusCode === 429 || result.statusCode >= 500) {
        // If we got a Retry-After header and this is a 429, respect it
        // but only up to 30 seconds to avoid blocking the scan
        lastError = new Error(`HTTP ${result.statusCode}`);
        if (attempt < MAX_RETRIES) continue;
        // Out of retries — return what we have
        return makeResult(link, result);
      }

      // Success or 4xx (not 403/429) — return immediately
      return makeResult(link, result);
    } catch (error) {
      lastError = error;
      const isTransient =
        error instanceof Error &&
        (error.name === 'TimeoutError' ||
          error.name === 'AbortError' ||
          error.message.includes('fetch failed'));

      if (!isTransient || attempt >= MAX_RETRIES) {
        // Non-transient or out of retries
        return {
          href,
          statusCode: null,
          finalUrl: null,
          redirectHops: 0,
          issueType: 'TIMEOUT',
          isAffiliate,
        };
      }
      // Transient — retry
    }
  }

  // Should not reach here, but safety net
  return {
    href,
    statusCode: null,
    finalUrl: null,
    redirectHops: 0,
    issueType: 'TIMEOUT',
    isAffiliate,
  };
}

function makeResult(
  link: ExtractedLink,
  result: { statusCode: number; finalUrl: string; hops: number }
): LinkCheckResult {
  const issueType = classifyIssue(result.statusCode, result.finalUrl, link.href, false);
  return {
    href: link.href,
    statusCode: result.statusCode,
    finalUrl: result.finalUrl,
    redirectHops: result.hops,
    issueType,
    isAffiliate: link.isAffiliate,
  };
}

async function followRedirects(
  url: string
): Promise<{ statusCode: number; finalUrl: string; hops: number }> {
  let currentUrl = url;
  let hops = 0;

  while (hops < MAX_REDIRECT_HOPS) {
    // SSRF check on each redirect hop (DNS-aware)
    if (!(await validateFetchUrlWithDns(currentUrl))) {
      return { statusCode: 0, finalUrl: currentUrl, hops };
    }

    // Try HEAD first, then GET fallback
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(LINK_CHECK_TIMEOUT_MS),
        headers: { 'User-Agent': CHECKER_USER_AGENT },
      });
    } catch {
      // HEAD failed, try GET
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(LINK_CHECK_TIMEOUT_MS),
        headers: { 'User-Agent': CHECKER_USER_AGENT },
      });
    }

    const status = response.status;

    // Not a redirect — done
    if (status < 300 || status >= 400) {
      return { statusCode: status, finalUrl: currentUrl, hops };
    }

    // Redirect — follow location
    const location = response.headers.get('location');
    if (!location) {
      return { statusCode: status, finalUrl: currentUrl, hops };
    }

    try {
      currentUrl = new URL(location, currentUrl).href;
    } catch {
      return { statusCode: status, finalUrl: currentUrl, hops };
    }

    hops++;
  }

  // Too many redirects — final check
  try {
    if (!(await validateFetchUrlWithDns(currentUrl))) {
      return { statusCode: 0, finalUrl: currentUrl, hops };
    }
    const finalResponse = await fetch(currentUrl, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(LINK_CHECK_TIMEOUT_MS),
      headers: { 'User-Agent': CHECKER_USER_AGENT },
    });
    return { statusCode: finalResponse.status, finalUrl: currentUrl, hops };
  } catch {
    return { statusCode: 0, finalUrl: currentUrl, hops };
  }
}

/**
 * Exponential backoff with jitter.
 */
async function retryDelay(attempt: number): Promise<void> {
  const base = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
  const jitter = Math.random() * RETRY_JITTER_MAX_MS;
  await new Promise((resolve) => setTimeout(resolve, base + jitter));
}

export async function checkLinks(
  pageUrls: string[],
  _domain: string
): Promise<LinkCheckResult[]> {
  // Kept for backwards compatibility — real usage goes through runScan
  return [];
}
