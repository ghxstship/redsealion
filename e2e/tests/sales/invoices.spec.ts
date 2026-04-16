/**
 * FlyteDeck E2E — Invoices
 *
 * Routes: /app/invoices, /credit-notes, /recurring
 * Tier: access (recurring: professional), ADMIN_CTRL_COLLAB
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];
const DENIED_ROLES: Role[] = ['viewer'];

const INVOICE_ROUTES = [
  '/app/invoices',
  '/app/invoices/credit-notes',
  '/app/invoices/recurring',
];

test.describe('Invoices @invoices', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of INVOICE_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  for (const role of DENIED_ROLES) {
    test(`/app/invoices denied for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/invoices');
      await expectAccessDenied(page);
    });
  }
});
