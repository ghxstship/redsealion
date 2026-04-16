/**
 * FlyteDeck E2E — Procurement Hub
 *
 * Routes: /app/procurement, /purchase-orders, /requisitions, /suppliers, /receiving
 * Feature gate: procurement (enterprise)
 * Allowed roles: ADMIN_CTRL_COLLAB (developer, owner, admin, controller, collaborator)
 * Denied roles: contractor, crew, client, viewer, community
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];
const DENIED_ROLES: Role[] = ['viewer'];

const HUB_ROUTES = [
  '/app/procurement',
  '/app/procurement/purchase-orders',
  '/app/procurement/requisitions',
  '/app/procurement/suppliers',
  '/app/procurement/receiving',
];

test.describe('Procurement Hub @procurement', () => {
  // ─── Authorized access ──────────────────────────────────────────────────
  for (const role of ALLOWED_ROLES) {
    for (const route of HUB_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  // ─── Denied access ──────────────────────────────────────────────────────
  for (const role of DENIED_ROLES) {
    test(`/app/procurement denied for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/procurement');
      await expectAccessDenied(page);
    });
  }
});
