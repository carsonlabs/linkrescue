import { crawlSite } from './crawl';
import { discoverPages } from './sitemap';
import { extractOutboundLinks } from './link-extractor';
import { checkLink } from './link-checker';
import { validateFetchUrl, validateFetchUrlWithDns } from './url-safety';
import { getRobotsRules, isPathAllowed, clearRobotsCache } from './robots';
import { DomainLimiter } from './domain-limiter';
import { detectSoft404 } from './soft-404';
import { extractTextContent, hashContent, detectContentChange } from './content-hash';
import { checkWaybackArchive } from './wayback';
import {
  PAGE_FETCH_TIMEOUT_MS,
  CRAWL_DELAY_MS,
  LINK_CHECK_TIMEOUT_MS,
  CHECKER_USER_AGENT,
} from './crawl-config';
import { fetchWithCrawlerFallback } from './browser-fetch';
import type { ScanOptions, ScanSummary } from './types';
import { createScanSummary } from './types';
import { estimateValueCents, type IssueTypeKey } from '@linkrescue/types';

export { crawlSite } from './crawl';
export { fetchSitemap, parseSitemapXml, discoverPages } from './sitemap';
export { extractOutboundLinks } from './link-extractor';
export { checkLink } from './link-checker';
export { isAffiliateLink, classifyIssue } from './classifier';
export { validateFetchUrl, isPrivateHost, validateFetchUrlWithDns, isPrivateIp, safeFetch, SsrfError } from './url-safety';
export type { SafeFetchOptions } from './url-safety';
export { getRobotsRules, isPathAllowed, clearRobotsCache } from './robots';
export { DomainLimiter } from './domain-limiter';
export { detectSoft404 } from './soft-404';
export { extractTextContent, hashContent, detectContentChange } from './content-hash';
export { checkWaybackArchive } from './wayback';
export { fetchWithCrawlerFallback, BROWSER_HEADERS, resetCrawlerFallbackMemory } from './browser-fetch';
export type { CrawlerFetchOptions, CrawlerFetchResult } from './browser-fetch';
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
    userTier = 'free',
    maxDurationMs,
    supabase,
  } = options;
  const startTime = Date.now();
  const summary = createScanSummary();
  const deadline = maxDurationMs && maxDurationMs > 0 ? startTime + maxDurationMs : Number.POSITIVE_INFINITY;
  const budgetExceeded = () => Date.now() > deadline;
  let budgetLogged = false;

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
      urls = await crawlSite(domain, 2, maxPages, undefined, (tier) => {
        if (tier === 'browser') summary.pagesFetchedViaBrowserProfile++;
        else summary.pagesFetchedViaHeadless++;
      });
      await logEvent(supabase, scanId, 'info', `Crawled ${urls.length} URLs`);
    }

    summary.pagesDiscovered = urls.length;

    // 2. For each page, fetch HTML and extract outbound links
    let pageIndex = 0;
    for (const pageUrl of urls) {
      // Time budget: stop starting new pages, finalize gracefully with
      // partial results (always better than a platform-level kill).
      if (budgetExceeded() || summary.budgetExhausted) {
        summary.budgetExhausted = true;
        if (!budgetLogged) {
          budgetLogged = true;
          await logEvent(supabase, scanId, 'warn', 'Scan time budget reached — finishing with partial results');
        }
        break;
      }
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

        const { response, usedBrowserFallback, usedHeadlessFallback } = await fetchWithCrawlerFallback(pageUrl, {
          timeoutMs: PAGE_FETCH_TIMEOUT_MS,
        });
        if (usedBrowserFallback) {
          summary.pagesFetchedViaBrowserProfile++;
        }
        if (usedHeadlessFallback) {
          summary.pagesFetchedViaHeadless++;
        }

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
          // Time budget check per link — the outer page-loop check finalizes.
          if (budgetExceeded()) {
            summary.budgetExhausted = true;
            break;
          }
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

          // ── Phase 3: Advanced detection ──

          let finalIssueType = result.issueType;
          let waybackUrl: string | null = null;
          let contentHash: string | null = null;

          // Soft-404 + Content change: fetch body for links that returned 200-299
          if (
            result.issueType === 'OK' &&
            result.finalUrl &&
            result.statusCode !== null &&
            result.statusCode >= 200 &&
            result.statusCode < 300
          ) {
            try {
              const bodyRes = await fetch(result.finalUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(LINK_CHECK_TIMEOUT_MS),
                headers: { 'User-Agent': CHECKER_USER_AGENT },
              });
              const bodyContentType = bodyRes.headers.get('content-type') || '';
              if (bodyContentType.includes('text/html') && bodyRes.ok) {
                const bodyHtml = await bodyRes.text();

                // Soft-404 check
                const soft404 = detectSoft404(bodyHtml);
                if (soft404.isSoft404) {
                  finalIssueType = 'SOFT_404';
                }

                // Content change check — compare with stored hash
                const currentText = extractTextContent(bodyHtml);
                contentHash = hashContent(currentText);

                if (linkRecord.content_hash && linkRecord.content_text) {
                  const change = detectContentChange(bodyHtml, linkRecord.content_text);
                  if (change.hasChanged && finalIssueType === 'OK') {
                    finalIssueType = 'CONTENT_CHANGED';
                  }
                }
              }
            } catch {
              // Body fetch failed — not critical, keep original result
            }
          }

          // Wayback Machine: for broken links, check for archived version
          if (
            (finalIssueType === 'BROKEN_4XX' || finalIssueType === 'SOFT_404') &&
            result.href
          ) {
            try {
              const wayback = await checkWaybackArchive(result.href);
              if (wayback.hasArchive) {
                waybackUrl = wayback.archiveUrl;
              }
            } catch {
              // Wayback check failed — not critical
            }
          }

          // Update link record with content hash and text for future comparisons
          if (contentHash) {
            const updateData: Record<string, string> = { content_hash: contentHash };
            // Only store text on first scan or if content changed
            if (!linkRecord.content_hash || finalIssueType === 'CONTENT_CHANGED') {
              const bodyText = await fetchBodyText(result.finalUrl);
              if (bodyText) {
                // Store truncated text (max 10KB) for future comparison
                updateData.content_text = bodyText.slice(0, 10_000);
              }
            }
            await supabase.from('links').update(updateData).eq('id', linkRecord.id);
          }

          // Bot-blocked links (403/405/429 after GET retry) almost always work
          // for human visitors — persist them as OK so customer dashboards,
          // digests, and health scores don't cry wolf. Tracked in the scan
          // summary for observability. (Full BLOCKED-in-dashboard visibility
          // is a follow-up: every `.neq('issue_type','OK')` query site needs
          // auditing before the type can flow into scan_results.)
          if (finalIssueType === 'BLOCKED') {
            summary.linksBotBlocked++;
          }
          const persistedIssueType = finalIssueType === 'BLOCKED' ? 'OK' : finalIssueType;

          // Compute estimated $ at risk for this issue (powers the scoreboard).
          const estimatedValueCents = estimateValueCents({
            tier: userTier,
            issueType: persistedIssueType as IssueTypeKey,
            isAffiliate: result.isAffiliate,
          });

          // Store scan result
          await supabase.from('scan_results').insert({
            scan_id: scanId,
            link_id: linkRecord.id,
            status_code: result.statusCode,
            final_url: result.finalUrl,
            redirect_hops: result.redirectHops,
            issue_type: persistedIssueType,
            wayback_url: waybackUrl,
            estimated_value_cents: estimatedValueCents,
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

/** Fetch body text for a URL (for content hash storage). Returns null on failure. */
async function fetchBodyText(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(LINK_CHECK_TIMEOUT_MS),
      headers: { 'User-Agent': CHECKER_USER_AGENT },
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    const html = await res.text();
    return extractTextContent(html);
  } catch {
    return null;
  }
}
