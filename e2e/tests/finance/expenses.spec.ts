/**
 * FlyteDeck E2E — Expenses Tests
 * Tier: enterprise
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

test.describe('Expenses @expenses', () => {
  test('expenses renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/expenses');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  // All internal roles can create expenses (own)
  for (const role of ['manager', 'team_member', 'crew'] as Role[]) {
    test(`expenses renders for ${role} @${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/expenses');
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
    });
  }
});
