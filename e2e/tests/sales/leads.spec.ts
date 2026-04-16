/**
 * FlyteDeck E2E — Leads
 *
 * Routes: /app/leads, /forms
 * RoleGate: resource="leads" — controller has viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

test.describe('Leads @leads', () => {
  for (const role of ALLOWED_ROLES) {
    test(`/app/leads renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/leads');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });

    test(`/app/leads/forms renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/leads/forms');
      await expectPageRendered(page);
    });
  }

  test('/app/leads denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/leads');
    await expectAccessDenied(page);
  });
});
