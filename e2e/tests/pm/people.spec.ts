/**
 * FlyteDeck E2E — People Hub
 *
 * RoleGate: bare (no resource) → ALL_INTERNAL pass
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const PEOPLE_ROUTES = [
  '/app/people',
  '/app/people/org-chart',
  '/app/people/time-off',
];

test.describe('People Hub @people', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of PEOPLE_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }
});
