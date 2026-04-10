/**
 * FlyteDeck E2E — Dashboard Tests
 *
 * Validates main dashboard renders correctly for each user role,
 * KPI cards are visible for admin roles, and sidebar is present.
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectPageHeading, expectSidebarFiltered } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const INTERNAL_ROLES: Role[] = [
  'developer', 'owner', 'manager',
  'team_member', 'crew',
];

test.describe('Dashboard @dashboard', () => {
  test.setTimeout(120_000);

  for (const role of INTERNAL_ROLES) {
    test(`renders for ${role} @${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app');
      await page.waitForLoadState('domcontentloaded');

      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
      await expectSidebarFiltered(page, role);
    });
  }

  test('shows KPI cards for owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Dashboard should have stat/KPI cards
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="stat"], [data-testid*="kpi"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sidebar is filtered for team_member role', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    await expectSidebarFiltered(page, 'team_member');
  });
});
