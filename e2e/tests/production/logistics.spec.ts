/**
 * FlyteDeck E2E — Logistics Tests
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const LOGISTICS_ROUTES = [
  '/app/logistics',
  '/app/logistics/shipping',
  '/app/logistics/receiving',
];

test.describe('Logistics Hub @logistics', () => {
  for (const route of LOGISTICS_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('logistics renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/logistics');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('logistics renders for crew @crew', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('crew');
    await page.goto('/app/logistics');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });
});
