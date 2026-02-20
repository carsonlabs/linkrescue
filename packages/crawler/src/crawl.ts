import * as cheerio from 'cheerio/slim';

export async function crawlSite(
  domain: string,
  maxDepth: number,
  maxPages: number = 50
): Promise<string[]> {
  const visited = new Set<string>();
  const toVisit: Array<{ url: string; depth: number }> = [
    { url: `https://${domain}`, depth: 0 },
  ];

  while (toVisit.length > 0 && visited.size < maxPages) {
    const { url, depth } = toVisit.shift()!;

    if (visited.has(url) || depth > maxDepth) continue;
    visited.add(url);

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'LinkRescue-Crawler/1.0' },
      });

      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      $('a[href]').each((_, el) => {
        if (visited.size + toVisit.length >= maxPages) return;

        const href = $(el).attr('href');
        if (!href) return;

        try {
          const resolved = new URL(href, url);
          // Same domain only
          if (resolved.hostname.toLowerCase() !== domain.toLowerCase()) return;
          // Only http(s)
          if (!resolved.protocol.startsWith('http')) return;
          // Remove hash
          resolved.hash = '';
          const normalized = resolved.href;

          if (!visited.has(normalized) && !toVisit.some((v) => v.url === normalized)) {
            toVisit.push({ url: normalized, depth: depth + 1 });
          }
        } catch {
          // Invalid URL, skip
        }
      });
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    }
  }

  return Array.from(visited);
}
