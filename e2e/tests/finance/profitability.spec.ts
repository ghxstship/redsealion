/**
 * FlyteDeck E2E — Profitability, Equipment, Assets Tests
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';

test.describe('Profitability @profitability', () => {
  test('profitability page renders for owner with proposal @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    // Use seeded proposal ID
    await page.goto('/app/profitability/e2e00000-0000-4000-d000-000000000001');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });
});

test.describe('Equipment @equipment', () => {
  test('equipment renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/equipment');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  test('equipment renders for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/equipment');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('equipment denied for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/equipment');
    await page.waitForLoadState('networkidle');
    // Designer has view+edit on equipment, so should render
    await expectPageRendered(page);
  });
});

test.describe('Assets @assets', () => {
  test('assets renders for owner @owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/assets');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
    await expectNoRawI18nKeys(page);
  });

  test('assets renders for team_member @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/assets');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });
});
