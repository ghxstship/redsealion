/**
 * FlyteDeck E2E — Expenses Hub
 *
 * Routes: /app/expenses, /approvals, /mileage, /receipts
 * Tier: enterprise, ALL_INTERNAL (approvals: ADMIN_CTRL_COLLAB)
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const EXPENSE_ROUTES = [
  '/app/expenses',
  '/app/expenses/mileage',
  '/app/expenses/receipts',
];

test.describe('Expenses @expenses', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of EXPENSE_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  // Approvals restricted to ADMIN_CTRL_COLLAB
  for (const role of ALL_INTERNAL) {
    test(`/app/expenses/approvals renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/expenses/approvals');
      await expectPageRendered(page);
    });
  }

  test('/app/expenses denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/expenses');
    await expectAccessDenied(page);
  });
});
