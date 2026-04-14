/**
 * FlyteDeck E2E — Schedule Tests
 *
 * Validates schedule hub and sub-pages (milestones, run-of-show, build-strike).
 * Tier: professional+
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const SCHEDULE_ROUTES = [
  '/app/schedule',
  '/app/schedule/milestones',
  '/app/schedule/run-of-show',
  '/app/schedule/build-strike',
];

test.describe('Schedule Hub @schedule', () => {
  for (const route of SCHEDULE_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('schedule renders for crew @crew', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('crew');
    await page.goto('/app/schedule');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });
});
