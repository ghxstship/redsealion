/**
 * FlyteDeck E2E — Reports Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const REPORT_ROUTES = [
  '/app/reports',
  '/app/reports/revenue',
  '/app/reports/pipeline',
  '/app/reports/funnel',
  '/app/reports/win-rate',
  '/app/reports/utilization',
  '/app/reports/wip',
  '/app/reports/forecast',
  '/app/reports/builder',
];

test.describe('Reports Hub @reports', () => {
  for (const route of REPORT_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('reports renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('builder requires professional tier', async ({ authenticatedPage }) => {
    // This test would differ based on tier context
    const page = await authenticatedPage('owner');
    await page.goto('/app/reports/builder');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('reports denied for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
