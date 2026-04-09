/**
 * FlyteDeck E2E — Signup Tests
 */
import { test, expect } from '@playwright/test';
import { verifyEmailSent } from '../../helpers/resend';

// Helper to generate a unique email for testing
const generateTestEmail = () => `test-signup-${Date.now()}@redsealion.test`;

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
      expect(page.url()).toContain('/signup');
    }
  });

  test('completes full signup flow successfully', async ({ page }) => {
    await page.goto('/signup');
    
    // Step 1: Account
    const testEmail = generateTestEmail();
    await page.locator('input[id="fullName"]').fill('Test User');
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();
    
    // Step 2: Organization
    await expect(page.locator('input[id="companyName"]')).toBeVisible();
    await page.locator('input[id="companyName"]').fill('E2E Test Corp');
    
    // Ensure slug is populated automatically
    await expect(page.locator('input[id="slug"]')).toHaveValue('e2e-test-corp');
    await page.locator('button[type="submit"]').click();

    // Verify successful redirection to app
    await page.waitForURL('**/app**', { timeout: 15000 });
    expect(page.url()).toContain('/app');

    // Optionally check if a welcome email was sent (only sent if configured)
    // await verifyEmailSent(testEmail, 'Welcome');
  });
});
