/**
 * FlyteDeck E2E — Fabrication Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const FAB_ROUTES = [
  '/app/fabrication',
  '/app/fabrication/bom',
  '/app/fabrication/print',
];

test.describe('Fabrication Hub @fabrication', () => {
  for (const route of FAB_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('fabrication renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/fabrication');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('collaborator denied from fabrication @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/fabrication');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
