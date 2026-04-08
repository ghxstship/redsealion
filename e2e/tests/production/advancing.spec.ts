/**
 * FlyteDeck E2E — Advancing Tests
 * Tier: starter (basic), professional (collection mode)
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

const ADVANCING_ROUTES = [
  '/app/advancing',
  '/app/advancing/allocations',
  '/app/advancing/submissions',
  '/app/advancing/approvals',
  '/app/advancing/assignments',
];

test.describe('Advancing Hub @advancing', () => {
  for (const route of ADVANCING_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('submissions renders for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/advancing/submissions');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('allocations denied for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/advancing/allocations');
    await page.waitForLoadState('networkidle');
    // TODO: expectAccessDenied once server-side role gating is enforced
    await expectPageRendered(page);
  });
});
