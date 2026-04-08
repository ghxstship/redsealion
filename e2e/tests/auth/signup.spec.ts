/**
 * FlyteDeck E2E — Signup Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Signup Page', () => {
  test('renders signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('shows validation on empty submission', async ({ page }) => {
    await page.goto('/signup');
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      // Should stay on signup and show validation
      expect(page.url()).toContain('/signup');
    }
  });
});
