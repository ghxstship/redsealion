/**
 * FlyteDeck E2E — Crew Tests
 * Tier: professional+
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

const CREW_ROUTES = [
  '/app/crew',
  '/app/crew/roster',
  '/app/crew/bookings',
  '/app/crew/availability',
  '/app/crew/onboarding',
];

test.describe('Crew Hub @crew', () => {
  for (const route of CREW_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('crew main renders for team_member (view-only) @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/crew');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('crew roster renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/crew/roster');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });
});
