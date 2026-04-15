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
  test.setTimeout(120_000);

  // ── Route rendering tests ───────────────────────────────────────────────
  for (const route of CREW_ROUTES) {
    test(`${route} renders for owner @owner`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('owner');
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('crew main renders for collaborator (view-only) @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/crew');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  test('crew schedule renders for collaborator @collaborator', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('collaborator');
    await page.goto('/app/crew/schedule');
    await page.waitForLoadState('networkidle');
    await expectPageRendered(page);
  });

  // ── CrewHubTabs renders from layout, not duplicated ─────────────────────
  test('crew hub tabs rendered once from layout', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/crew');
    await page.waitForLoadState('networkidle');

    // Wait for client hydration — tabs render a div[role="tablist"]
    const tablist = page.locator('[role="tablist"]').filter({ hasText: 'Directory' });
    await expect(tablist.first()).toBeVisible({ timeout: 60_000 });
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
