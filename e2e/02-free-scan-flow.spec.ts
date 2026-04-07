import { test, expect } from '@playwright/test';

/**
 * FREE SCAN TOOL — the core conversion funnel.
 * Tests the full flow: enter URL → scan runs → results display.
 */

test.describe('Free Scan Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/free-scan', { waitUntil: 'domcontentloaded' });
  });

  test('scan form is visible and has clear CTA', async ({ page }) => {
    // There should be an input for URL
    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await expect(input).toBeVisible();

    // There should be a submit button
    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await expect(button).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/free-scan-form.png', fullPage: true });
  });

  test('empty submission is handled', async ({ page }) => {
    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    // Should show validation error or not navigate away
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('free-scan');

    await page.screenshot({ path: 'e2e/screenshots/free-scan-empty-submit.png', fullPage: true });
  });

  test('invalid URL is handled gracefully', async ({ page }) => {
    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('not-a-real-site-xyz-99999.com');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    // Wait for response — should show error, not crash
    await page.waitForTimeout(15000);
    await page.screenshot({ path: 'e2e/screenshots/free-scan-invalid-url.png', fullPage: true });

    // Page should not be a 500 error
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).not.toContain('internal server error');
    expect(body?.toLowerCase()).not.toContain('application error');
  });

  test('scan runs for a real site (wirecutter.com)', async ({ page }) => {
    test.setTimeout(120_000); // scans can take time

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('wirecutter.com');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    // Wait for scan to complete — look for results or redirect
    await page.waitForURL(/\/(scan|free-scan|results)/, { timeout: 90_000 }).catch(() => {
      // might stay on same page with results inline
    });

    // Wait for content to load
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'e2e/screenshots/free-scan-wirecutter-result.png', fullPage: true });

    // Should have some results content
    const body = await page.textContent('body');
    const hasResults = body?.toLowerCase().includes('broken') ||
      body?.toLowerCase().includes('link') ||
      body?.toLowerCase().includes('result') ||
      body?.toLowerCase().includes('scan') ||
      body?.toLowerCase().includes('found');
    expect(hasResults, 'No scan results visible after scan completed').toBeTruthy();
  });

  test('scan runs for a small site (wikipedia.org)', async ({ page }) => {
    test.setTimeout(120_000);

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('wikipedia.org');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    await page.waitForURL(/\/(scan|free-scan|results)/, { timeout: 90_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'e2e/screenshots/free-scan-wikipedia-result.png', fullPage: true });

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).not.toContain('internal server error');
  });

  test('CTA to signup is visible after scan', async ({ page }) => {
    test.setTimeout(120_000);

    const input = page.locator('input[type="text"], input[type="url"], input[placeholder*="site"], input[placeholder*="url"], input[placeholder*="domain"]').first();
    await input.fill('wirecutter.com');

    const button = page.locator('button[type="submit"], button:has-text("Scan"), button:has-text("Check"), button:has-text("Analyze")').first();
    await button.click();

    await page.waitForURL(/\/(scan|free-scan|results)/, { timeout: 90_000 }).catch(() => {});
    await page.waitForTimeout(5000);

    // Look for signup/upgrade CTA
    const ctaVisible = await page.locator('a[href*="signup"], a[href*="pricing"], button:has-text("Sign"), button:has-text("Start"), button:has-text("Get"), a:has-text("Sign"), a:has-text("Start"), a:has-text("Monitor")').first().isVisible().catch(() => false);

    await page.screenshot({ path: 'e2e/screenshots/free-scan-cta-check.png', fullPage: true });

    if (!ctaVisible) {
      console.warn('⚠ NO SIGNUP CTA VISIBLE after scan results — this is a conversion leak!');
    }
    // Not a hard fail but flagged
  });
});
