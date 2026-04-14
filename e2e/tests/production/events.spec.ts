/**
 * FlyteDeck E2E — Events Tests
 * Tier: professional+
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const EVENT_ROUTES = [
  '/app/events',
  '/app/events/daily-reports',
  '/app/events/punch-list',
];

test.describe('Events Hub @events', () => {
  for (const route of EVENT_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('events renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('events renders for crew @crew', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('crew');
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });
});
