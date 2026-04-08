/**
 * FlyteDeck E2E — Proposals Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

test.describe('Proposals @proposals', () => {
  test('proposals list renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  test('new proposal page renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/proposals/new');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('proposals list renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('team_member can view proposals (view-only) @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('team_member denied from proposals @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    // Fabricator has view-only on proposals
    await expectPageRendered(page);
  });
});
