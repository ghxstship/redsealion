/**
 * FlyteDeck E2E — Settings Hub
 *
 * RoleGate: allowedRoles=['developer','owner','admin','controller','collaborator'] → ALL_INTERNAL
 * Sub-pages use requiresAdmin filter (can('settings','view')) to hide sidebar sections
 * Profile/Appearance/Notifications/Calendar-sync/Data-privacy: ALL_INTERNAL
 * Admin-only sub-pages: controller/collaborator can navigate but see limited content
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];
const ADMIN_ROLES: Role[] = ['owner', 'admin'];

// All settings pages — tested for admin roles (full access)
const ALL_SETTINGS_ROUTES = [
  '/app/settings',
  '/app/settings/profile',
  '/app/settings/appearance',
  '/app/settings/branding',
  '/app/settings/team',
  '/app/settings/billing',
  '/app/settings/payment-terms',
  '/app/settings/payments',
  '/app/settings/tax',
  '/app/settings/facilities',
  '/app/settings/localization',
  '/app/settings/tags',
  '/app/settings/notifications',
  '/app/settings/document-defaults',
  '/app/settings/email-templates',
  '/app/settings/calendar-sync',
  '/app/settings/cost-rates',
  '/app/settings/custom-fields',
  '/app/settings/automations-config',
  '/app/settings/integrations',
  '/app/settings/data-privacy',
  '/app/settings/webhooks',
  '/app/settings/security',
  '/app/settings/security/mfa',
  '/app/settings/security/permissions',
  '/app/settings/security/audit-log',
  '/app/settings/sso',
  '/app/settings/api-keys',
  '/app/settings/audit-log',
];

// Pages accessible to ALL_INTERNAL
const ALL_INTERNAL_ROUTES = [
  '/app/settings',
  '/app/settings/profile',
  '/app/settings/appearance',
  '/app/settings/notifications',
  '/app/settings/calendar-sync',
  '/app/settings/data-privacy',
];

test.describe('Settings @settings', () => {
  // Admin access — all pages
  for (const role of ADMIN_ROLES) {
    for (const route of ALL_SETTINGS_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  // ALL_INTERNAL access — collaborator/controller can reach root + personal pages
  for (const role of ['collaborator', 'controller'] as Role[]) {
    for (const route of ALL_INTERNAL_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');
        await expectPageRendered(page);
      });
    }
  }

  // Viewer denied from settings entirely
  test('/app/settings denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/settings');
    await page.waitForLoadState('domcontentloaded');
    await expectAccessDenied(page);
  });
});
