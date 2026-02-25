import { crawlSite } from './crawl';
import { discoverPages } from './sitemap';
import { extractOutboundLinks } from './link-extractor';
import { checkLink } from './link-checker';
import type { ScanOptions, ExtractedLink } from './types';

export { crawlSite } from './crawl';
export { fetchSitemap, parseSitemapXml, discoverPages } from './sitemap';
export { extractOutboundLinks } from './link-extractor';
export { checkLink } from './link-checker';
export { isAffiliateLink, classifyIssue } from './classifier';
export type { LinkCheckResult, ExtractedLink, PageLinks, ScanOptions } from './types';

export async function runScan(options: ScanOptions) {
  const { siteId, domain, sitemapUrl, maxPages, supabase } = options;

  // Create scan record
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

  const scanId = scan.id;
  let pagesScanned = 0;
  let linksChecked = 0;

  try {
    await logEvent(supabase, scanId, 'info', `Starting scan for ${domain}`);

    // 1. Discover pages
    let urls: string[] = [];
    try {
      urls = await discoverPages(domain, sitemapUrl, maxPages);
      await logEvent(supabase, scanId, 'info', `Found ${urls.length} URLs from sitemap`);
    } catch {
      await logEvent(supabase, scanId, 'info', `No sitemap found, falling back to crawl`);
    }

    if (urls.length === 0) {
      urls = await crawlSite(domain, 2, maxPages);
      await logEvent(supabase, scanId, 'info', `Crawled ${urls.length} URLs`);
    }

    // 2. For each page, fetch HTML and extract outbound links
    for (const pageUrl of urls) {
      try {
        const response = await fetch(pageUrl, {
          signal: AbortSignal.timeout(10000),
          headers: { 'User-Agent': 'LinkRescue-Crawler/1.0' },
        });

        if (!response.ok) continue;
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

        // Extract outbound links
        const outboundLinks = extractOutboundLinks(html, domain);

        // 3. Check each outbound link
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

          // Check the link
          const result = await checkLink(extLink);
          linksChecked++;

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

      // Mark scan as completed successfully
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        pages_scanned: pagesScanned,
        links_checked: linksChecked,
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
      })
      .eq('id', scanId);

    await logEvent(supabase, scanId, 'error', `Scan failed: ${msg}`);
    throw err;
  }

  return { scanId, pagesScanned, linksChecked };
}

async function logEvent(
  supabase: ScanOptions['supabase'],
  scanId: string,
  level: string,
  message: string
) {
  await supabase.from('scan_events').insert({ scan_id: scanId, level, message });
}
