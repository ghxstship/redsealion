/**
 * FlyteDeck E2E — Time Tracking Tests
 * Tier: enterprise
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const TIME_ROUTES = [
  '/app/time',
  '/app/time/timer',
  '/app/time/timesheets',
];

test.describe('Time Hub @time', () => {
  for (const route of TIME_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  // All internal roles should be able to track their own time
  for (const role of ['team_member', 'crew'] as Role[]) {
    test(`time renders for ${role} @${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/time');
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
    });
  }
});
