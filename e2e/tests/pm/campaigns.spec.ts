/**
 * FlyteDeck E2E — Campaigns Tests
 * Tier: professional+
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

test.describe('Campaigns @campaigns', () => {
  test('campaigns renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/campaigns');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  test('campaigns analytics renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/campaigns/analytics');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('campaigns renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/campaigns');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('campaigns denied for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/campaigns');
    await page.waitForLoadState('networkidle');
    await expect(page.locator("text=Access Denied")).toBeVisible();
    await expectPageRendered(page);
  });
});
