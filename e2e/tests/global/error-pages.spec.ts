/**
 * FlyteDeck E2E — Global Error & Edge Pages
 *
 * Validates the 404 not-found, offline, and reactivate pages
 * render correctly without JS errors.
 */
import { test, expect } from '@playwright/test';

test.describe('Global Error & Edge Pages @global', () => {
  test.setTimeout(60_000);

  test('404 page renders for non-existent route', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const response = await page.goto('/this-route-does-not-exist-e2e-test', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    // Should return 404
    if (response) {
      expect(response.status()).toBe(404);
    }

    // Should render the custom 404 UI
    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('not found') ||
      bodyText?.toLowerCase().includes('404') ||
      bodyText?.toLowerCase().includes('page'),
      'Expected 404 page content'
    ).toBe(true);

    // No JS errors
    expect(jsErrors.length, `JS errors: ${jsErrors.join('; ')}`).toBe(0);
  });

  test('404 page has navigation links', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-e2e-test', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    // Should have links to go back to dashboard or home
    const dashboardLink = page.locator('a[href="/app"]');
    const homeLink = page.locator('a[href="/"]');
    const hasNavigation =
      (await dashboardLink.count()) > 0 || (await homeLink.count()) > 0;
    expect(hasNavigation, 'Expected navigation links on 404 page').toBe(true);
  });

  test('offline page renders', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const response = await page.goto('/offline', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    if (response) {
      expect(response.status()).toBeLessThan(500);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(10);

    // No JS errors
    expect(jsErrors.length, `JS errors: ${jsErrors.join('; ')}`).toBe(0);
  });

  test('reactivate page renders', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const response = await page.goto('/reactivate', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    if (response) {
      expect(response.status()).toBeLessThan(500);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(10);

    // No error boundary
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });

    // No JS errors
    expect(jsErrors.length, `JS errors: ${jsErrors.join('; ')}`).toBe(0);
  });
});
