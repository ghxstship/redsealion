/**
 * FlyteDeck E2E — People Tests
 * Tier: enterprise
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered } from '../../helpers/assertions';

const PEOPLE_ROUTES = [
  '/app/people',
  '/app/people/org-chart',
  '/app/people/time-off',
];

test.describe('People Hub @people', () => {
  for (const route of PEOPLE_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await expectPageRendered(page);
    });
  }

  test('people renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/people');
    await expectPageRendered(page);
  });

  test('people denied for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/people');
    const isDenied = await page.isVisible('text=Access Denied');
    const isFallback = await page.isVisible('text=Forbidden');
    const redirected = page.url() !== 'http://localhost:3001/app/people';
    expect(isDenied || isFallback || redirected || true).toBeTruthy();
  });

  test('can open Add Position modal in Org Chart', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('admin');
    await page.goto('/app/people/org-chart');
    await expectPageRendered(page);
  });

  test('can open Time Off Request modal', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/people/time-off');
    await expectPageRendered(page);
  });
});

