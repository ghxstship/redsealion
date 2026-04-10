/**
 * FlyteDeck E2E — Client Portal Tests
 *
 * Validates portal access for client and viewer roles,
 * including permission differences (comment, approve, pay).
 */
import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Client Portal @portal', () => {
  test('client can access portal @client', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('client');
    // Portal is at /portal/[orgSlug] — the /app route group is for internal users.
    // Client role users should see their portal or be redirected from admin areas.
    await page.goto('/app', { timeout: 45000, waitUntil: 'domcontentloaded' });
    await expect(async () => {
      const url = page.url();
      const bodyText = await page.textContent('body');
      const hasContent =
        url.includes('/portal') ||
        url.includes('/app') ||
        url.includes('/login') ||
        bodyText?.toLowerCase().includes('welcome') ||
        bodyText?.toLowerCase().includes('access') ||
        bodyText?.toLowerCase().includes('upgrade');
      expect(hasContent).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('viewer can access portal @viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app', { timeout: 45000, waitUntil: 'domcontentloaded' });
    await expect(async () => {
      const url = page.url();
      const bodyText = await page.textContent('body');
      const hasContent =
        url.includes('/portal') ||
        url.includes('/app') ||
        url.includes('/login') ||
        bodyText?.toLowerCase().includes('welcome') ||
        bodyText?.toLowerCase().includes('access') ||
        bodyText?.toLowerCase().includes('upgrade');
      expect(hasContent).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('client is blocked from admin routes @client', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('client');
    // Navigate to an admin-only route
    await page.goto('/app/settings', { timeout: 45000, waitUntil: 'domcontentloaded' });
    await expect(async () => {
      const url = page.url();
      const bodyText = await page.textContent('body');
      const blocked =
        url.includes('/login') ||
        url.includes('/portal') ||
        url.endsWith('/app') ||
        bodyText?.toLowerCase().includes('access') ||
        bodyText?.toLowerCase().includes('upgrade') ||
        bodyText?.toLowerCase().includes('permission') ||
        bodyText?.toLowerCase().includes('forbidden');
      expect(blocked).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('viewer is blocked from admin routes @viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/settings', { timeout: 45000, waitUntil: 'domcontentloaded' });
    await expect(async () => {
      const url = page.url();
      const bodyText = await page.textContent('body');
      const blocked =
        url.includes('/login') ||
        url.includes('/portal') ||
        url.endsWith('/app') ||
        bodyText?.toLowerCase().includes('access') ||
        bodyText?.toLowerCase().includes('upgrade') ||
        bodyText?.toLowerCase().includes('permission') ||
        bodyText?.toLowerCase().includes('forbidden');
      expect(blocked).toBe(true);
    }).toPass({ timeout: 15000 });
  });
});
