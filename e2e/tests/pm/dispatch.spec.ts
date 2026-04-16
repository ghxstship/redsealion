/**
 * FlyteDeck E2E — Dispatch Hub
 *
 * RoleGate: resource="dispatch" — controller has viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const DISPATCH_ROUTES = [
  '/app/dispatch',
  '/app/dispatch/board',
  '/app/dispatch/history',
  '/app/dispatch/routes',
];

test.describe('Dispatch @dispatch', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of DISPATCH_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  test('/app/dispatch denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/dispatch');
    await expectAccessDenied(page);
  });
});
