/**
 * FlyteDeck E2E — Rentals Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

const RENTAL_ROUTES = [
  '/app/rentals',
  '/app/rentals/reservations',
  '/app/rentals/returns',
  '/app/rentals/sub-rentals',
  '/app/rentals/utilization',
];

test.describe('Rentals Hub @rentals', () => {
  for (const route of RENTAL_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('rentals renders for crew @crew', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('crew');
    await page.goto('/app/rentals');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('team_member denied from rentals @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/rentals');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
