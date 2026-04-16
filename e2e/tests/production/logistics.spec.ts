/**
 * FlyteDeck E2E — Logistics Hub
 *
 * RoleGate: resource="warehouse" — controller: noPerm → DENIED
 * ALL logistics sub-pages inherit from warehouse resource
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'collaborator'];
const DENIED_ROLES: Role[] = ['controller', 'viewer'];

const LOGISTICS_ROUTES = [
  '/app/logistics',
  '/app/logistics/shipping',
  '/app/logistics/receiving',
  '/app/logistics/counts',
  '/app/logistics/goods-receipts',
  '/app/logistics/packing',
  '/app/logistics/scan',
  '/app/logistics/transfers',
];

test.describe('Logistics Hub @logistics', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of LOGISTICS_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  for (const role of DENIED_ROLES) {
    test(`/app/logistics denied for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/logistics');
      await expectAccessDenied(page);
    });
  }
});
