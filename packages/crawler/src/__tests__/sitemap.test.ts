import { describe, it, expect } from 'vitest';
import { parseSitemapXml } from '../sitemap';

describe('parseSitemapXml', () => {
  it('parses a simple urlset sitemap', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page1</loc></url>
  <url><loc>https://example.com/page2</loc></url>
  <url><loc>https://example.com/page3</loc></url>
</urlset>`;

    const urls = parseSitemapXml(xml);
    expect(urls).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3',
    ]);
  });

  it('parses a single-url sitemap', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/only-page</loc></url>
</urlset>`;

    const urls = parseSitemapXml(xml);
    expect(urls).toEqual(['https://example.com/only-page']);
  });

  it('parses a sitemap index', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-posts.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
</sitemapindex>`;

    const urls = parseSitemapXml(xml);
    expect(urls).toEqual([
      'https://example.com/sitemap-posts.xml',
      'https://example.com/sitemap-pages.xml',
    ]);
  });

  it('respects maxUrls limit', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      `<url><loc>https://example.com/page${i}</loc></url>`
    ).join('\n');
    const xml = `<?xml version="1.0"?><urlset>${entries}</urlset>`;

    const urls = parseSitemapXml(xml, 3);
    expect(urls).toHaveLength(3);
  });

  it('handles empty sitemap gracefully', () => {
    const xml = `<?xml version="1.0"?><urlset></urlset>`;
    const urls = parseSitemapXml(xml);
    expect(urls).toEqual([]);
  });

  it('handles urls with extra metadata', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    const urls = parseSitemapXml(xml);
    expect(urls).toEqual(['https://example.com/page1']);
  });
});
