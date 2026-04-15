/**
 * FlyteDeck E2E — Supabase Seed Utilities
 *
 * Uses the service_role key to manage test users, organizations,
 * and memberships for E2E testing across all roles and tiers.
 *
 * Two-Tier RBAC Architecture (post migration 00135):
 *   INTERNAL: developer, owner, admin, controller, collaborator
 *   EXTERNAL: contractor, crew, client, viewer, community
 */
import { createClient } from '@supabase/supabase-js';
import type { Role, Tier } from './routes';

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Deterministic UUIDs for test entities — e2e-prefixed for easy cleanup */
export const TEST_IDS = {
  orgs: {
    free:         'e2e00000-0000-4000-a000-000000000001',
    starter:      'e2e00000-0000-4000-a000-000000000002',
    professional: 'e2e00000-0000-4000-a000-000000000003',
    enterprise:   'e2e00000-0000-4000-a000-000000000004',
  },
  users: {
    developer:    'e2e00000-0000-4000-b000-000000000001',
    owner:        'e2e00000-0000-4000-b000-000000000002',
    admin:        'e2e00000-0000-4000-b000-000000000003',
    controller:   'e2e00000-0000-4000-b000-000000000004',
    collaborator: 'e2e00000-0000-4000-b000-000000000005',
    contractor:   'e2e00000-0000-4000-b000-000000000006',
    crew:         'e2e00000-0000-4000-b000-000000000007',
    client:       'e2e00000-0000-4000-b000-000000000008',
    viewer:       'e2e00000-0000-4000-b000-000000000009',
    community:    'e2e00000-0000-4000-b000-000000000010',
  },
  projects: {
    primary:   'e2e00000-0000-4000-c000-000000000002',
    secondary: 'e2e00000-0000-4000-c000-000000000003',
  },
  teams: {
    alpha: 'e2e00000-0000-4000-c000-000000000001',
  },
  clients: {
    alpha: 'e2e00000-0000-4000-d000-000000000001',
    beta:  'e2e00000-0000-4000-d000-000000000002',
  },
  proposals: {
    draft:    'e2e00000-0000-4000-e000-000000000001',
    approved: 'e2e00000-0000-4000-e000-000000000002',
    inProd:   'e2e00000-0000-4000-e000-000000000003',
  },
  deals: {
    alpha: 'e2e00000-0000-4000-e100-000000000001',
    beta:  'e2e00000-0000-4000-e100-000000000002',
  },
  invoices: {
    deposit:  'e2e00000-0000-4000-e200-000000000001',
    progress: 'e2e00000-0000-4000-e200-000000000002',
  },
  tasks: {
    review:   'e2e00000-0000-4000-e300-000000000001',
    bom:      'e2e00000-0000-4000-e300-000000000002',
    crew:     'e2e00000-0000-4000-e300-000000000003',
  },
  leads: {
    prospect:  'e2e00000-0000-4000-e400-000000000001',
    contacted: 'e2e00000-0000-4000-e400-000000000002',
  },
  events: {
    primary:   'e2e00000-0000-4000-e500-000000000001',
    secondary: 'e2e00000-0000-4000-e500-000000000002',
  },
  locations: {
    timesSquare: 'e2e00000-0000-4000-e600-000000000001',
    empirePolo:  'e2e00000-0000-4000-e600-000000000002',
  },
  crewProfiles: {
    rigger:     'e2e00000-0000-4000-e700-000000000001',
    fabricator: 'e2e00000-0000-4000-e700-000000000002',
  },
  assets: {
    truss:     'e2e00000-0000-4000-e800-000000000001',
    led:       'e2e00000-0000-4000-e800-000000000002',
    generator: 'e2e00000-0000-4000-e800-000000000003',
  },
  workOrders: {
    rigging:  'e2e00000-0000-4000-e900-000000000001',
    ledSetup: 'e2e00000-0000-4000-e900-000000000002',
  },
} as const;

const TEST_PASSWORD = 'E2eTestPass!2026';

const ROLE_EMAILS: Record<Role, string> = {
  developer:    'developer@redsealion.test',
  owner:        'owner@redsealion.test',
  admin:        'admin@redsealion.test',
  controller:   'controller@redsealion.test',
  collaborator: 'collaborator@redsealion.test',
  contractor:   'contractor@redsealion.test',
  crew:         'crew@redsealion.test',
  client:       'client@redsealion.test',
  viewer:       'viewer@redsealion.test',
  community:    'community@redsealion.test',
};

/**
 * Map role names to canonical Harbor Master role UUIDs (post migration 00135).
 *
 * IMPORTANT: These must exactly match the roles table after 00135.
 * - 00030 was renamed from 'manager' to 'collaborator'
 * - 00040 (member) was DELETED
 * - 00101/00102 (team_lead/team_member) were DELETED
 * - 00025 (controller) was ADDED in 00070
 * - 00045 (crew) was ADDED in 00070
 * - 00055 (client) was ADDED in 00070
 * - 00070 (community) was ADDED in 00135
 */
const ROLE_UUID_MAP: Record<Role, string> = {
  developer:    '00000000-0000-0000-0000-000000000001',
  owner:        '00000000-0000-0000-0000-000000000010',
  admin:        '00000000-0000-0000-0000-000000000020',
  controller:   '00000000-0000-0000-0000-000000000025',
  collaborator: '00000000-0000-0000-0000-000000000030',
  crew:         '00000000-0000-0000-0000-000000000045',
  viewer:       '00000000-0000-0000-0000-000000000050',
  client:       '00000000-0000-0000-0000-000000000055',
  contractor:   '00000000-0000-0000-0000-000000000060',
  community:    '00000000-0000-0000-0000-000000000070',
};

const EXTERNAL_ROLES: Role[] = ['contractor', 'crew', 'client', 'viewer', 'community'];
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
      language: 'en-US',
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
    if (createError && !createError.message.includes('already') && !createError.message.includes('Database error')) {
      console.warn(`  ⚠ Auth user ${role}: ${createError.message}`);
    }

    // Create users table row
    const displayName = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
    const { error: profileError } = await supabase.from('users').upsert({
      id: userId,
      email,
      first_name: 'E2E',
      last_name: displayName,
      full_name: `E2E ${displayName}`,
      status: 'active',
    }, { onConflict: 'id' });
    if (profileError) console.warn(`  ⚠ Profile ${role}: ${profileError.message}`);
  }

  // 3. Create organization memberships — all users on enterprise org
  const primaryOrgId = TEST_IDS.orgs.enterprise;
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

  // 4. Owner on lower-tier orgs for tier-gate testing
  for (const tier of ['free', 'starter', 'professional'] as const) {
    const orgId = TEST_IDS.orgs[tier];
    await supabase.from('organization_memberships').upsert({
      user_id: TEST_IDS.users.owner,
      organization_id: orgId,
      role_id: ROLE_UUID_MAP.owner,
      seat_type: 'internal',
      status: 'active',
      joined_via: 'manual_add',
    }, { onConflict: 'user_id,organization_id' });
  }

  // 5. Seed sample data for workflows
  await seedSampleData(supabase, primaryOrgId);
}

async function seedSampleData(supabase: ReturnType<typeof getAdminClient>, orgId: string) {
  const ownerId = TEST_IDS.users.owner;
  const adminId = TEST_IDS.users.admin;
  const collaboratorId = TEST_IDS.users.collaborator;

  // Clients
  await supabase.from('clients').upsert([
    {
      id: TEST_IDS.clients.alpha,
      organization_id: orgId,
      company_name: 'E2E Apex Brands International',
      industry: 'Brand Marketing',
      source: 'referral',
      tags: ['e2e-test', 'vip'],
    },
    {
      id: TEST_IDS.clients.beta,
      organization_id: orgId,
      company_name: 'E2E Horizon Live Entertainment',
      industry: 'Live Events',
      source: 'inbound',
      tags: ['e2e-test'],
    },
  ], { onConflict: 'id' });

  // Projects
  await supabase.from('projects').upsert([
    {
      id: TEST_IDS.projects.primary,
      organization_id: orgId,
      name: 'E2E NYC Brand Activation 2026',
      slug: 'e2e-nyc-activation-2026',
      status: 'active',
    },
    {
      id: TEST_IDS.projects.secondary,
      organization_id: orgId,
      name: 'E2E LA Festival Build Q3',
      slug: 'e2e-la-festival-q3',
      status: 'in_progress',
    },
  ], { onConflict: 'id' });

  // Proposals
  await supabase.from('proposals').upsert([
    {
      id: TEST_IDS.proposals.draft,
      organization_id: orgId,
      client_id: TEST_IDS.clients.alpha,
      name: 'E2E Brand Activation',
      status: 'draft',
      currency: 'USD',
      total_value: 250000,
      version: 1,
      created_by: ownerId,
      project_id: TEST_IDS.projects.primary,
    },
    {
      id: TEST_IDS.proposals.approved,
      organization_id: orgId,
      client_id: TEST_IDS.clients.beta,
      name: 'E2E Festival Build',
      status: 'approved',
      currency: 'USD',
      total_value: 480000,
      version: 2,
      created_by: ownerId,
      project_id: TEST_IDS.projects.secondary,
    },
    {
      id: TEST_IDS.proposals.inProd,
      organization_id: orgId,
      client_id: TEST_IDS.clients.alpha,
      name: 'E2E Holiday Pop-Up',
      status: 'in_production',
      currency: 'USD',
      total_value: 175000,
      version: 1,
      created_by: adminId,
      project_id: TEST_IDS.projects.primary,
    },
  ], { onConflict: 'id' });

  // Deals
  await supabase.from('deals').upsert([
    {
      id: TEST_IDS.deals.alpha,
      organization_id: orgId,
      client_id: TEST_IDS.clients.alpha,
      proposal_id: TEST_IDS.proposals.draft,
      title: 'E2E Deal Alpha',
      deal_value: 250000,
      stage: 'qualified',
      probability: 60,
      owner_id: ownerId,
    },
    {
      id: TEST_IDS.deals.beta,
      organization_id: orgId,
      client_id: TEST_IDS.clients.beta,
      proposal_id: TEST_IDS.proposals.approved,
      title: 'E2E Deal Beta',
      deal_value: 480000,
      stage: 'contract_signed',
      probability: 95,
      owner_id: adminId,
    },
  ], { onConflict: 'id' });

  // Invoices
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
      subtotal: 125000,
      tax_amount: 0,
      total: 125000,
      amount_paid: 0,
      currency: 'USD',
    },
    {
      id: TEST_IDS.invoices.progress,
      organization_id: orgId,
      client_id: TEST_IDS.clients.beta,
      proposal_id: TEST_IDS.proposals.approved,
      invoice_number: 'E2E-2026-002',
      type: 'progress',
      status: 'overdue',
      issue_date: '2026-03-01',
      due_date: '2026-03-31',
      subtotal: 192000,
      tax_amount: 0,
      total: 192000,
      amount_paid: 96000,
      currency: 'USD',
    },
  ], { onConflict: 'id' });

  // Tasks
  await supabase.from('tasks').upsert([
    {
      id: TEST_IDS.tasks.review,
      organization_id: orgId,
      title: 'E2E Review activation mockups',
      status: 'todo',
      priority: 'high',
      assignee_id: collaboratorId,
      created_by: ownerId,
      project_id: TEST_IDS.projects.primary,
    },
    {
      id: TEST_IDS.tasks.bom,
      organization_id: orgId,
      title: 'E2E Finalize BOM for festival build',
      status: 'in_progress',
      priority: 'urgent',
      assignee_id: adminId,
      created_by: ownerId,
      project_id: TEST_IDS.projects.secondary,
    },
    {
      id: TEST_IDS.tasks.crew,
      organization_id: orgId,
      title: 'E2E Update crew call sheets',
      status: 'done',
      priority: 'medium',
      assignee_id: collaboratorId,
      created_by: adminId,
      project_id: TEST_IDS.projects.primary,
    },
  ], { onConflict: 'id' });

  // Leads
  await supabase.from('leads').upsert([
    {
      id: TEST_IDS.leads.prospect,
      organization_id: orgId,
      source: 'website',
      company_name: 'E2E Stellar Events Co.',
      contact_first_name: 'Sarah',
      contact_last_name: 'Chen',
      contact_email: 'sarah@stellar.test',
      status: 'new',
      created_by: ownerId,
    },
    {
      id: TEST_IDS.leads.contacted,
      organization_id: orgId,
      source: 'referral',
      company_name: 'E2E Nova Productions',
      contact_first_name: 'Marcus',
      contact_last_name: 'Rivera',
      contact_email: 'marcus@nova.test',
      status: 'contacted',
      created_by: collaboratorId,
    },
  ], { onConflict: 'id' });

  // Locations
  await supabase.from('locations').upsert([
    {
      id: TEST_IDS.locations.timesSquare,
      organization_id: orgId,
      name: 'E2E Times Square Plaza',
      location_type: 'venue',
      city: 'New York',
      state: 'NY',
      country: 'US',
      status: 'active',
    },
    {
      id: TEST_IDS.locations.empirePolo,
      organization_id: orgId,
      name: 'E2E Empire Polo Club',
      location_type: 'venue',
      city: 'Indio',
      state: 'CA',
      country: 'US',
      status: 'active',
    },
  ], { onConflict: 'id' });

  // Events
  await supabase.from('events').upsert([
    {
      id: TEST_IDS.events.primary,
      organization_id: orgId,
      name: 'E2E NYC July 4th Activation',
      slug: 'e2e-nyc-july-4th',
      status: 'confirmed',
      starts_at: '2026-07-03T08:00:00Z',
      ends_at: '2026-07-05T22:00:00Z',
      location_id: TEST_IDS.locations.timesSquare,
      created_by: ownerId,
    },
    {
      id: TEST_IDS.events.secondary,
      organization_id: orgId,
      name: 'E2E Coachella Build Week',
      slug: 'e2e-coachella-build',
      status: 'planning',
      starts_at: '2026-09-10T06:00:00Z',
      ends_at: '2026-09-20T23:00:00Z',
      location_id: TEST_IDS.locations.empirePolo,
      created_by: adminId,
    },
  ], { onConflict: 'id' });

  // Assets
  await supabase.from('assets').upsert([
    {
      id: TEST_IDS.assets.truss,
      organization_id: orgId,
      name: 'E2E Truss Section 12x12',
      asset_number: 'E2E-AST-001',
      category: 'Structural',
      status: 'available',
      current_location: 'Warehouse A',
      purchase_price: 8500,
      condition: 'good',
    },
    {
      id: TEST_IDS.assets.led,
      organization_id: orgId,
      name: 'E2E LED Panel Wall 4x8',
      asset_number: 'E2E-AST-002',
      category: 'AV',
      status: 'deployed',
      current_location: 'Event Site',
      purchase_price: 12000,
      condition: 'good',
    },
    {
      id: TEST_IDS.assets.generator,
      organization_id: orgId,
      name: 'E2E Generator 20kW Portable',
      asset_number: 'E2E-AST-003',
      category: 'Power',
      status: 'maintenance',
      current_location: 'Warehouse A',
      purchase_price: 15000,
      condition: 'fair',
    },
  ], { onConflict: 'id' });

  // Work Orders
  await supabase.from('work_orders').upsert([
    {
      id: TEST_IDS.workOrders.rigging,
      organization_id: orgId,
      title: 'E2E Stage Rigging Install',
      status: 'open',
      priority: 'high',
      event_id: TEST_IDS.events.primary,
      created_by: ownerId,
    },
    {
      id: TEST_IDS.workOrders.ledSetup,
      organization_id: orgId,
      title: 'E2E LED Wall Setup & Calibration',
      status: 'in_progress',
      priority: 'medium',
      event_id: TEST_IDS.events.secondary,
      created_by: adminId,
    },
  ], { onConflict: 'id' });
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export async function cleanupTestData() {
  const supabase = getAdminClient();

  // Delete in dependency order (children first)
  const tables = [
    'work_orders', 'crew_bookings', 'crew_profiles',
    'leads', 'tasks', 'invoices', 'deals', 'proposals',
    'events', 'locations', 'assets',
    'clients', 'project_memberships', 'team_memberships',
    'organization_memberships', 'projects', 'teams',
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

export { TEST_PASSWORD, ROLE_EMAILS, ROLE_LIST, EXTERNAL_ROLES };
