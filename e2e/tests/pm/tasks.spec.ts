/**
 * FlyteDeck E2E — Tasks Hub
 *
 * Routes: /app/tasks, /board, /calendar, /gantt, /projects, /workload
 * Tier: access, ALL_INTERNAL
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const TASK_ROUTES = [
  '/app/tasks',
  '/app/tasks/board',
  '/app/tasks/calendar',
  '/app/tasks/gantt',
  '/app/tasks/projects',
  '/app/tasks/workload',
];

test.describe('Tasks Hub @tasks', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of TASK_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }
});
