/**
 * FlyteDeck E2E — Rentals Hub
 *
 * RoleGate: resource="rentals" — controller viewOnly → ALLOWED on ALL sub-routes
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const RENTAL_ROUTES = [
  '/app/rentals',
  '/app/rentals/reservations',
  '/app/rentals/returns',
  '/app/rentals/sub-rentals',
  '/app/rentals/utilization',
];

test.describe('Rentals Hub @rentals', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of RENTAL_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  test('/app/rentals denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/rentals');
    await expectAccessDenied(page);
  });
});
