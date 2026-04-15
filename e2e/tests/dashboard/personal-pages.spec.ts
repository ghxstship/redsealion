/**
 * FlyteDeck E2E — Personal Pages Tests
 *
 * Validates My Tasks, My Inbox, My Schedule, My Documents, Favorites.
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const PERSONAL_PAGES = [
  { path: '/app/my-tasks', name: 'My Tasks' },
  { path: '/app/my-inbox', name: 'My Inbox' },
  { path: '/app/my-schedule', name: 'My Schedule' },
  { path: '/app/my-documents', name: 'My Documents' },
  { path: '/app/favorites', name: 'Favorites' },
];

test.describe('Personal Pages @dashboard', () => {
  for (const { path, name } of PERSONAL_PAGES) {
    test(`${name} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });

    test(`${name} renders for collaborator @collaborator`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('collaborator');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
    });
  }
});
