import { XMLParser } from 'fast-xml-parser';

export async function fetchSitemap(sitemapUrl: string): Promise<string[]> {
  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }

  const xml = await response.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml);

  // TODO: Handle different sitemap formats (urlset, sitemapindex, etc.)
  const urls: string[] = [];
  if (parsed.urlset && parsed.urlset.url) {
    const urlEntries = Array.isArray(parsed.urlset.url)
      ? parsed.urlset.url
      : [parsed.urlset.url];
    for (const entry of urlEntries) {
      if (entry.loc) {
        urls.push(entry.loc);
      }
    }
  }

  return urls;
}
