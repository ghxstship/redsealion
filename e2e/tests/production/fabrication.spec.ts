/**
 * FlyteDeck E2E — Fabrication Hub
 *
 * RoleGate: resource="fabrication" — controller has viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const FAB_ROUTES = [
  '/app/fabrication',
  '/app/fabrication/bom',
  '/app/fabrication/print',
  '/app/fabrication/quality',
  '/app/fabrication/shop-floor',
];

test.describe('Fabrication Hub @fabrication', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of FAB_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  test('/app/fabrication denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/fabrication');
    await expectAccessDenied(page);
  });
});
