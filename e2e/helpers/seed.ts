/**
 * FlyteDeck E2E — Supabase Seed Utilities
 *
 * Uses the service_role key to manage test users, organizations,
 * and memberships for E2E testing across all roles and tiers.
 *
 * 10-role architecture:
 *   INTERNAL: developer, owner, admin, controller, manager, team_member
 *   EXTERNAL: client, contractor, crew, viewer
 */
import { createClient } from '@supabase/supabase-js';
import type { Role, Tier } from './routes';

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Deterministic UUIDs for test entities (v4-format) */
export const TEST_IDS = {
  orgs: {
    free:         'e2e00000-0000-4000-a000-000000000001',
    starter:      'e2e00000-0000-4000-a000-000000000002',
    professional: 'e2e00000-0000-4000-a000-000000000003',
    enterprise:   'e2e00000-0000-4000-a000-000000000004',
  },
  users: {
    developer:   'e2e00000-0000-4000-b000-000000000001',
    owner:       'e2e00000-0000-4000-b000-000000000002',
    admin:       'e2e00000-0000-4000-b000-000000000003',
    controller:  'e2e00000-0000-4000-b000-000000000009',
    manager:     'e2e00000-0000-4000-b000-000000000004',
    team_member: 'e2e00000-0000-4000-b000-000000000005',
    client:      'e2e00000-0000-4000-b000-000000000007',
    contractor:  'e2e00000-0000-4000-b000-000000000010',
    crew:        'e2e00000-0000-4000-b000-000000000006',
    viewer:      'e2e00000-0000-4000-b000-000000000008',
  },
  clients: {
    alpha: 'e2e00000-0000-4000-c000-000000000001',
    beta:  'e2e00000-0000-4000-c000-000000000002',
  },
  proposals: {
    draft:    'e2e00000-0000-4000-d000-000000000001',
    approved: 'e2e00000-0000-4000-d000-000000000002',
  },
  deals: {
    alpha: 'e2e00000-0000-4000-e000-000000000001',
  },
  invoices: {
    deposit: 'e2e00000-0000-4000-f000-000000000001',
  },
  tasks: {
    review: 'e2e00000-0000-4000-a100-000000000001',
  },
  leads: {
    prospect: 'e2e00000-0000-4000-a200-000000000001',
  },
} as const;

const TEST_PASSWORD = 'E2eTestPass!2026';

const ROLE_EMAILS: Record<Role, string> = {
  developer:   'e2e-developer@test.fd',
  owner:       'e2e-owner@test.fd',
  admin:       'e2e-admin@test.fd',
  controller:  'e2e-controller@test.fd',
  manager:     'e2e-manager@test.fd',
  team_member: 'e2e-teammember@test.fd',
  client:      'e2e-client@test.fd',
  contractor:  'e2e-contractor@test.fd',
  crew:        'e2e-crew@test.fd',
  viewer:      'e2e-viewer@test.fd',
};

/** Map our role names to the Harbor Master role UUIDs (from seed data + migration 00070) */
const ROLE_UUID_MAP: Record<Role, string> = {
  developer:   '00000000-0000-0000-0000-000000000001',
  owner:       '00000000-0000-0000-0000-000000000010',
  admin:       '00000000-0000-0000-0000-000000000020',
  controller:  '00000000-0000-0000-0000-000000000025',
  manager:     '00000000-0000-0000-0000-000000000030',
  team_member: '00000000-0000-0000-0000-000000000040',
  client:      '00000000-0000-0000-0000-000000000055',
  contractor:  '00000000-0000-0000-0000-000000000060',
  crew:        '00000000-0000-0000-0000-000000000045',
  viewer:      '00000000-0000-0000-0000-000000000050',
};

const TIER_LIST: Tier[] = ['free', 'starter', 'professional', 'enterprise'];
const ROLE_LIST: Role[] = Object.keys(ROLE_EMAILS) as Role[];

// ─── Client ──────────────────────────────────────────────────────────────────

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Seed Functions ──────────────────────────────────────────────────────────

export async function seedTestData() {
  const supabase = getAdminClient();

  // 1. Create test organizations (one per tier)
  for (const tier of TIER_LIST) {
    const orgId = TEST_IDS.orgs[tier as keyof typeof TEST_IDS.orgs];
    const { error } = await supabase.from('organizations').upsert({
      id: orgId,
      name: `E2E Test Org (${tier})`,
      slug: `e2e-test-${tier}`,
      subscription_tier: tier,
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en',
      invoice_prefix: 'E2E',
      proposal_prefix: 'E2E',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      first_day_of_week: 0,
      number_format: 'en-US',
    }, { onConflict: 'id' });
    if (error) console.warn(`  ⚠ Org ${tier}: ${error.message}`);
  }

  // 2. Create test auth users and profile rows
  for (const role of ROLE_LIST) {
    const email = ROLE_EMAILS[role];
    const userId = TEST_IDS.users[role];

    // Create auth user — ignore "already exists" errors
    const { error: createError } = await supabase.auth.admin.createUser({
      id: userId,
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `E2E ${role}` },
    });
    if (createError && !createError.message.includes('already')) {
      console.warn(`  ⚠ Auth user ${role}: ${createError.message}`);
    }

    // Create users table row
    const displayName = role.replace(/_/g, ' ');
    const firstName = 'E2E';
    const lastName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    const { error: profileError } = await supabase.from('users').upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      status: 'active',
    }, { onConflict: 'id' });
    if (profileError) console.warn(`  ⚠ Profile ${role}: ${profileError.message}`);
  }

  // 3. Create organization memberships
  const primaryOrgId = TEST_IDS.orgs.professional;
  const EXTERNAL_ROLES = ['client', 'contractor', 'crew', 'viewer'];
  for (const role of ROLE_LIST) {
    const userId = TEST_IDS.users[role];
    const { error } = await supabase.from('organization_memberships').upsert({
      user_id: userId,
      organization_id: primaryOrgId,
      role_id: ROLE_UUID_MAP[role],
      seat_type: EXTERNAL_ROLES.includes(role) ? 'external' : 'internal',
      status: 'active',
      joined_via: 'manual_add',
    }, { onConflict: 'user_id,organization_id' });
    if (error) console.warn(`  ⚠ Membership ${role}: ${error.message}`);
  }

  // 4. Seed sample data for workflows
  await seedSampleData(supabase, primaryOrgId);
}

async function seedSampleData(supabase: ReturnType<typeof getAdminClient>, orgId: string) {
  const ownerId = TEST_IDS.users.owner;

  await supabase.from('clients').upsert([
    {
      id: TEST_IDS.clients.alpha,
      organization_id: orgId,
      company_name: 'E2E Test Client Alpha',
      industry: 'Technology',
      source: 'referral',
      tags: ['e2e-test'],
    },
    {
      id: TEST_IDS.clients.beta,
      organization_id: orgId,
      company_name: 'E2E Test Client Beta',
      industry: 'Entertainment',
      source: 'inbound',
      tags: ['e2e-test'],
    },
  ], { onConflict: 'id' });

  await supabase.from('proposals').upsert([
    {
      id: TEST_IDS.proposals.draft,
      organization_id: orgId,
      client_id: TEST_IDS.clients.alpha,
      name: 'E2E Brand Activation',
      status: 'draft',
      currency: 'USD',
      total_value: 150000,
      version: 1,
      created_by: ownerId,
    },
    {
      id: TEST_IDS.proposals.approved,
      organization_id: orgId,
      client_id: TEST_IDS.clients.beta,
      name: 'E2E Festival Build',
      status: 'approved',
      currency: 'USD',
      total_value: 300000,
      version: 1,
      created_by: ownerId,
    },
  ], { onConflict: 'id' });

  await supabase.from('deals').upsert([
    {
      id: TEST_IDS.deals.alpha,
      organization_id: orgId,
      client_id: TEST_IDS.clients.alpha,
      proposal_id: TEST_IDS.proposals.draft,
      title: 'E2E Deal Alpha',
      deal_value: 150000,
      stage: 'qualified',
      probability: 60,
      owner_id: ownerId,
    },
  ], { onConflict: 'id' });

  await supabase.from('invoices').upsert([
    {
      id: TEST_IDS.invoices.deposit,
      organization_id: orgId,
      client_id: TEST_IDS.clients.alpha,
      proposal_id: TEST_IDS.proposals.draft,
      invoice_number: 'E2E-2026-001',
      type: 'deposit',
      status: 'sent',
      issue_date: '2026-04-01',
      due_date: '2026-04-15',
      subtotal: 75000,
      tax_amount: 0,
      total: 75000,
      amount_paid: 0,
      currency: 'USD',
    },
  ], { onConflict: 'id' });

  await supabase.from('tasks').upsert([
    {
      id: TEST_IDS.tasks.review,
      organization_id: orgId,
      title: 'E2E Review mockups',
      status: 'todo',
      priority: 'medium',
      assignee_id: TEST_IDS.users.team_member,
      created_by: ownerId,
    },
  ], { onConflict: 'id' });

  await supabase.from('leads').upsert([
    {
      id: TEST_IDS.leads.prospect,
      organization_id: orgId,
      source: 'website',
      company_name: 'E2E Prospect',
      contact_first_name: 'Test',
      contact_last_name: 'Lead',
      contact_email: 'e2e-lead@test.fd',
      status: 'new',
      created_by: ownerId,
    },
  ], { onConflict: 'id' });
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export async function cleanupTestData() {
  const supabase = getAdminClient();

  const tables = [
    'leads', 'tasks', 'invoices', 'deals', 'proposals', 'clients',
    'organization_memberships',
  ];

  for (const table of tables) {
    await supabase.from(table).delete().like('id', 'e2e0%');
  }

  for (const tier of TIER_LIST) {
    const orgId = TEST_IDS.orgs[tier as keyof typeof TEST_IDS.orgs];
    await supabase.from('organizations').delete().eq('id', orgId);
  }

  for (const role of ROLE_LIST) {
    await supabase.auth.admin.deleteUser(TEST_IDS.users[role]).catch(() => {});
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { TEST_PASSWORD, ROLE_EMAILS, ROLE_LIST, TIER_LIST };
