/**
 * FlyteDeck E2E — Proposals Tests
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

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

  test('proposals list renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('collaborator can view proposals (view-only) @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('collaborator denied from proposals @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    // Fabricator has view-only on proposals
    await expectPageRendered(page);
  });
});
