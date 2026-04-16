/**
 * FlyteDeck E2E — Proposals
 *
 * Routes: /app/proposals, /new
 * RoleGate: resource="proposals" — controller has viewOnly → ALLOWED for hub
 * /new: ADMIN_COLLAB (controller can't create, only view)
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

test.describe('Proposals @proposals', () => {
  for (const role of ALLOWED_ROLES) {
    test(`/app/proposals renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/proposals');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  // /new requires create permission — ADMIN_COLLAB only
  for (const role of ['owner', 'admin', 'collaborator'] as Role[]) {
    test(`/app/proposals/new renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/proposals/new');
      await expectPageRendered(page);
    });
  }

  test('/app/proposals renders for viewer (viewOnly)', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/proposals');
    await expectPageRendered(page);
  });
});
