import { test, expect } from '@playwright/test';

/**
 * SEO & META — every public page should have proper meta tags.
 * Bad SEO = invisible on Google = no organic traffic.
 */

const SEO_PAGES = [
  '/',
  '/free-scan',
  '/pricing',
  '/link-checker',
  '/blog',
  '/affiliates',
  '/privacy',
  '/terms',
];

for (const path of SEO_PAGES) {
  test(`SEO meta tags on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    // Title exists and is reasonable length
    const title = await page.title();
    expect(title.length, `${path}: missing title`).toBeGreaterThan(5);
    expect(title.length, `${path}: title too long (${title.length} chars)`).toBeLessThan(70);

    // Meta description exists
    const metaDesc = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDesc, `${path}: missing meta description`).toBeTruthy();
    expect(metaDesc!.length, `${path}: meta description too short`).toBeGreaterThan(50);
    expect(metaDesc!.length, `${path}: meta description too long (${metaDesc!.length})`).toBeLessThan(160);

    // OG tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle, `${path}: missing og:title`).toBeTruthy();

    const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
    expect(ogDesc, `${path}: missing og:description`).toBeTruthy();

    // Canonical URL
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical, `${path}: missing canonical URL`).toBeTruthy();

    // H1 exists (exactly one)
    const h1Count = await page.locator('h1').count();
    expect(h1Count, `${path}: has ${h1Count} h1 tags (should be 1)`).toBe(1);

    // Favicon
    const favicon = await page.locator('link[rel="icon"], link[rel="shortcut icon"]').count();
    expect(favicon, `${path}: no favicon`).toBeGreaterThan(0);
  });
}

test('Robots.txt exists', async ({ request }) => {
  const res = await request.get('https://www.linkrescue.io/robots.txt');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text.toLowerCase()).toContain('user-agent');
});

test('Sitemap exists', async ({ request }) => {
  const res = await request.get('https://www.linkrescue.io/sitemap.xml');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain('urlset');
});
