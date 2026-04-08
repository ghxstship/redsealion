/**
 * FlyteDeck E2E — Global Teardown
 *
 * Runs once after the entire test suite completes.
 * Cleans up all test users, organizations, and sample data from Supabase.
 */
import { cleanupTestData } from '../helpers/seed';

async function globalTeardown() {
  console.log('[E2E Teardown] Cleaning up test data...');
  await cleanupTestData();
  console.log('[E2E Teardown] Done.');
}

export default globalTeardown;
