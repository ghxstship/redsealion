/**
 * FlyteDeck E2E — Campaigns Hub
 *
 * RoleGate: allowedRoles=['developer','owner','admin','collaborator'] — controller EXCLUDED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'collaborator'];
const DENIED_ROLES: Role[] = ['controller', 'viewer'];

const CAMPAIGN_ROUTES = [
  '/app/campaigns',
  '/app/campaigns/analytics',
  '/app/campaigns/audiences',
  '/app/campaigns/drafts',
  '/app/campaigns/scheduled',
];

test.describe('Campaigns Hub @campaigns', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of CAMPAIGN_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  for (const role of DENIED_ROLES) {
    test(`/app/campaigns denied for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/campaigns');
      await expectAccessDenied(page);
    });
  }
});
