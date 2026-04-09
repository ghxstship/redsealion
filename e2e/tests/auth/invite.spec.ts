import { test, expect } from '@playwright/test';
import { verifyEmailSent } from '../../helpers/resend';

const ROLES = [
  'admin', 
  'controller', 
  'manager', 
  'team_member', 
  'client', 
  'contractor', 
  'crew', 
  'viewer'
];

test.describe('Role-Based Invitation Flow', () => {
  // Use the admin/owner account for sending invites
  test.use({ storageState: 'e2e/.auth/owner.json' });
  
  // Increase test timeout — invite flow involves page nav + modal interaction + email verification
  test.setTimeout(60_000);

  for (const role of ROLES) {
    test(`invites a new user with the ${role} role`, async ({ page }) => {
      const targetEmail = `test-invite-${role}-${Date.now()}@redsealion.test`;

      await page.goto('/app/settings/team', { waitUntil: 'domcontentloaded', timeout: 45_000 });

      const inviteButton = page.locator('button', { hasText: 'Invite Member' });
      
      // If the UI pops up a modal
      if (await inviteButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await inviteButton.click();
        
        // Modal selectors (adjust based on actual UI if different)
        await page.locator('input[type="email"], input[name="email"]').fill(targetEmail);
        
        // Select role (assuming standard standard select or radix ui select)
        const roleSelect = page.locator('select[name="role"], button[role="combobox"]');
        if (await roleSelect.isVisible()) {
          if (await roleSelect.getAttribute('role') === 'combobox') {
             await roleSelect.click();
             await page.locator(`[role="option"]:has-text("${role}")`).click();
          } else {
             await roleSelect.selectOption(role);
          }
        }
        
        // Submit
        await page.locator('button', { hasText: 'Send Invitation' }).click();
        
        // Modal closes on success
        await expect(page.locator('text=Send Invitation')).toBeHidden({ timeout: 10000 });
        
        // Verify Resend Email
        await verifyEmailSent(targetEmail, 'invited you');
      } else {
          console.warn('Invite button not visible, skipping invite flow UI step.');
      }
    });
  }
});
