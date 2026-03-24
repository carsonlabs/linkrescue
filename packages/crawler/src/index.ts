import { crawlSite } from './crawl';
import { discoverPages } from './sitemap';
import { extractOutboundLinks } from './link-extractor';
import { checkLink } from './link-checker';
import { validateFetchUrl, validateFetchUrlWithDns } from './url-safety';
import { getRobotsRules, isPathAllowed, clearRobotsCache } from './robots';
import { DomainLimiter } from './domain-limiter';
import {
  PAGE_FETCH_TIMEOUT_MS,
  CRAWL_DELAY_MS,
  CRAWLER_USER_AGENT,
} from './crawl-config';
import type { ScanOptions, ScanSummary } from './types';
import { createScanSummary } from './types';

export { crawlSite } from './crawl';
export { fetchSitemap, parseSitemapXml, discoverPages } from './sitemap';
export { extractOutboundLinks } from './link-extractor';
export { checkLink } from './link-checker';
export { isAffiliateLink, classifyIssue } from './classifier';
export { validateFetchUrl, isPrivateHost, validateFetchUrlWithDns, isPrivateIp } from './url-safety';
export { getRobotsRules, isPathAllowed, clearRobotsCache } from './robots';
export { DomainLimiter } from './domain-limiter';
export type { LinkCheckResult, ExtractedLink, PageLinks, ScanOptions, ScanSummary } from './types';
export { createScanSummary } from './types';

export async function runScan(options: ScanOptions) {
  const {
    scanId: existingScanId,
    siteId,
    domain,
    sitemapUrl,
    maxPages,
    crawlExclusions = [],
    supabase,
  } = options;
  const startTime = Date.now();
  const summary = createScanSummary();

  // Clear robots cache at scan start so we get fresh rules
  clearRobotsCache();

  // Use existing scanId if provided (worker already claimed it), otherwise create one.
  // The worker model creates the scan record as 'pending' and transitions to 'running'
  // before calling runScan. The legacy inline path (onboarding) creates its own.
  let scanId: string;
  if (existingScanId) {
    scanId = existingScanId;
  } else {
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        site_id: siteId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scanError || !scan) {
      throw new Error(`Failed to create scan: ${scanError?.message}`);
    }
    scanId = scan.id;
  }

  let pagesScanned = 0;
  let linksChecked = 0;

  // Pre-fetch robots.txt for the user's domain (used for page fetching)
  const origin = `https://${domain}`;
  const robotsRules = await getRobotsRules(origin);
  const delayMs =
    robotsRules.crawlDelay !== null
      ? Math.max(robotsRules.crawlDelay * 1000, CRAWL_DELAY_MS)
      : CRAWL_DELAY_MS;

  // Compile crawl exclusion patterns into regex matchers
  const exclusionMatchers = crawlExclusions
    .filter((p) => p.trim().length > 0)
    .map((pattern) => globToRegex(pattern));

  // Per-domain rate limiter for outbound link checks
  const domainLimiter = new DomainLimiter();
  const rateLimitedDomains = new Set<string>();

  try {
    await logEvent(supabase, scanId, 'info', `Starting scan for ${domain}`);

    // 1. Discover pages
    let urls: string[] = [];
    try {
      urls = await discoverPages(domain, sitemapUrl, maxPages);
      await logEvent(supabase, scanId, 'info', `Found ${urls.length} URLs from sitemap`);
    } catch (err) {
      console.error(`[crawler] Sitemap discovery failed for ${domain}:`, err);
      await logEvent(supabase, scanId, 'info', `No sitemap found, falling back to crawl`);
    }

    if (urls.length === 0) {
      urls = await crawlSite(domain, 2, maxPages);
      await logEvent(supabase, scanId, 'info', `Crawled ${urls.length} URLs`);
    }

    summary.pagesDiscovered = urls.length;

    // 2. For each page, fetch HTML and extract outbound links
    let pageIndex = 0;
    for (const pageUrl of urls) {
      try {
        // DNS-aware SSRF check on the page URL (pages are user-controlled domains)
        const parsed = await validateFetchUrlWithDns(pageUrl);
        if (!parsed) {
          summary.pagesSkippedSsrf++;
          continue;
        }

        // robots.txt check — respect disallowed paths on the user's own site
        if (!isPathAllowed(robotsRules, parsed.pathname)) {
          summary.pagesSkippedRobots++;
          continue;
        }

        // Customer crawl exclusions check
        if (isExcluded(parsed.pathname, exclusionMatchers)) {
          summary.pagesSkippedExclusions++;
          continue;
        }

        // Pacing: delay between page fetches to the user's domain
        if (pageIndex > 0) {
          await sleep(delayMs);
        }
        pageIndex++;

        const response = await fetch(pageUrl, {
          signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
          headers: { 'User-Agent': CRAWLER_USER_AGENT },
        });

        if (!response.ok) {
          summary.pagesFailedFetch++;
          continue;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) continue;

        const html = await response.text();

        // Upsert page
        const { data: page } = await supabase
          .from('pages')
          .upsert(
            { site_id: siteId, url: pageUrl, last_fetched_at: new Date().toISOString() },
            { onConflict: 'site_id,url' }
          )
          .select()
          .single();

        if (!page) continue;
        pagesScanned++;
        summary.pagesFetched++;

        // Extract outbound links
        const outboundLinks = extractOutboundLinks(html, domain);
        summary.linksFound += outboundLinks.length;

        // 3. Check each outbound link
        // Note: outbound link checks do NOT use robots.txt — see link-checker.ts
        // for the reasoning (link validation != crawling).
        for (const extLink of outboundLinks) {
          // Upsert link record
          const { data: linkRecord } = await supabase
            .from('links')
            .upsert(
              {
                site_id: siteId,
                page_id: page.id,
                href: extLink.href,
                is_affiliate: extLink.isAffiliate,
              },
              { onConflict: 'page_id,href' }
            )
            .select()
            .single();

          if (!linkRecord) continue;

          // Per-domain pacing for outbound link checks
          let linkHostname: string;
          try {
            linkHostname = new URL(extLink.href).hostname;
          } catch (err) {
            console.error(`[crawler] Invalid URL skipped: ${extLink.href}`, err);
            linkHostname = '';
          }
          if (linkHostname) {
            const delayed = await domainLimiter.acquire(linkHostname);
            if (delayed) {
              summary.linksDelayedByDomainPacing++;
            }
          }

          // Check the link (SSRF + retry handled inside checkLink)
          const result = await checkLink(extLink);
          linksChecked++;

          // Track observability counters
          if (result.statusCode === null && result.issueType === 'TIMEOUT') {
            summary.linksTimedOut++;
          }
          if (result.statusCode === null && result.issueType === 'OK' && !result.finalUrl) {
            summary.linksBlockedSsrf++;
          }
          if (result.statusCode === 429 && linkHostname) {
            rateLimitedDomains.add(linkHostname);
            domainLimiter.recordRateLimit(linkHostname);
          }

          // Store scan result
          await supabase.from('scan_results').insert({
            scan_id: scanId,
            link_id: linkRecord.id,
            status_code: result.statusCode,
            final_url: result.finalUrl,
            redirect_hops: result.redirectHops,
            issue_type: result.issueType,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await logEvent(supabase, scanId, 'warn', `Error processing ${pageUrl}: ${msg}`);
      }
    }

    // Finalize summary
    summary.durationMs = Date.now() - startTime;
    summary.domainsRateLimited = Array.from(rateLimitedDomains);

    // Mark scan as completed successfully
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        pages_scanned: pagesScanned,
        links_checked: linksChecked,
        scan_summary: summary,
      })
      .eq('id', scanId);

    await logEvent(
      supabase,
      scanId,
      'info',
      `Scan completed: ${pagesScanned} pages, ${linksChecked} links checked`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    summary.durationMs = Date.now() - startTime;
    summary.domainsRateLimited = Array.from(rateLimitedDomains);

    // IMPORTANT: Always update scan status to 'failed' on error
    // This ensures scans don't get stuck in 'running' state
    await supabase
      .from('scans')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: msg,
        pages_scanned: pagesScanned,
        links_checked: linksChecked,
        scan_summary: summary,
      })
      .eq('id', scanId);

    await logEvent(supabase, scanId, 'error', `Scan failed: ${msg}`);
    throw err;
  }

  return { scanId, pagesScanned, linksChecked };
}

/** Convert a simple glob pattern (with * wildcards) to a RegExp. */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

/** Check if a path matches any exclusion pattern. */
function isExcluded(pathname: string, matchers: RegExp[]): boolean {
  return matchers.some((re) => re.test(pathname));
}

async function logEvent(
  supabase: ScanOptions['supabase'],
  scanId: string,
  level: string,
  message: string
) {
  await supabase.from('scan_events').insert({ scan_id: scanId, level, message });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
