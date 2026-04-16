/**
 * FlyteDeck E2E — Automations & Integrations
 *
 * Automations: RoleGate resource="automations" — controller: noPerm → DENIED
 * Integrations: RoleGate resource="integrations" — controller: noPerm → DENIED
 * Both: collaborator has viewCreate → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'collaborator'];
const DENIED_ROLES: Role[] = ['controller', 'viewer'];

const AUTOMATION_ROUTES = [
  '/app/automations',
  '/app/automations/runs',
  '/app/automations/templates',
];

const INTEGRATION_ROUTES = [
  '/app/integrations',
  '/app/integrations/sync-errors',
];

test.describe('Automations @automations', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of AUTOMATION_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  for (const role of DENIED_ROLES) {
    test(`/app/automations denied for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/automations');
      await expectAccessDenied(page);
    });
  }
});

test.describe('Integrations @integrations', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of INTEGRATION_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  for (const role of DENIED_ROLES) {
    test(`/app/integrations denied for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/integrations');
      await expectAccessDenied(page);
    });
  }
});
