/**
 * FlyteDeck E2E — Shared Assertion Helpers
 *
 * Reusable page-level assertions for verifying render quality,
 * access control, i18n completeness, and navigation filtering.
 */
import { expect, type Page } from '@playwright/test';

// ─── Page Render Assertions ──────────────────────────────────────────────────

/**
 * Asserts the page rendered successfully without hitting the app's error boundary.
 * In dev mode, Next.js may inject its own overlay — we only check the app's error UI.
 */
export async function expectPageRendered(page: Page) {
  // Check for the app's error boundary (not NextJS dev overlay)
  const errorBoundary = page.locator('[data-testid="error-boundary"]');
  await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });

  // Ensure the page loaded something (not a blank 404/500 error)
  const bodyText = await page.textContent('body');
  const isBlankError =
    bodyText?.trim() === '404' ||
    bodyText?.trim() === '500' ||
    bodyText?.includes('Application error: a server-side exception has occurred');
  expect(isBlankError, 'Page shows a fatal error').toBe(false);
}

/**
 * Asserts the page contains no raw i18n translation keys (e.g. `nav.schedule`, `module.title`).
 * Only checks visible text content to avoid matching script/style elements.
 */
export async function expectNoRawI18nKeys(page: Page) {
  // Get only the visible text, not script src attributes or hidden elements
  const visibleText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
        const text = node.textContent?.trim();
        if (text) texts.push(text);
      }
    }
    return texts.join(' ');
  });

  // Match patterns like nav.schedule, module.title — but exclude file extensions
  const i18nKeyPattern = /\b(nav|module|common|action|label|placeholder|success|confirm)\.[a-z_]{2,}\b/gi;
  const matches = visibleText.match(i18nKeyPattern) || [];

  // Filter out false positives
  const falsePositivePatterns = ['module.exports', 'common.js', 'module.css'];
  const realKeys = matches.filter(
    (m) => !falsePositivePatterns.some((fp) => m.includes(fp))
  );

  expect(realKeys, `Found raw i18n keys on page: ${realKeys.join(', ')}`).toHaveLength(0);
}

// ─── Access Control Assertions ───────────────────────────────────────────────

/**
 * Asserts the page shows an upgrade prompt or access-denied UI rather than content.
 * This covers tier-gated and role-gated access denial.
 */
export async function expectAccessDenied(page: Page) {
  // Look for common upgrade/forbidden patterns in the FlyteDeck UI
  const upgradeIndicators = [
    page.locator('text=Upgrade'),
    page.locator('text=upgrade'),
    page.locator('[data-testid="upgrade-prompt"]'),
    page.locator('[data-testid="access-denied"]'),
    page.locator('text=not available on your current plan'),
    page.locator('text=requires'),
    page.locator('text=Access Restricted'),
    page.locator('text=permission to view'),
  ];

  let found = false;
  for (const indicator of upgradeIndicators) {
    if ((await indicator.count()) > 0) {
      found = true;
      break;
    }
  }

  // If no upgrade UI, check for redirect to login or dashboard
  if (!found) {
    const url = page.url();
    const redirected = url.includes('/login') || url.endsWith('/app') || url.includes('error=');
    expect(redirected || found, 'Expected access denied UI or redirect but page rendered normally').toBe(true);
  }
}

// ─── Navigation Assertions ───────────────────────────────────────────────────

/**
 * Verifies the sidebar contains expected navigation items for a given role.
 * Admin/PM roles see all nav items; restricted roles see a filtered subset.
 */
export async function expectSidebarFiltered(page: Page, role: string) {
  // The sidebar is an <aside> that contains a <nav> with links.
  // On desktop (md+) it's translated into view; wait for it to appear in the DOM.
  const sidebar = page.locator('aside');
  await expect(sidebar.first()).toBeAttached({ timeout: 45_000 });

  // Wait for at least one navigation link to be present (client hydration)
  const navLinks = sidebar.first().locator('a[href^="/app"]');
  await expect(navLinks.first()).toBeAttached({ timeout: 45_000 });

  const linkTexts = await navLinks.allTextContents();
  expect(linkTexts.length).toBeGreaterThan(0);

  // Client roles should NOT see admin nav items
  if (role === 'client' || role === 'viewer') {
    const adminOnlyLabels = ['Settings', 'Automations', 'Integrations'];
    for (const label of adminOnlyLabels) {
      expect(linkTexts.join(' ')).not.toContain(label);
    }
  }
}

// ─── Content Assertions ──────────────────────────────────────────────────────
