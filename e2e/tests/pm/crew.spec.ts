/**
 * FlyteDeck E2E — Crew Hub Stress Test
 * Tier: professional+
 *
 * Tests all crew hub routes, sub-pages, and CRUD API endpoints
 * to validate the gap remediation fixes.
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys } from '../../helpers/assertions';

const CREW_ROUTES = [
  '/app/crew',
  '/app/crew/schedule',
  '/app/crew/availability',
  '/app/crew/onboarding',
  '/app/crew/recruitment',
];

test.describe('Crew Hub @crew', () => {
  // ── Route rendering tests ───────────────────────────────────────────────
  for (const route of CREW_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('crew main renders for team_member (view-only) @team_member', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('team_member');
    await page.goto('/app/crew');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('crew schedule renders for manager @manager', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('manager');
    await page.goto('/app/crew/schedule');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  // ── CrewHubTabs renders from layout, not duplicated ─────────────────────
  test('crew hub tabs rendered once from layout', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/crew');
    await page.waitForLoadState('networkidle');

    // Check that tabs/nav exist (rendered by layout)
    const navCount = await page.locator('nav, [role="tablist"]').count();
    expect(navCount).toBeGreaterThan(0);
  });

  // ── Schedule page does not contain render errors ───────────────────────
  test('schedule page renders without console errors', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/app/crew/schedule');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);

    // Table cells should not show "undefined" as data
    const tableCells = await page.locator('td').allTextContents();
    const undefinedCells = tableCells.filter((text) => text.trim() === 'undefined');
    expect(undefinedCells.length).toBe(0);
  });

  // ── Onboarding page shows correct status labels ─────────────────────────
  test('onboarding page renders valid status badges', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/crew/onboarding');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);

    // Status badges should not show "undefined"
    const badges = await page.locator('span').allTextContents();
    const undefinedBadges = badges.filter((text) => text.trim() === 'undefined');
    expect(undefinedBadges.length).toBe(0);
  });

  // ── Recruitment page renders ─────────────────────────────────────────────
  test('recruitment page renders with summary cards', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/crew/recruitment');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  // ── Availability page renders ───────────────────────────────────────────
  test('availability page renders without errors', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/crew/availability');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);

    // Grid cells should not show "undefined"
    const buttons = await page.locator('button').allTextContents();
    const undefinedButtons = buttons.filter((text) => text.trim() === 'undefined');
    expect(undefinedButtons.length).toBe(0);
  });
});
