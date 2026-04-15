/**
 * FlyteDeck E2E — Procurement Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const PROCUREMENT_ROUTES = [
  '/app/procurement',
  '/app/procurement/purchase-orders',
  '/app/procurement/requisitions',
  '/app/procurement/suppliers',
  '/app/procurement/receiving',
];

test.describe('Procurement Hub @procurement', () => {
  for (const route of PROCUREMENT_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('procurement renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/procurement');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('collaborator denied from procurement @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/procurement');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
