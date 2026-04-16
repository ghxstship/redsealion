/**
 * FlyteDeck E2E — Time Hub
 *
 * Routes: /app/time, /timer, /timesheets
 * Tier: enterprise, ALL_INTERNAL
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const TIME_ROUTES = [
  '/app/time',
  '/app/time/timer',
  '/app/time/timesheets',
];

test.describe('Time Hub @time', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of TIME_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }
});
