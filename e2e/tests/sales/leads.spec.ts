/**
 * FlyteDeck E2E — Leads Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const LEAD_ROUTES = [
  '/app/leads',
  '/app/leads/forms',
];

test.describe('Leads Hub @leads', () => {
  for (const route of LEAD_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('leads renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/leads');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('collaborator denied from leads @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/leads');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
