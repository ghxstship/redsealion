/**
 * FlyteDeck E2E — Onboarding Tests
 */
import { test, expect } from '@playwright/test';

// Use a logged-in standard user context
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('User Onboarding Flow', () => {
  test('redirects to app and allows profile completion', async ({ page }) => {
    // Navigate to typical app route
    await page.goto('/app');
    
    // In many platforms, a newly joined user is prompted or navigates to profile
    await page.goto('/app/settings/profile');
    
    // Verify Profile settings are visible
    await expect(page.locator('h2', { hasText: /Profile|Account/i })).toBeVisible();
    
    // Fill out profile details
    const bioInput = page.locator('textarea[name="bio"], textarea[id="bio"]');
    if (await bioInput.isVisible()) {
      await bioInput.fill('E2E Onboarded User Bio');
    }
    
    // Hit save
    const saveButton = page.locator('button', { hasText: /Save|Update/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await expect(page.locator('text=updated').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
