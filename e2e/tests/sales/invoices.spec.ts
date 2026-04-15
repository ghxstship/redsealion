/**
 * FlyteDeck E2E — Invoices Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

test.describe('Invoices @invoices', () => {
  test('invoices list renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/invoices');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  test('invoices renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/invoices');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('collaborator denied from invoices @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/invoices');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
