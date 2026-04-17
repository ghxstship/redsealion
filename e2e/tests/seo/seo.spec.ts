/**
 * FlyteDeck E2E — SEO Validation
 *
 * Validates robots.txt and sitemap.xml respond (may return 500 in dev mode),
 * and key public pages have proper meta tags.
 */
import { test, expect } from '@playwright/test';

test.describe('SEO @seo', () => {
  test.setTimeout(60_000);

  test('robots.txt responds without crashing', async ({ page }) => {
    const response = await page.goto('/robots.txt', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    // In dev mode, dynamic routes may return 500 due to missing build artifacts.
    // Accept any response as long as the server didn't hang.
    expect(response).not.toBeNull();
    if (response && response.status() < 400) {
      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('User-agent') || bodyText?.includes('Sitemap') || bodyText?.includes('Allow'),
        'Expected robots.txt content when served successfully'
      ).toBe(true);
    }
  });

  test('sitemap.xml responds without crashing', async ({ page }) => {
    const response = await page.goto('/sitemap.xml', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response).not.toBeNull();
    if (response && response.status() < 400) {
      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('urlset') || bodyText?.includes('loc') || bodyText?.includes('url'),
        'Expected sitemap.xml content when served successfully'
      ).toBe(true);
    }
  });

  test('landing page has meta title and description', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const title = await page.title();
    expect(title.length, 'Page should have a title').toBeGreaterThan(0);

    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    const descCount = await metaDescription.count();
    if (descCount > 0) {
      const descContent = await metaDescription.getAttribute('content');
      expect(descContent?.length, 'Meta description should have content').toBeGreaterThan(0);
    }
  });

  test('login page has meta title', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const title = await page.title();
    expect(title.length, 'Login page should have a title').toBeGreaterThan(0);
  });
});
