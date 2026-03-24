import {
  extractOutboundLinks,
  checkLink,
  discoverPages,
  crawlSite,
  DomainLimiter,
} from '@linkrescue/crawler';
import type { CheckedLink } from './types.js';

const PAGE_FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = 'LinkRescue-CLI/1.0 (+https://linkrescue.io)';

const FREE_MAX_PAGES = 20;

/**
 * Quick check: fetch a single page, extract outbound links, check each one.
 */
export async function checkSinglePage(
  url: string,
  onProgress?: (checked: number, total: number) => void,
): Promise<{ results: CheckedLink[]; durationMs: number }> {
  const startTime = Date.now();
  const domain = extractDomain(url);

  // Fetch the page
  const response = await fetch(url, {
    signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error(`URL is not an HTML page (content-type: ${contentType})`);
  }

  const html = await response.text();
  const outboundLinks = extractOutboundLinks(html, domain);

  // Check each link
  const domainLimiter = new DomainLimiter();
  const results: CheckedLink[] = [];

  for (let i = 0; i < outboundLinks.length; i++) {
    const extLink = outboundLinks[i];

    // Per-domain pacing
    try {
      const linkHostname = new URL(extLink.href).hostname;
      await domainLimiter.acquire(linkHostname);
    } catch {
      // Invalid URL, skip pacing
    }

    const result = await checkLink(extLink);
    results.push({
      pageUrl: url,
      href: result.href,
      statusCode: result.statusCode,
      finalUrl: result.finalUrl,
      redirectHops: result.redirectHops,
      issueType: result.issueType,
      isAffiliate: result.isAffiliate,
    });

    onProgress?.(i + 1, outboundLinks.length);
  }

  return { results, durationMs: Date.now() - startTime };
}

/**
 * Full scan: discover pages via sitemap/crawl, then check all outbound links.
 */
export async function scanSite(
  url: string,
  maxPages: number,
  onPageDiscovered?: (count: number) => void,
  onProgress?: (checked: number, total: number) => void,
): Promise<{ results: CheckedLink[]; pagesScanned: number; totalLinks: number; durationMs: number }> {
  const startTime = Date.now();
  const domain = extractDomain(url);

  // Enforce free CLI limit
  const effectiveMaxPages = Math.min(maxPages, FREE_MAX_PAGES);

  // Discover pages
  let urls: string[] = [];
  try {
    urls = await discoverPages(domain, null, effectiveMaxPages);
  } catch {
    // Sitemap failed, fall back to crawl
  }

  if (urls.length === 0) {
    urls = await crawlSite(domain, 2, effectiveMaxPages);
  }

  onPageDiscovered?.(urls.length);

  // Fetch each page and extract + check outbound links
  const domainLimiter = new DomainLimiter();
  const allResults: CheckedLink[] = [];
  let totalLinksFound = 0;
  let pagesScanned = 0;

  // First pass: collect all links from all pages
  interface PageLinkBatch {
    pageUrl: string;
    links: Array<{ href: string; isAffiliate: boolean }>;
  }
  const pageBatches: PageLinkBatch[] = [];

  for (const pageUrl of urls) {
    try {
      const response = await fetch(pageUrl, {
        signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const html = await response.text();
      const outboundLinks = extractOutboundLinks(html, domain);
      pagesScanned++;
      totalLinksFound += outboundLinks.length;

      pageBatches.push({ pageUrl, links: outboundLinks });
    } catch {
      // Skip failed pages
    }
  }

  // Second pass: check all links with progress tracking
  let checkedCount = 0;
  for (const batch of pageBatches) {
    for (const extLink of batch.links) {
      // Per-domain pacing
      try {
        const linkHostname = new URL(extLink.href).hostname;
        await domainLimiter.acquire(linkHostname);
      } catch {
        // Invalid URL, skip pacing
      }

      const result = await checkLink(extLink);
      allResults.push({
        pageUrl: batch.pageUrl,
        href: result.href,
        statusCode: result.statusCode,
        finalUrl: result.finalUrl,
        redirectHops: result.redirectHops,
        issueType: result.issueType,
        isAffiliate: result.isAffiliate,
      });

      checkedCount++;
      onProgress?.(checkedCount, totalLinksFound);
    }
  }

  return {
    results: allResults,
    pagesScanned,
    totalLinks: totalLinksFound,
    durationMs: Date.now() - startTime,
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}
