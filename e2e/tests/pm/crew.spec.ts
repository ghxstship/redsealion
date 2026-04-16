/**
 * FlyteDeck E2E — Crew Hub
 *
 * RoleGate: resource="crew" — controller viewOnly → ALLOWED
 * Sub-pages also pass via resource="crew" (viewOnly)
 */
import { test } from '../../fixtures/test-fixtures';
import { expectPageRendered, expectNoRawI18nKeys, expectAccessDenied } from '../../helpers/assertions';
import type { Role } from '../../helpers/routes';

const ALL_INTERNAL: Role[] = ['owner', 'admin', 'controller', 'collaborator'];

const CREW_ROUTES = [
  '/app/crew',
  '/app/crew/availability',
  '/app/crew/onboarding',
  '/app/crew/recruitment',
  '/app/crew/schedule',
];

test.describe('Crew Hub @crew', () => {
  for (const role of ALL_INTERNAL) {
    for (const route of CREW_ROUTES) {
      test(`${route} renders for ${role}`, async ({ authenticatedPage }) => {
        const page = await authenticatedPage(role);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expectPageRendered(page);
        await expectNoRawI18nKeys(page);
      });
    }
  }

  test('/app/crew denied for viewer', async ({ authenticatedPage }) => {
    const page = await authenticatedPage('viewer');
    await page.goto('/app/crew');
    await expectAccessDenied(page);
  });
});
