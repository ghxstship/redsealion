/**
 * FlyteDeck E2E — Dashboard & Personal Pages
 *
 * Dashboard: /app
 * Personal:  /app/my-tasks, /my-inbox, /my-schedule, /my-documents, /favorites, /calendar
 * Projects:  /app/projects
 * Files:     /app/files
 * Tier: access, ALL_INTERNAL
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectSidebarFiltered } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const PERSONAL_ROUTES = [
  '/app',
  '/app/my-tasks',
  '/app/my-inbox',
  '/app/my-schedule',
  '/app/my-documents',
  '/app/favorites',
  '/app/calendar',
  '/app/projects',
  '/app/files',
];

test.describe('Dashboard & Personal Pages @dashboard', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of PERSONAL_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  // Sidebar filtering — admin sees all, viewer sees filtered
  test('sidebar shows admin nav items for owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app');
    await expectSidebarFiltered(page, 'owner');
  });

  test('sidebar hides admin nav items for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app');
    await expectSidebarFiltered(page, 'viewer');
  });
});
