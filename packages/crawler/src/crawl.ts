import * as cheerio from 'cheerio/slim';
import { validateFetchUrl } from './url-safety';
import { getRobotsRules, isPathAllowed } from './robots';
import {
  CRAWL_DELAY_MS,
  PAGE_FETCH_TIMEOUT_MS,
  CRAWLER_USER_AGENT,
} from './crawl-config';

/**
 * BFS crawl of a single domain to discover pages.
 *
 * This is the internal site crawl (the user's own verified domain).
 * It respects robots.txt because we are crawling/discovering pages —
 * this is the scenario robots.txt is designed to govern.
 */
export async function crawlSite(
  domain: string,
  maxDepth: number,
  maxPages: number = 50
): Promise<string[]> {
  const visited = new Set<string>();
  const toVisit: Array<{ url: string; depth: number }> = [
    { url: `https://${domain}`, depth: 0 },
  ];

  // Fetch robots.txt once for this domain
  const origin = `https://${domain}`;
  const robotsRules = await getRobotsRules(origin);

  // Respect Crawl-Delay if present, otherwise use our default
  const delayMs =
    robotsRules.crawlDelay !== null
      ? Math.max(robotsRules.crawlDelay * 1000, CRAWL_DELAY_MS)
      : CRAWL_DELAY_MS;

  while (toVisit.length > 0 && visited.size < maxPages) {
    const { url, depth } = toVisit.shift()!;

    if (visited.has(url) || depth > maxDepth) continue;

    // SSRF check
    const parsed = validateFetchUrl(url);
    if (!parsed) continue;

    // robots.txt check — skip disallowed paths
    if (!isPathAllowed(robotsRules, parsed.pathname)) continue;

    visited.add(url);

    // Pacing: delay between requests to the same domain
    if (visited.size > 1) {
      await sleep(delayMs);
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': CRAWLER_USER_AGENT },
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
      // Log and continue — don't let one page failure stop discovery
      console.error(`Failed to crawl ${url}:`, error);
    }
  }

  return Array.from(visited);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
