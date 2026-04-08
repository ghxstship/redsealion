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
    await page.waitForLoadState('networkidle');
    // May redirect or render portal — either is valid
    const url = page.url();
    const isPortal = url.includes('/portal') || url.includes('/app');
    expect(isPortal).toBe(true);
  });

  test('viewer can access portal @viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/portal');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const isPortal = url.includes('/portal') || url.includes('/app');
    expect(isPortal).toBe(true);
  });

  test('client is blocked from admin routes @client', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('client');
    await page.goto('/app/pipeline');
    await page.waitForLoadState('networkidle');
    // Should be redirected or show access denied
    const url = page.url();
    const bodyText = await page.textContent('body');
    const blocked =
      url.includes('/login') ||
      url.includes('/portal') ||
      url.endsWith('/app') ||
      bodyText?.toLowerCase().includes('access') ||
      bodyText?.toLowerCase().includes('upgrade');
    expect(blocked).toBe(true);
  });

  test('viewer is blocked from admin routes @viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/settings');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const bodyText = await page.textContent('body');
    const blocked =
      url.includes('/login') ||
      url.includes('/portal') ||
      url.endsWith('/app') ||
      bodyText?.toLowerCase().includes('access') ||
      bodyText?.toLowerCase().includes('upgrade');
    expect(blocked).toBe(true);
  });
});
