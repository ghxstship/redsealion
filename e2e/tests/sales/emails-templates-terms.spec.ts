/**
 * FlyteDeck E2E — Emails, Templates, Terms
 *
 * Emails: RoleGate resource="email_inbox" — controller has viewOnly → ALLOWED
 * Templates: RoleGate resource="templates" — controller has viewOnly → ALLOWED
 * Terms: RoleGate resource="terms" — controller has viewOnly → ALLOWED
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

test.describe('Emails @emails', () => {
  for (const role of ALLOWED_ROLES) {
    test(`/app/emails renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/emails');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/emails/templates renders for owner', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('owner');
    await page.goto('/app/emails/templates');
    await expectPageRendered(page);
  });

  test('/app/emails denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/emails');
    await expectAccessDenied(page);
  });
});

test.describe('Templates @templates', () => {
  for (const role of ALLOWED_ROLES) {
    test(`/app/templates renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/templates');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/templates denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/templates');
    await expectAccessDenied(page);
  });
});

test.describe('Terms @terms', () => {
  for (const role of ALLOWED_ROLES) {
    test(`/app/terms renders for ${role}`, async ({ authenticatedPage }) => {
      const page = await authenticatedPage(role);
      await page.goto('/app/terms');
      await expectPageRendered(page);
      await expectNoRawI18nKeys(page);
    });
  }

  test('/app/terms denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/terms');
    await expectAccessDenied(page);
  });
});
