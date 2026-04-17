/**
 * FlyteDeck E2E — Auth Edge Pages
 *
 * Validates the forgot-password, reset-password, and verify-email
 * pages render correctly and show the expected UI elements.
 * These are unauthenticated pages within the (auth) route group.
 */
import { test, expect } from '@playwright/test';

test.describe('Auth Edge Pages @auth', () => {
  test.setTimeout(60_000);

  test('forgot-password page renders form', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/forgot-password', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    // Should show an email input for password reset
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15_000 });

    // Should have a submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });

    // No JS errors
    expect(jsErrors.length, `JS errors: ${jsErrors.join('; ')}`).toBe(0);
  });

  test('forgot-password validates empty submission', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });

    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1500);
      // Should stay on forgot-password (no redirect)
      expect(page.url()).toContain('/forgot-password');
    }
  });

  test('reset-password page renders', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/reset-password', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    // Without a valid token, should render correctly but may show
    // an error/expired message or password fields
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(10);

    // No error boundary
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });

    // No JS errors
    expect(jsErrors.length, `JS errors: ${jsErrors.join('; ')}`).toBe(0);
  });

  test('verify-email page renders', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/verify-email', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    // Without a valid email context, should render the
    // verification prompt or redirect
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(10);

    // No error boundary
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });

    // No JS errors
    expect(jsErrors.length, `JS errors: ${jsErrors.join('; ')}`).toBe(0);
  });
});
