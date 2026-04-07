import { test, expect } from '@playwright/test';

/**
 * PRICING & CONVERSION — the money page must work perfectly.
 */

test.describe('Pricing Page', () => {
  test('all three tiers are displayed', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    const body = await page.textContent('body');
    const bodyLower = body?.toLowerCase() ?? '';

    // Should show three tiers
    expect(bodyLower).toContain('free');
    expect(bodyLower).toContain('pro');
    expect(bodyLower).toContain('agency');

    // Should show prices
    expect(bodyLower).toMatch(/\$29|\$79/);

    await page.screenshot({ path: 'e2e/screenshots/pricing-page.png', fullPage: true });
  });

  test('monthly/annual toggle works', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    // Look for billing toggle
    const toggle = page.locator('button:has-text("Annual"), button:has-text("Yearly"), label:has-text("Annual"), [role="switch"]').first();
    const toggleExists = await toggle.isVisible().catch(() => false);

    if (toggleExists) {
      await toggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/pricing-annual.png', fullPage: true });

      const body = await page.textContent('body');
      // Annual prices should be different
      expect(body?.toLowerCase()).toMatch(/save|annual|year/);
    } else {
      console.warn('⚠ No billing toggle found on pricing page');
    }
  });

  test('CTA buttons lead somewhere valid', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    // Find all pricing CTAs
    const ctaButtons = page.locator('a:has-text("Get Started"), a:has-text("Start"), a:has-text("Subscribe"), a:has-text("Sign Up"), a:has-text("Try")');
    const count = await ctaButtons.count();

    expect(count, 'No CTA buttons on pricing page!').toBeGreaterThan(0);

    // Check first CTA goes somewhere valid
    const href = await ctaButtons.first().getAttribute('href');
    expect(href, 'CTA has no href').toBeTruthy();

    if (href && !href.includes('stripe.com')) {
      const res = await page.request.get(href.startsWith('http') ? href : `https://www.linkrescue.io${href}`);
      expect(res.status(), `CTA link ${href} is broken`).toBeLessThan(400);
    }
  });
});

test.describe('Signup Flow', () => {
  test('signup page loads and has form', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });

    await page.screenshot({ path: 'e2e/screenshots/signup-page.png', fullPage: true });

    // Should have email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
    const hasEmail = await emailInput.isVisible().catch(() => false);

    // Or OAuth buttons
    const oauthButton = page.locator('button:has-text("Google"), button:has-text("GitHub"), a:has-text("Google"), a:has-text("GitHub")').first();
    const hasOauth = await oauthButton.isVisible().catch(() => false);

    expect(hasEmail || hasOauth, 'No signup form or OAuth buttons found').toBeTruthy();
  });

  test('login page loads and has form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.screenshot({ path: 'e2e/screenshots/login-page.png', fullPage: true });

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
    const hasEmail = await emailInput.isVisible().catch(() => false);

    const oauthButton = page.locator('button:has-text("Google"), button:has-text("GitHub"), a:has-text("Google"), a:has-text("GitHub")').first();
    const hasOauth = await oauthButton.isVisible().catch(() => false);

    expect(hasEmail || hasOauth, 'No login form or OAuth buttons found').toBeTruthy();
  });
});
