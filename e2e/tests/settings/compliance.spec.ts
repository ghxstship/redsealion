/**
 * FlyteDeck E2E — Compliance Hub
 *
 * RoleGate: resource="compliance" — controller has viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const COMPLIANCE_ROUTES = [
  '/app/compliance',
  '/app/compliance/certifications',
  '/app/compliance/cois',
  '/app/compliance/contracts',
  '/app/compliance/licenses',
  '/app/compliance/permits',
];

test.describe('Compliance Hub @compliance', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of COMPLIANCE_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  test('/app/compliance denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/compliance');
    await expectAccessDenied(page);
  });
});
