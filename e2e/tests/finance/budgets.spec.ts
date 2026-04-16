/**
 * FlyteDeck E2E — Budgets
 *
 * Route: /app/budgets
 * Tier: enterprise, ADMIN_CTRL_COLLAB
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

test.describe('Budgets @budgets', () => {
  for (const role of ALLOWED_ROLES) {
    test(`/app/budgets renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/budgets');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/budgets renders for viewer (viewOnly)', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/budgets');
    await expectPageRendered(page);
  });
});
