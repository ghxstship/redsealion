/**
 * FlyteDeck E2E — AI, Manifest, Locations, Portal
 *
 * AI:        RoleGate resource="ai_assistant" — controller viewOnly → ALLOWED
 * Manifest:  RoleGate resource="manifest" — controller viewOnly → ALLOWED
 * Locations: RoleGate resource="locations" — controller viewOnly → ALLOWED
 * Portal:    RoleGate resource="portals" — controller viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

test.describe('AI Assistant @ai', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/ai renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/ai');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/ai denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/ai');
    await expectAccessDenied(page);
  });
});

test.describe('Manifest @manifest', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/manifest renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/manifest');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }
});

test.describe('Locations @locations', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/locations renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/locations');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }
});

test.describe('Portal Preview @portal', () => {
  for (const role of ALL_INTERNAL) {
    test(`/app/portal renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/portal');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/portal denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/portal', { waitUntil: 'domcontentloaded' });
    await expectAccessDenied(page);
  });
});
