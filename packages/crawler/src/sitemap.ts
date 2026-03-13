import { XMLParser } from 'fast-xml-parser';
import { PAGE_FETCH_TIMEOUT_MS, CRAWLER_USER_AGENT } from './crawl-config';

const parser = new XMLParser({ ignoreAttributes: false });

export async function fetchSitemap(sitemapUrl: string, maxUrls = 500): Promise<string[]> {
  const response = await fetch(sitemapUrl, {
    signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': CRAWLER_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseSitemapXml(xml, maxUrls);
}

export function parseSitemapXml(xml: string, maxUrls = 500): string[] {
  const parsed = parser.parse(xml);
  const urls: string[] = [];

  // Handle sitemap index
  if (parsed.sitemapindex?.sitemap) {
    const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
      ? parsed.sitemapindex.sitemap
      : [parsed.sitemapindex.sitemap];

    // For sitemap index, we just collect the sitemap URLs themselves
    // The caller should recursively fetch these
    for (const s of sitemaps) {
      const loc = s.loc || s['loc'];
      if (loc && urls.length < maxUrls) {
        urls.push(loc);
      }
    }
    return urls;
  }

  // Handle regular urlset
  if (parsed.urlset?.url) {
    const entries = Array.isArray(parsed.urlset.url)
      ? parsed.urlset.url
      : [parsed.urlset.url];

    for (const entry of entries) {
      const loc = entry.loc || entry['loc'];
      if (loc && urls.length < maxUrls) {
        urls.push(loc);
      }
    }
  }

  return urls;
}

export async function discoverPages(
  domain: string,
  sitemapUrl: string | null,
  maxPages: number
): Promise<string[]> {
  const urls: string[] = [];

  // Try provided sitemap URL first
  const sitemapCandidates = sitemapUrl
    ? [sitemapUrl, `https://${domain}/sitemap.xml`]
    : [`https://${domain}/sitemap.xml`];

  for (const candidate of sitemapCandidates) {
    try {
      const found = await fetchSitemap(candidate, maxPages);
      if (found.length > 0) {
        // Check if these are sub-sitemaps (sitemap index)
        const isSitemapIndex = found.every((u) => u.endsWith('.xml') || u.includes('sitemap'));

        if (isSitemapIndex) {
          // Fetch each sub-sitemap
          for (const subUrl of found.slice(0, 5)) {
            try {
              const subUrls = await fetchSitemap(subUrl, maxPages - urls.length);
              urls.push(...subUrls);
              if (urls.length >= maxPages) break;
            } catch {
              // Skip failed sub-sitemaps
            }
          }
        } else {
          urls.push(...found);
        }
        break; // Use the first working sitemap
      }
    } catch {
      // Try next candidate
    }
  }

  return urls.slice(0, maxPages);
}
