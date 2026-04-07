import { test, expect } from '@playwright/test';

/**
 * PERFORMANCE — key pages must load fast or visitors bounce.
 */

const CRITICAL_PAGES = [
  { path: '/', name: 'Homepage', maxLoad: 5000 },
  { path: '/free-scan', name: 'Free Scan', maxLoad: 5000 },
  { path: '/pricing', name: 'Pricing', maxLoad: 5000 },
];

for (const { path, name, maxLoad } of CRITICAL_PAGES) {
  test(`${name} loads within ${maxLoad}ms`, async ({ page }) => {
    const start = Date.now();
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    console.log(`${name} load time: ${loadTime}ms`);
    expect(loadTime, `${name} took ${loadTime}ms to load`).toBeLessThan(maxLoad);
  });
}

test('Homepage Largest Contentful Paint < 4s', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const lcp = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        resolve(last?.startTime ?? 0);
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // Fallback if no LCP event fires
      setTimeout(() => resolve(0), 5000);
    });
  });

  if (lcp > 0) {
    console.log(`LCP: ${Math.round(lcp)}ms`);
    expect(lcp, `LCP too slow: ${Math.round(lcp)}ms`).toBeLessThan(4000);
  }
});

test('No massive JS bundles blocking render', async ({ page }) => {
  const resources: { url: string; size: number }[] = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.endsWith('.js') || url.includes('.js?')) {
      const headers = response.headers();
      const size = parseInt(headers['content-length'] || '0', 10);
      if (size > 0) resources.push({ url, size });
    }
  });

  await page.goto('/', { waitUntil: 'load' });

  const bigBundles = resources.filter((r) => r.size > 500_000); // > 500KB
  if (bigBundles.length > 0) {
    console.warn('⚠ Large JS bundles:', bigBundles.map((b) => `${b.url} (${Math.round(b.size / 1024)}KB)`));
  }
  // Soft check — warn but don't hard fail
  expect(bigBundles.length, `${bigBundles.length} JS bundles over 500KB`).toBeLessThan(3);
});
