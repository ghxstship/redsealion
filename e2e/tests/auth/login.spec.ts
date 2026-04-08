/**
 * FlyteDeck E2E — Login Tests
 *
 * Validates login page rendering, form validation,
 * successful auth redirect, and unauthenticated redirection.
 */
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('renders login form with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').fill('bad@credentials.com');
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Should show an error message and stay on login page
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
    const bodyText = await page.textContent('body');
    const hasError =
      bodyText?.toLowerCase().includes('invalid') ||
      bodyText?.toLowerCase().includes('error') ||
      bodyText?.toLowerCase().includes('incorrect') ||
      bodyText?.toLowerCase().includes('failed');
    expect(hasError).toBe(true);
  });

  test('redirects unauthenticated user from /app to /login', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('redirects authenticated user from /login to /app', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/owner.json',
    });
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForURL('**/app**', { timeout: 10_000 });
    expect(page.url()).toContain('/app');
    await context.close();
  });
});
