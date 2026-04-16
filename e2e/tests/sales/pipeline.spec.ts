/**
 * FlyteDeck E2E — Pipeline
 *
 * Routes: /app/pipeline, /list, /forecast, /settings, /territories, /commissions
 * RoleGate: resource="pipeline" — controller has viewOnly → ALLOWED
 * Settings: ADMIN_ONLY (sub-page level gating)
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const PIPELINE_ROUTES = [
  '/app/pipeline',
  '/app/pipeline/list',
  '/app/pipeline/forecast',
  '/app/pipeline/territories',
  '/app/pipeline/commissions',
];

test.describe('Pipeline @pipeline', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of PIPELINE_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  // Settings sub-page is ADMIN_ONLY
  test('/app/pipeline/settings renders for owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/pipeline/settings');
    await expectPageRendered(page);
  });

  test('/app/pipeline denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/pipeline');
    await expectAccessDenied(page);
  });
});
