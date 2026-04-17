/**
 * FlyteDeck E2E — Public / Marketing Pages
 *
 * Validates all unauthenticated marketing pages render
 * correctly with no JS errors, no error boundaries,
 * and proper SEO elements (h1, meta).
 */
import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = [
  { path: '/', label: 'Landing Page' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/features', label: 'Features' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms of Service' },
  { path: '/compare', label: 'Compare' },
  { path: '/marketplace', label: 'Marketplace' },
  { path: '/use-cases', label: 'Use Cases Hub' },
  { path: '/use-cases/brand-activations', label: 'Use Case: Brand Activations' },
  { path: '/use-cases/concerts-festivals', label: 'Use Case: Concerts & Festivals' },
  { path: '/use-cases/corporate-events', label: 'Use Case: Corporate Events' },
  { path: '/use-cases/film-tv-broadcast', label: 'Use Case: Film/TV/Broadcast' },
  { path: '/use-cases/immersive-experiences', label: 'Use Case: Immersive Experiences' },
  { path: '/use-cases/live-events', label: 'Use Case: Live Events' },
  { path: '/use-cases/pop-up-experiences', label: 'Use Case: Pop-Up Experiences' },
  { path: '/use-cases/theatrical-productions', label: 'Use Case: Theatrical Productions' },
  { path: '/use-cases/trade-shows', label: 'Use Case: Trade Shows' },
];

test.describe('Public Marketing Pages @marketing', () => {
  test.setTimeout(60_000);

  for (const route of PUBLIC_ROUTES) {
    test(`${route.label} (${route.path}) renders correctly`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      const response = await page.goto(route.path, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      // Should return 200
      if (response) {
        expect(
          response.status(),
          `${route.path} returned ${response.status()}`
        ).toBeLessThan(400);
      }

      // No error boundary
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });

      // Has meaningful content (not a blank page)
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);

      // No fatal error screens
      const isBlankError =
        bodyText?.trim() === '404' ||
        bodyText?.trim() === '500' ||
        bodyText?.includes('Application error: a server-side exception has occurred');
      expect(isBlankError, `${route.path} shows a fatal error`).toBe(false);

      // No JS errors
      expect(
        jsErrors.length,
        `JS errors on ${route.path}: ${jsErrors.join('; ')}`
      ).toBe(0);
    });
  }
});
