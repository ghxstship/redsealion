/**
 * FlyteDeck E2E — Tasks Tests
 * Tier: enterprise
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const TASK_ROUTES = [
  '/app/tasks',
  '/app/tasks/board',
  '/app/tasks/calendar',
  '/app/tasks/gantt',
  '/app/tasks/projects',
  '/app/tasks/workload',
];

test.describe('Tasks Hub @tasks', () => {
  for (const route of TASK_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('tasks board renders for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/tasks/board');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('tasks renders for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/tasks');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });
});
