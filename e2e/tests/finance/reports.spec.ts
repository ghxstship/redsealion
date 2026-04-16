/**
 * FlyteDeck E2E — Reports Hub
 *
 * RoleGate: resource="reports" — controller has viewCreate → ALLOWED on ALL reports
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const REPORT_ROUTES = [
  '/app/reports',
  '/app/reports/revenue',
  '/app/reports/pipeline',
  '/app/reports/funnel',
  '/app/reports/win-rate',
  '/app/reports/utilization',
  '/app/reports/wip',
  '/app/reports/forecast',
  '/app/reports/aging',
  '/app/reports/builder',
  '/app/reports/budget-vs-actual',
  '/app/reports/crew-availability',
  '/app/reports/equipment-utilization',
  '/app/reports/expenses',
];

test.describe('Reports Hub @reports', () => {
  for (const role of ALLOWED_ROLES) {
    for (const route of REPORT_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  test('/app/reports renders for viewer (viewOnly)', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/reports');
    await expectPageRendered(page);
  });
});
