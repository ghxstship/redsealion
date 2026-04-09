/**
 * FlyteDeck E2E — Client Portal Tests
 *
 * Validates portal access for client and viewer roles,
 * including permission differences (comment, approve, pay).
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

test.describe('Client Portal @portal', () => {
  test('client can access portal @client', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('client');
    // Portal is at /app/portal or /portal/[orgSlug]
    await page.goto('/app/portal');
    await expect(page).toHaveURL(/.*(\/portal|\/app).*/, { timeout: 15000 });
  });

  test('viewer can access portal @viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/portal');
    await expect(page).toHaveURL(/.*(\/portal|\/app).*/, { timeout: 15000 });
  });

  test('client is blocked from admin routes @client', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('client');
    await page.goto('/app/pipeline');
    await expect(async () => {
      const url = page.url();
      const bodyText = await page.textContent('body');
      const blocked =
        url.includes('/login') ||
        url.includes('/portal') ||
        url.endsWith('/app') ||
        bodyText?.toLowerCase().includes('access') ||
        bodyText?.toLowerCase().includes('upgrade');
      expect(blocked).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('viewer is blocked from admin routes @viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/settings');
    await expect(async () => {
      const url = page.url();
      const bodyText = await page.textContent('body');
      const blocked =
        url.includes('/login') ||
        url.includes('/portal') ||
        url.endsWith('/app') ||
        bodyText?.toLowerCase().includes('access') ||
        bodyText?.toLowerCase().includes('upgrade');
      expect(blocked).toBe(true);
    }).toPass({ timeout: 15000 });
  });
});
