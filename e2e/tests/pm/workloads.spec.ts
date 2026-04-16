/**
 * FlyteDeck E2E — Workloads Hub
 *
 * RoleGate: resource="workloads" — controller viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const WORKLOAD_ROUTES = [
  '/app/workloads',
  '/app/workloads/schedule',
  '/app/workloads/utilization',
];

test.describe('Workloads Hub @workloads', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of WORKLOAD_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }
});
