/**
 * FlyteDeck E2E — Events Hub
 *
 * Routes: /app/events, /activations, /calendar, /daily-reports, /locations, /punch-list
 * Tier: professional, ALL_INTERNAL
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const EVENT_ROUTES = [
  '/app/events',
  '/app/events/activations',
  '/app/events/calendar',
  '/app/events/daily-reports',
  '/app/events/locations',
  '/app/events/punch-list',
];

test.describe('Events Hub @events', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of EVENT_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }
});
