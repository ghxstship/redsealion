/**
 * FlyteDeck E2E — Assets, Portfolio, Goals, Roadmap
 *
 * Assets:    resource="assets" — controller viewOnly → ALLOWED
 * Portfolio: resource="portfolio" — controller viewOnly → ALLOWED
 * Goals:     resource="goals" — controller viewOnly → ALLOWED
 * Roadmap:   resource="roadmap" — controller viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

test.describe('Assets @assets', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/assets renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/assets');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/assets denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/assets');
    await expectAccessDenied(page);
  });
});

test.describe('Portfolio @portfolio', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/portfolio renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/portfolio');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }
});

test.describe('Goals @goals', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/goals renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/goals');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/goals renders for viewer (viewOnly)', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/goals');
    await expectPageRendered(page);
  });
});

test.describe('Roadmap @roadmap', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/roadmap renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/roadmap');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }
});
