/**
 * FlyteDeck E2E — Clients Tests
 *
 * Validates clients hub, contacts, activity sub-pages.
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

const CLIENT_ROUTES = [
  '/app/clients',
  '/app/clients/contacts',
  '/app/clients/activity',
];

test.describe('Clients Hub @clients', () => {
  for (const route of CLIENT_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('clients list renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/clients');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('team_member can view clients (view-only) @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/clients');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('team_member denied from clients @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/clients');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
