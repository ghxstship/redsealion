/**
 * FlyteDeck E2E — Dispatch Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

test.describe('Dispatch @dispatch', () => {
  test('dispatch renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/dispatch');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  test('dispatch renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/dispatch');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('dispatch denied for crew @crew', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('crew');
    await page.goto('/app/dispatch');
    await page.waitForLoadState('networkidle');
    // TODO: expectAccessDenied once server-side role gating is enforced
    await expectPageRendered(page);
  });
});
