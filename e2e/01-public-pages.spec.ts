import { test, expect } from '@playwright/test';

/**
 * PUBLIC PAGES — every page a visitor can hit without logging in.
 * Checks: loads, no errors, correct title, key elements visible, no broken images.
 */

const PUBLIC_ROUTES = [
  { path: '/', name: 'Homepage', mustContain: 'LinkRescue' },
  { path: '/free-scan', name: 'Free Scan', mustContain: 'scan' },
  { path: '/pricing', name: 'Pricing', mustContain: 'price' },
  { path: '/link-checker', name: 'Link Checker', mustContain: 'link' },
  { path: '/blog', name: 'Blog', mustContain: '' },
  { path: '/docs', name: 'Docs', mustContain: '' },
  { path: '/affiliates', name: 'Affiliates', mustContain: 'affiliate' },
  { path: '/privacy', name: 'Privacy', mustContain: 'privacy' },
  { path: '/terms', name: 'Terms', mustContain: '' },
  { path: '/login', name: 'Login', mustContain: '' },
  { path: '/signup', name: 'Signup', mustContain: '' },
  { path: '/affiliate-link-revenue-calculator', name: 'Calculator', mustContain: '' },
  { path: '/guides', name: 'Guides', mustContain: '' },
];

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} (${route.path}) loads correctly`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    // Must return 200
    expect(response?.status(), `${route.path} returned ${response?.status()}`).toBe(200);

    // Screenshot for manual review
    await page.screenshot({
      path: `e2e/screenshots/${route.name.toLowerCase().replace(/\s+/g, '-')}.png`,
      fullPage: true,
    });

    // Page must have a title
    const title = await page.title();
    expect(title.length, `${route.path} has no title`).toBeGreaterThan(0);

    // Check for expected content (case insensitive)
    if (route.mustContain) {
      const body = await page.textContent('body');
      expect(body?.toLowerCase()).toContain(route.mustContain.toLowerCase());
    }

    // No broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.src);
    });
    expect(brokenImages, `Broken images on ${route.path}: ${brokenImages.join(', ')}`).toHaveLength(0);

    // Log console errors (non-blocking, just for report)
    if (errors.length > 0) {
      console.warn(`⚠ Console errors on ${route.path}:`, errors);
    }
  });
}

test('404 page handles gracefully', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist-12345');
  // Should be 404, not 500
  expect(response?.status()).toBe(404);
  await page.screenshot({ path: 'e2e/screenshots/404-page.png', fullPage: true });
});

test('Navigation links work (no dead links)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Grab all internal nav links
  const navLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a[href], header a[href]'));
    return links
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => href.includes('linkrescue.io') || href.startsWith('/'));
  });

  const uniqueLinks = [...new Set(navLinks)];
  console.log(`Found ${uniqueLinks.length} nav links to check`);

  for (const link of uniqueLinks) {
    const res = await page.request.get(link);
    expect(res.status(), `Nav link broken: ${link} → ${res.status()}`).toBeLessThan(400);
  }
});

test('Footer links work', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const footerLinks = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return [];
    const links = Array.from(footer.querySelectorAll('a[href]'));
    return links
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => href.includes('linkrescue.io') || href.startsWith('/'));
  });

  const uniqueLinks = [...new Set(footerLinks)];
  console.log(`Found ${uniqueLinks.length} footer links to check`);

  for (const link of uniqueLinks) {
    const res = await page.request.get(link);
    expect(res.status(), `Footer link broken: ${link} → ${res.status()}`).toBeLessThan(400);
  }
});
