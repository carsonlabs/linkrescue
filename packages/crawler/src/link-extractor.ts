import * as cheerio from 'cheerio/slim';
import { isAffiliateLink, isUtilityLink } from './attribution';
import type { ExtractedLink } from './types';

export function extractOutboundLinks(html: string, pageDomain: string): ExtractedLink[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const links: ExtractedLink[] = [];

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href');
    if (!rawHref) return;

    try {
      // Skip non-http links
      if (!rawHref.startsWith('http://') && !rawHref.startsWith('https://')) return;

      const parsed = new URL(rawHref);

      // Only external links
      const linkDomain = parsed.hostname.toLowerCase();
      if (linkDomain === pageDomain || linkDomain.endsWith(`.${pageDomain}`)) return;

      const normalized = parsed.href;
      // Share buttons and photo credits are not outbound content; checking them
      // only produced noise (339 of the June study's 569 LOST_PARAMS).
      if (isUtilityLink(normalized)) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);

      links.push({
        href: normalized,
        isAffiliate: isAffiliateLink(normalized),
      });
    } catch {
      // Invalid URL, skip
    }
  });

  return links;
}
