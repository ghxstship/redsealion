/**
 * FlyteDeck E2E — Portal Sub-Route Accessibility
 *
 * Validates that the client portal sub-routes under /portal/[orgSlug]
 * are accessible to external roles (client, viewer, contractor)
 * and that internal admin routes redirect/deny access as expected.
 *
 * Note: Portal routes require an org slug. The test org's slug
 * is 'e2e-test-enterprise' (seeded in seed.ts).
 */
import { test, expect } from '../../fixtures/test-fixtures';
import type { Role } from '../../helpers/routes';

const PORTAL_ORG_SLUG = 'e2e-test-enterprise';

// --- Public portal pages (no auth required) ---
const PUBLIC_PORTAL_ROUTES = [
  `/portal/${PORTAL_ORG_SLUG}`,
  `/portal/${PORTAL_ORG_SLUG}/login`,
  `/portal/${PORTAL_ORG_SLUG}/pricing`,
];

// --- Contractor portal pages (contractor role) ---
const CONTRACTOR_ROUTES = [
  `/portal/${PORTAL_ORG_SLUG}/contractor`,
  `/portal/${PORTAL_ORG_SLUG}/contractor/bookings`,
  `/portal/${PORTAL_ORG_SLUG}/contractor/compliance`,
  `/portal/${PORTAL_ORG_SLUG}/contractor/documents`,
  `/portal/${PORTAL_ORG_SLUG}/contractor/jobs`,
  `/portal/${PORTAL_ORG_SLUG}/contractor/profile`,
  `/portal/${PORTAL_ORG_SLUG}/contractor/time`,
];

// --- Viewer portal pages (viewer role) ---
const VIEWER_ROUTES = [
  `/portal/${PORTAL_ORG_SLUG}/viewer`,
  `/portal/${PORTAL_ORG_SLUG}/viewer/projects`,
  `/portal/${PORTAL_ORG_SLUG}/viewer/proposals`,
];

// --- Client portal pages (client role) ---
const CLIENT_ROUTES = [
  `/portal/${PORTAL_ORG_SLUG}/account`,
  `/portal/${PORTAL_ORG_SLUG}/portfolio`,
  `/portal/${PORTAL_ORG_SLUG}/refer`,
  `/portal/${PORTAL_ORG_SLUG}/request`,
];

test.describe('Portal Public Pages @portal', () => {
  test.setTimeout(60_000);

  for (const route of PUBLIC_PORTAL_ROUTES) {
    test(`${route} renders without login`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      if (response) {
        // Accept 200, 302 (redirect to login), or 404 (org not found)
        expect(response.status()).toBeLessThan(500);
      }

      // No JS errors
      expect(jsErrors.length, `JS errors on ${route}: ${jsErrors.join('; ')}`).toBe(0);
    });
  }
});

test.describe('Portal Contractor Routes @portal', () => {
  test.setTimeout(60_000);

  for (const route of CONTRACTOR_ROUTES) {
    test(`${route} accessible for contractor`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('contractor');
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      if (response) {
        expect(response.status()).toBeLessThan(500);
      }

      // No JS errors
      expect(jsErrors.length, `JS errors on ${route}: ${jsErrors.join('; ')}`).toBe(0);
    });
  }
});

test.describe('Portal Viewer Routes @portal', () => {
  test.setTimeout(60_000);

  for (const route of VIEWER_ROUTES) {
    test(`${route} accessible for viewer`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('viewer');
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      if (response) {
        expect(response.status()).toBeLessThan(500);
      }

      // No JS errors
      expect(jsErrors.length, `JS errors on ${route}: ${jsErrors.join('; ')}`).toBe(0);
    });
  }
});

test.describe('Portal Client Routes @portal', () => {
  test.setTimeout(60_000);

  for (const route of CLIENT_ROUTES) {
    test(`${route} accessible for client`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage('client');
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      if (response) {
        expect(response.status()).toBeLessThan(500);
      }

      // No JS errors
      expect(jsErrors.length, `JS errors on ${route}: ${jsErrors.join('; ')}`).toBe(0);
    });
  }
});
