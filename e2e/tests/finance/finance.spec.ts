/**
 * FlyteDeck E2E — Finance Hub
 *
 * Routes: /app/finance + 8 sub-routes (invoices, credit-notes, recurring, POs, vendors, profitability, budgets, rev-rec)
 * Tier: professional, ADMIN_CTRL_COLLAB
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];
const DENIED_ROLES: Role[] = ['viewer'];

const FINANCE_ROUTES = [
  '/app/finance',
  '/app/finance/invoices',
  '/app/finance/invoices/credit-notes',
  '/app/finance/invoices/recurring',
  '/app/finance/purchase-orders',
  '/app/finance/vendors',
  '/app/finance/profitability',
  '/app/finance/budgets',
  '/app/finance/revenue-recognition',
];

test.describe('Finance Hub @finance', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of FINANCE_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  for (const role of DENIED_ROLES) {
    test(`/app/finance denied for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/finance');
      await expectAccessDenied(page);
    });
  }
});
