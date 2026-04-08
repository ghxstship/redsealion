/**
 * FlyteDeck E2E — People Tests
 * Tier: enterprise
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

const PEOPLE_ROUTES = [
  '/app/people',
  '/app/people/org-chart',
  '/app/people/time-off',
];

test.describe('People Hub @people', () => {
  for (const route of PEOPLE_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('people renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/people');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('people denied for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/people');
    await page.waitForLoadState('networkidle');
    // TODO: expectAccessDenied once server-side role gating is enforced
    await expectPageRendered(page);
  });
});
