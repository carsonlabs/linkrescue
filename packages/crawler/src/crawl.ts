import * as cheerio from 'cheerio';

export async function crawlSite(domain: string, maxDepth: number): Promise<string[]> {
  const visited = new Set<string>();
  const toVisit: Array<{ url: string; depth: number }> = [{ url: `https://${domain}`, depth: 0 }];

  while (toVisit.length > 0) {
    const { url, depth } = toVisit.shift()!;

    if (visited.has(url) || depth > maxDepth) {
      continue;
    }

    visited.add(url);

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Find all internal links
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('/')) {
          const absoluteUrl = new URL(href, `https://${domain}`).href;
          if (!visited.has(absoluteUrl)) {
            toVisit.push({ url: absoluteUrl, depth: depth + 1 });
          }
        }
      });
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    }
  }

  return Array.from(visited);
}
