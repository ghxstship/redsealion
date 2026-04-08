/**
 * FlyteDeck E2E — Custom Test Fixtures
 *
 * Extends Playwright's base `test` with FlyteDeck-specific fixtures:
 *   - Pre-authenticated page per role
 *   - Tier-switched org context
 */
import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';
import type { Role } from '../helpers/routes';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlyteDeckFixtures {
  /** Creates a page pre-authenticated as the given role */
  authenticatedPage: (role: Role) => Promise<Page>;
  /** The current role being tested (set via test.use or parameterization) */
  currentRole: Role;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

export const test = base.extend<FlyteDeckFixtures>({
  currentRole: ['owner', { option: true }],

  authenticatedPage: async ({ browser }, use) => {
    const pages: Page[] = [];

    const factory = async (role: Role): Promise<Page> => {
      const authFile = path.join(__dirname, '..', '.auth', `${role}.json`);
      let context: BrowserContext;
      try {
        context = await browser.newContext({ storageState: authFile });
      } catch {
        // If no auth file exists, create context without auth (will redirect to login)
        context = await browser.newContext();
      }
      const page = await context.newPage();
      pages.push(page);
      return page;
    };

    await use(factory);

    // Cleanup
    for (const page of pages) {
      await page.close();
    }
  },
});

export { expect } from '@playwright/test';

// ─── Role parameterization helper ────────────────────────────────────────────

/**
 * Generates test cases for a list of roles.
 * Usage:
 *   forEachRole(['owner', 'team_member'], (role) => {
 *     test(`renders for ${role}`, async ({ authenticatedPage }) => {
 *       const page = await authenticatedPage(role);
 *       ...
 *     });
 *   });
 */
export function forEachRole(
  roles: Role[],
  fn: (role: Role) => void
) {
  for (const role of roles) {
    fn(role);
  }
}
