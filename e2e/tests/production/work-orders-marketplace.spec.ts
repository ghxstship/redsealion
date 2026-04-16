/**
 * FlyteDeck E2E — Work Orders & Marketplace
 *
 * Work Orders: /app/work-orders — enterprise, ALL_INTERNAL
 * Marketplace: /app/marketplace — enterprise, ALL_INTERNAL
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

test.describe('Work Orders @work-orders', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/work-orders renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/work-orders');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/work-orders denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/work-orders');
    await expectAccessDenied(page);
  });
});

test.describe('Marketplace @marketplace', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/marketplace renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/marketplace');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/marketplace denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/marketplace');
    await expectAccessDenied(page);
  });
});
