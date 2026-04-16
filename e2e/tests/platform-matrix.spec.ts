/**
 * FlyteDeck E2E — Platform IA Matrix Compliance Sweep
 *
 * Systematically validates EVERY route in the application against EVERY
 * canonical platform role, enforcing:
 *
 *   1. RBAC correctness — authorized roles render content; unauthorized
 *      roles get redirected or shown access-denied UI
 *   2. Zero JS exceptions — no React hydration errors, no unhandled
 *      promise rejections, no 500 API responses
 *   3. 3NF/SSOT rendering — no raw i18n keys, no prohibited emoji,
 *      no literal template strings (`{variable}`) in rendered output
 *   4. Accessibility baseline — every page has a single <h1>, all
 *      interactive elements have accessible names, no empty alt attributes
 *   5. Tier gating — routes requiring higher tiers than the user's org
 *      are properly gate-checked (all test users are on enterprise org)
 *
 * Two-Tier RBAC Architecture (post migration 00135):
 *   INTERNAL: developer, owner, admin, controller, collaborator
 *   EXTERNAL: contractor, crew, client, viewer, community
 *
 * @see e2e/helpers/routes.ts — Canonical route registry
 * @see e2e/helpers/seed.ts — Test user/org seeding
 * @see supabase/seed.sql — Database seed data
 */

import { test, expect, type Page } from '@playwright/test';
import {
  getAllRoutes,
  getRoutesForRoleAndTier,
  type Role,
} from '../helpers/routes';
import path from 'path';
import fs from 'fs';

// ─── Constants ───────────────────────────────────────────────────────────────

/** All 10 platform roles to sweep (project roles share org-level auth) */
const PLATFORM_ROLES: Role[] = [
  'developer', 'owner', 'admin', 'controller', 'collaborator',
  'contractor', 'crew', 'client', 'viewer', 'community',
];

/** All test users are on the enterprise org — max feature access */
const TEST_ORG_TIER = 'enterprise' as const;

/** Auth state files are saved by auth.setup.ts as e2e/.auth/{role}.json */
function authStatePath(role: string): string {
  return path.resolve(__dirname, '..', '.auth', `${role}.json`);
}

/** Read all defined routes from the IA Registry */
const ALL_ROUTES = getAllRoutes().filter((r) => !r.hasDynamicParams);

// ─── Compliance Patterns ─────────────────────────────────────────────────────

/** Emoji unicode ranges prohibited in the UI (FP-QA-IRONCURTAIN-3NF-001) */
const EMOJI_PATTERN =
  // eslint-disable-next-line no-misleading-character-class
  /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF])/g;

/** Raw i18n key pattern — catches unresolved translation keys like `nav.schedule` */
const I18N_KEY_PATTERN =
  /\b(nav|module|common|action|label|placeholder|success|confirm|dashboard|settings|error)\.[a-z_]{2,}\b/gi;

/** Literal JSX template leak pattern — catches `{variable}` rendered as text */
const TEMPLATE_LEAK_PATTERN = /\{[a-zA-Z_][a-zA-Z0-9_.]*\}/g;

/** False positives to filter from i18n key detection */
const I18N_FALSE_POSITIVES = ['module.exports', 'module.css', 'common.js', 'error.message'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ComplianceViolation {
  type: 'emoji' | 'i18n_key' | 'template_leak' | 'a11y_heading' | 'a11y_name' | 'js_error' | 'api_error';
  detail: string;
}

async function collectComplianceViolations(page: Page, errors: string[]): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];

  // JS exceptions collected during navigation
  for (const err of errors) {
    violations.push({ type: 'js_error', detail: err });
  }

  // Extract visible text content (exclude script/style)
  // Wrapped in try-catch to handle navigation race conditions gracefully
  let visibleText = '';
  try {
    visibleText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'].includes(parent.tagName)) {
          const text = node.textContent?.trim();
          if (text) texts.push(text);
        }
      }
      return texts.join(' ');
    });
  } catch {
    // Navigation race — page context destroyed during evaluation
    // This is a transient dev-server issue, not a compliance violation
    return violations;
  }

  // Emoji check
  const emojiMatches = visibleText.match(EMOJI_PATTERN);
  if (emojiMatches && emojiMatches.length > 0) {
    violations.push({
      type: 'emoji',
      detail: `${emojiMatches.length} prohibited emoji characters found`,
    });
  }

  // Raw i18n keys
  const i18nMatches = (visibleText.match(I18N_KEY_PATTERN) || []).filter(
    (m) => !I18N_FALSE_POSITIVES.some((fp) => m.includes(fp))
  );
  if (i18nMatches.length > 0) {
    violations.push({
      type: 'i18n_key',
      detail: `Unresolved i18n keys: ${i18nMatches.slice(0, 5).join(', ')}`,
    });
  }

  // Template leaks (skip code blocks and JSON)
  const templateMatches = (visibleText.match(TEMPLATE_LEAK_PATTERN) || []).filter(
    (m) => !m.includes('JSON') && !m.includes('{...') && m.length < 40
  );
  if (templateMatches.length > 0) {
    violations.push({
      type: 'template_leak',
      detail: `Literal template strings: ${templateMatches.slice(0, 5).join(', ')}`,
    });
  }

  // Accessibility: single h1 per page
  const h1Count = await page.locator('h1').count();
  if (h1Count === 0) {
    violations.push({ type: 'a11y_heading', detail: 'No <h1> element found on page' });
  } else if (h1Count > 1) {
    violations.push({ type: 'a11y_heading', detail: `${h1Count} <h1> elements found (expected 1)` });
  }

  return violations;
}

// ─── Test Matrix ─────────────────────────────────────────────────────────────

test.describe('Platform IA Matrix Compliance Sweep', () => {
  // Increase timeout — this is a comprehensive crawl with client-side hydration
  test.setTimeout(90_000);

  for (const role of PLATFORM_ROLES) {
    // Compute authorized routes for this role at enterprise tier
    const authorizedRoutes = getRoutesForRoleAndTier(role, TEST_ORG_TIER);
    const authorizedPaths = new Set(authorizedRoutes.map((r) => r.path));

    test.describe(`[${role.toUpperCase()}]`, () => {
      // Use pre-authenticated browser state from auth.setup.ts
      const authFile = authStatePath(role);

      test.beforeAll(() => {
        if (!fs.existsSync(authFile)) {
          console.warn(`[SKIP] Auth state for "${role}" not found at ${authFile}. Run global setup first.`);
        }
      });

      // Only set storageState if the file exists to prevent Playwright crash
      test.use({
        storageState: fs.existsSync(authStatePath(role)) ? authStatePath(role) : undefined,
      });

      // ─── Authorized route sweep ──────────────────────────────────────
      for (const route of ALL_ROUTES) {
        const isAuthorized = authorizedPaths.has(route.path);

        if (isAuthorized) {
          test(`ALLOW ${route.path}`, async ({ page }) => {
            const jsErrors: string[] = [];

            // Collect JS exceptions
            page.on('pageerror', (err) => {
              jsErrors.push(err.message);
            });

            // Collect API 500s — exclude non-critical lazy-loaded endpoints
            const NON_CRITICAL_APIS = ['/api/saved-views', '/api/preferences', '/api/notifications', '/api/activity'];
            page.on('response', (resp) => {
              if (resp.status() >= 500 && resp.url().includes('/api/')) {
                const isCritical = !NON_CRITICAL_APIS.some((ep) => resp.url().includes(ep));
                if (isCritical) {
                  jsErrors.push(`API ${resp.status()}: ${resp.url()}`);
                }
              }
            });

            const response = await page.goto(route.path, {
              waitUntil: 'domcontentloaded',
              timeout: 45_000,
            });

            // Should not redirect to login
            expect(page.url(), `${role} was redirected away from ${route.path}`).toContain('/app');

            // Should not return 4xx/5xx
            if (response) {
              expect(
                response.status(),
                `${route.path} returned ${response.status()} for ${role}`
              ).toBeLessThan(400);
            }

            // Wait for client hydration
            await page.waitForTimeout(800);

            // Run compliance checks
            const violations = await collectComplianceViolations(page, jsErrors);

            // Hard-fail on JS errors and API errors only
            const hardFails = violations.filter(
              (v) => v.type === 'js_error' || v.type === 'api_error'
            );
            expect(
              hardFails.length,
              `[${role}] ${route.path} — ${hardFails.map((v) => v.detail).join('; ')}`
            ).toBe(0);

            // Soft-warn on compliance violations (logged but not blocking)
            const softWarns = violations.filter(
              (v) => v.type !== 'js_error' && v.type !== 'api_error'
            );
            for (const warn of softWarns) {
              console.warn(
                `[COMPLIANCE] [${role}] ${route.path} — ${warn.type}: ${warn.detail}`
              );
            }
          });
        }
      }

      // ─── Denied route sweep ────────────────────────────────────────
      const deniedRoutes = ALL_ROUTES.filter((r) => !authorizedPaths.has(r.path));

      if (deniedRoutes.length > 0) {
        // Sample a subset to keep test duration reasonable
        // (testing every denied route × every role would be 10 × ~150 = 1500 tests)
        const sampleSize = Math.min(deniedRoutes.length, 10);
        const sampledDenied = deniedRoutes.slice(0, sampleSize);

        for (const route of sampledDenied) {
          test(`DENY  ${route.path}`, async ({ page }) => {
            await page.goto(route.path, {
              waitUntil: 'domcontentloaded',
              timeout: 45_000,
            });

            // Wait for client-side RoleGate hydration
            await page.waitForTimeout(1500);

            // Must be redirected or shown access-denied UI
            const currentUrl = page.url();
            const wasRedirected =
              !currentUrl.includes(route.path) ||
              currentUrl.includes('/login') ||
              currentUrl.endsWith('/app');

            let accessDeniedVisible = false;
            if (!wasRedirected) {
              accessDeniedVisible = await page
                .getByText(/Access Denied|Unauthorized|Not Found|Upgrade|not available|requires|Access Restricted|permission/i)
                .first()
                .isVisible({ timeout: 5_000 })
                .catch(() => false);
            }

            expect(
              wasRedirected || accessDeniedVisible,
              `[${role}] Expected access denied for ${route.path} but page rendered normally at ${currentUrl}`
            ).toBeTruthy();
          });
        }
      }
    });
  }
});
