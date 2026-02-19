import { crawlSite } from './crawl';
import { fetchSitemap } from './sitemap';
import { checkLinks } from './link-checker';

export { crawlSite, fetchSitemap, checkLinks };

export async function runScan(site: { id: string; domain: string }) {
  console.log(`Starting scan for ${site.domain}...`);

  // 1. Get pages to scan
  let urls: string[] = [];
  try {
    const sitemapUrls = await fetchSitemap(`https://${site.domain}/sitemap.xml`);
    urls = sitemapUrls.slice(0, 100); // Limit for MVP
    console.log(`Found ${urls.length} URLs in sitemap.`);
  } catch (error) {
    console.warn(`Sitemap not found for ${site.domain}, falling back to crawl.`);
    const crawledUrls = await crawlSite(site.domain, 2); // Depth 2
    urls = crawledUrls.slice(0, 100); // Limit for MVP
    console.log(`Crawled ${urls.length} URLs.`);
  }

  // 2. Check links on each page
  const results = await checkLinks(urls, site.domain);
  console.log(`Scan complete. Found ${results.length} total links.`);

  // 3. TODO: Store results in Supabase
  // - Create a `scan` record
  // - For each URL, create/update a `page` record
  // - For each link found, create/update a `link` record with its status

  return results;
}
