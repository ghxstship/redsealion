/**
 * FlyteDeck E2E — Schedule Hub
 *
 * Routes: /app/schedule, /milestones, /run-of-show, /build-strike
 * Tier: professional, ALL_INTERNAL
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const SCHEDULE_ROUTES = [
  '/app/schedule',
  '/app/schedule/milestones',
  '/app/schedule/run-of-show',
  '/app/schedule/build-strike',
];

test.describe('Schedule Hub @schedule', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of SCHEDULE_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }
});
