/**
 * FlyteDeck E2E — Pipeline Tests
 *
 * Validates pipeline hub and all sub-pages across roles and tiers.
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const PIPELINE_ROUTES = [
  '/app/pipeline',
  '/app/pipeline/list',
  '/app/pipeline/forecast',
  '/app/pipeline/territories',
  '/app/pipeline/commissions',
];

const ALLOWED_ROLES: Role[] = ['developer', 'owner', 'collaborator'];
const DENIED_ROLES: Role[] = ['collaborator', 'crew'];

test.describe('Pipeline Hub @pipeline', () => {
  // ── Access Granted ──
  for (const role of ALLOWED_ROLES) {
    test(`main page renders for ${role} @${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/pipeline');
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  // ── All sub-pages render ──
  for (const route of PIPELINE_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  // ── Settings (admin only) ──
  test('pipeline settings renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/pipeline/settings');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('pipeline settings denied for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/pipeline/settings');
    await page.waitForLoadState('networkidle');
    await expectAccessDenied(page);
  });

  // ── Access Denied (role) ──
  for (const role of DENIED_ROLES) {
    test(`pipeline denied for ${role} @${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/pipeline');
      await page.waitForLoadState('networkidle');
      await expectAccessDenied(page);
    });
  }
});
