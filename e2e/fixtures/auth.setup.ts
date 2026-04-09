/**
 * FlyteDeck E2E — Global Auth Setup
 *
 * Runs once before the entire test suite.
 * Creates test users/orgs in Supabase, logs each user in,
 * and saves their browser storage state to e2e/.auth/<role>.json.
 */
import { chromium } from '@playwright/test';
import { seedTestData, ROLE_EMAILS, TEST_PASSWORD, ROLE_LIST } from '../helpers/seed';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const MAX_AUTH_RETRIES = 2;
const AUTH_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function hasValidAuthFile(role: string): boolean {
  const authFile = path.join(__dirname, '..', '.auth', `${role}.json`);
  try {
    const stat = fs.statSync(authFile);
    const age = Date.now() - stat.mtimeMs;
    if (age < AUTH_FILE_MAX_AGE_MS && stat.size > 100) {
      return true;
    }
  } catch { /* file doesn't exist */ }
  return false;
}

async function globalSetup() {
  console.log('[E2E Setup] Seeding test data...');
  await seedTestData();
  console.log('[E2E Setup] Test data seeded.');

  console.log('[E2E Setup] Authenticating test users...');
  const browser = await chromium.launch();

  for (const role of ROLE_LIST) {
    // Skip roles that already have a valid (recent) auth file
    if (hasValidAuthFile(role)) {
      console.log(`  ✓ ${role} auth file fresh — skipping login`);
      continue;
    }

    const email = ROLE_EMAILS[role];
    let authenticated = false;

    for (let attempt = 0; attempt <= MAX_AUTH_RETRIES && !authenticated; attempt++) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        if (attempt > 0) {
          console.log(`  ↻ ${role} retry #${attempt}...`);
        }

        // Navigate to login page
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

        // Dismiss cookie consent banner if present
        const cookieAcceptBtn = page.locator('button:has-text("Accept All"), button:has-text("Reject All")').first();
        if (await cookieAcceptBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await cookieAcceptBtn.click();
          await page.waitForTimeout(500);
        }

        // Fill login form
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');

        await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
        await emailInput.fill(email);
        await passwordInput.fill(TEST_PASSWORD);

        // Submit
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Wait for redirect to /app or /onboarding (both are valid post-login states)
        await page.waitForURL(
          (url) => url.pathname.startsWith('/app') || url.pathname.startsWith('/onboarding'),
          { timeout: 30_000 }
        );

        // Save storage state
        const authFile = path.join(__dirname, '..', '.auth', `${role}.json`);
        await context.storageState({ path: authFile });
        console.log(`  ✓ ${role} authenticated → ${authFile}`);
        authenticated = true;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message.split('\n')[0] : String(error);
        console.error(`  ✗ ${role} auth failed (attempt ${attempt + 1}): ${errMsg}`);
        if (attempt === MAX_AUTH_RETRIES) {
          // Save a screenshot for debugging on final failure
          const screenshotPath = path.join(__dirname, '..', '.auth', `${role}-error.png`);
          await page.screenshot({ path: screenshotPath });
        }
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log('[E2E Setup] All users authenticated.');
}

export default globalSetup;
