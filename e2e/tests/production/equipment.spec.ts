/**
 * FlyteDeck E2E — Equipment Hub
 *
 * RoleGate: resource="equipment" — controller has viewOnly → ALLOWED
 * check-in-out: ALL_INTERNAL
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const EQUIPMENT_ROUTES = [
  '/app/equipment',
  '/app/equipment/assets',
  '/app/equipment/bundles',
  '/app/equipment/inventory',
  '/app/equipment/maintenance',
];

test.describe('Equipment Hub @equipment', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of EQUIPMENT_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  // check-in-out: ALL_INTERNAL
  for (const role of ALLOWED_ROLES) {
    test(`/app/equipment/check-in-out renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/equipment/check-in-out');
      await expectPageRendered(page);
    });
  }

  test('/app/equipment denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/equipment');
    await expectAccessDenied(page);
  });
});
