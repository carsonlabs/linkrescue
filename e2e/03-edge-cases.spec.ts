import { test, expect } from '@playwright/test';

/**
 * EDGE CASES & BREAKAGE — try to break the product.
 */

test.describe('Edge Cases', () => {
  test('extremely long URL in scan form', async ({ page }) => {
    await page.goto('/free-scan', { waitUntil: 'domcontentloaded' });

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    const longUrl = 'a'.repeat(2000) + '.com';
    await input.fill(longUrl);

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'e2e/screenshots/edge-long-url.png', fullPage: true });

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).not.toContain('internal server error');
    expect(body?.toLowerCase()).not.toContain('application error');
  });

  test('special characters in URL', async ({ page }) => {
    await page.goto('/free-scan', { waitUntil: 'domcontentloaded' });

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('<script>alert("xss")</script>.com');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'e2e/screenshots/edge-xss-attempt.png', fullPage: true });

    // Should not execute script — check page is still functional
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).not.toContain('internal server error');
  });

  test('double submit scan form', async ({ page }) => {
    await page.goto('/free-scan', { waitUntil: 'domcontentloaded' });

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('example.com');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();

    // Rapid double click
    await button.click();
    await button.click().catch(() => {}); // might be disabled

    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'e2e/screenshots/edge-double-submit.png', fullPage: true });

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).not.toContain('internal server error');
  });

  test('back button during scan', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/free-scan', { waitUntil: 'domcontentloaded' });

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('example.com');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    // Wait a moment then hit back
    await page.waitForTimeout(3000);
    await page.goBack();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e/screenshots/edge-back-during-scan.png', fullPage: true });

    // Page should still be usable
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).not.toContain('internal server error');
  });

  test('refresh during scan', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/free-scan', { waitUntil: 'domcontentloaded' });

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('example.com');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'e2e/screenshots/edge-refresh-during-scan.png', fullPage: true });

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).not.toContain('internal server error');
  });
});
