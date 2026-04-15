/**
 * FlyteDeck E2E — Budgets Tests
 * Tier: enterprise
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

test.describe('Budgets @budgets', () => {
  test('budgets renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/budgets');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  test('budgets renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/budgets');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('budgets denied for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/budgets');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
