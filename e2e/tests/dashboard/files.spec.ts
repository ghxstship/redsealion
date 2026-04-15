/**
 * FlyteDeck E2E — Files Hub Tests
 *
 * Validates the files page renders correctly for admin roles.
 * Follows the same pattern as proposals.spec.ts since both are tier-gated.
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

test.describe('Files Hub @files', () => {
  test.setTimeout(120_000);

  test('renders files page for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/files');
    await page.waitForLoadState('networkidle');

    await expectPageRendered(page);
    // Allow extra time for full hydration before checking i18n keys
    await page.waitForTimeout(1000);
    await expectNoRawI18nKeys(page);
  });

  test('renders files page for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/files');
    await page.waitForLoadState('networkidle');

    await expectPageRendered(page);
  });
});
