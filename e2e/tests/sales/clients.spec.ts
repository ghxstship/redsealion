/**
 * FlyteDeck E2E — Clients Hub
 *
 * Routes: /app/clients, /activity, /map, /segments
 * RoleGate: resource="clients" — controller has viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const CLIENT_ROUTES = [
  '/app/clients',
  '/app/clients/activity',
  '/app/clients/map',
  '/app/clients/segments',
];

test.describe('Clients Hub @clients', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of CLIENT_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  test('/app/clients denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/clients');
    await expectAccessDenied(page);
  });
});
