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

/** Concurrent link-check workers. Per-domain pacing still applies via DomainLimiter. */
const LINK_CHECK_CONCURRENCY = 5;

/** Fraction of the time budget reserved for page discovery + fetching. */
const PAGE_PHASE_BUDGET_FRACTION = 0.4;

/**
 * Fraction of the budget URL discovery (sitemap fetching) may consume.
 * Without this cap a large sitemap index (5 child fetches × 10s timeouts)
 * can eat the entire page phase before a single page is scanned.
 */
const DISCOVERY_BUDGET_FRACTION = 0.15;

/**
 * Rescue floor: when discovery overruns the page-phase deadline, still
 * attempt at least this many pages (until the hard cap below) so a slow
 * sitemap degrades a scan to "few pages", never "zero pages".
 */
const MIN_PAGES_WHEN_BUDGETED = 5;
const PAGE_PHASE_HARD_CAP_FRACTION = 0.7;

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

export interface ScanSiteResult {
  results: CheckedLink[];
  pagesScanned: number;
  totalLinks: number;
  durationMs: number;
  /** True when the time budget cut the scan short — results are partial. */
  budgetExhausted: boolean;
  /** Pages discovered but not fetched because the page-phase budget ran out. */
  pagesSkippedBudget: number;
  /** Links found but not checked because the budget ran out. */
  linksSkippedBudget: number;
}

/**
 * Full scan: discover pages via sitemap/crawl, then check all outbound links.
 *
 * When `budgetMs` is set, the scan self-terminates gracefully at the deadline
 * and returns whatever it has — partial results always beat a killed process.
 * Phase split: URL discovery gets at most 15% of the budget, page fetching
 * runs to the 40% mark (with a rescue floor of a few pages up to 70% when
 * discovery overran), and the link-check phase (the actual payload) gets the
 * remainder.
 */
export async function scanSite(
  url: string,
  maxPages: number,
  onPageDiscovered?: (count: number) => void,
  onProgress?: (checked: number, total: number) => void,
  budgetMs?: number,
): Promise<ScanSiteResult> {
  const startTime = Date.now();
  const domain = extractDomain(url);

  const deadline = budgetMs && budgetMs > 0 ? startTime + budgetMs : Number.POSITIVE_INFINITY;
  const pageDeadline =
    deadline === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : startTime + Math.floor((budgetMs as number) * PAGE_PHASE_BUDGET_FRACTION);
  const discoveryDeadline =
    deadline === Number.POSITIVE_INFINITY
      ? undefined
      : startTime + Math.floor((budgetMs as number) * DISCOVERY_BUDGET_FRACTION);
  const pageHardCap =
    deadline === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : startTime + Math.floor((budgetMs as number) * PAGE_PHASE_HARD_CAP_FRACTION);

  // Enforce free CLI limit
  const effectiveMaxPages = Math.min(maxPages, FREE_MAX_PAGES);

  // Discover pages (sitemap first, crawl fallback) — sitemap fetching is
  // bounded by the discovery deadline so it can't consume the page phase
  let urls: string[] = [];
  try {
    urls = await discoverPages(domain, null, effectiveMaxPages, discoveryDeadline);
  } catch {
    // Sitemap failed, fall back to crawl
  }

  if (urls.length === 0) {
    urls = await crawlSite(
      domain,
      2,
      effectiveMaxPages,
      pageDeadline === Number.POSITIVE_INFINITY ? undefined : pageDeadline,
    );
  }

  onPageDiscovered?.(urls.length);

  const allResults: CheckedLink[] = [];
  let totalLinksFound = 0;
  let pagesScanned = 0;
  let pagesSkippedBudget = 0;

  // First pass: fetch pages and collect outbound links (bounded by pageDeadline)
  interface QueuedLink {
    pageUrl: string;
    href: string;
    isAffiliate: boolean;
  }
  const linkQueue: QueuedLink[] = [];

  for (let i = 0; i < urls.length; i++) {
    if (Date.now() > pageDeadline) {
      // Rescue floor: if discovery overran the page phase, keep attempting
      // pages (up to the hard cap) until a minimum have been scanned —
      // otherwise a slow sitemap zeroes out the entire scan.
      const rescueApplies =
        pagesScanned < MIN_PAGES_WHEN_BUDGETED && Date.now() <= pageHardCap;
      if (!rescueApplies) {
        pagesSkippedBudget = urls.length - i;
        break;
      }
    }
    const pageUrl = urls[i];
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

      for (const link of outboundLinks) {
        linkQueue.push({ pageUrl, href: link.href, isAffiliate: link.isAffiliate });
      }
    } catch {
      // Skip failed pages
    }
  }

  // Second pass: check links with a small worker pool. Different domains run
  // concurrently; same-domain links are still paced by the DomainLimiter
  // (slot-reservation based, safe under concurrency).
  const domainLimiter = new DomainLimiter();
  let nextIndex = 0;
  let checkedCount = 0;
  let linksSkippedBudget = 0;

  async function worker(): Promise<void> {
    while (true) {
      if (nextIndex >= linkQueue.length) return;
      if (Date.now() > deadline) {
        // Claim everything left so other workers stop too
        linksSkippedBudget += linkQueue.length - nextIndex;
        nextIndex = linkQueue.length;
        return;
      }
      const item = linkQueue[nextIndex++];

      try {
        const linkHostname = new URL(item.href).hostname;
        await domainLimiter.acquire(linkHostname);
      } catch {
        // Invalid URL, skip pacing
      }

      const result = await checkLink({ href: item.href, isAffiliate: item.isAffiliate });
      allResults.push({
        pageUrl: item.pageUrl,
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

  const workerCount = Math.min(LINK_CHECK_CONCURRENCY, Math.max(linkQueue.length, 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return {
    results: allResults,
    pagesScanned,
    totalLinks: totalLinksFound,
    durationMs: Date.now() - startTime,
    budgetExhausted: pagesSkippedBudget > 0 || linksSkippedBudget > 0,
    pagesSkippedBudget,
    linksSkippedBudget,
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}
