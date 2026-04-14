/**
 * FlyteDeck E2E Workflow Test Helpers
 *
 * Provides mock factories, Supabase stubs, and request builders
 * for validating all FlyteDeck domain workflows end-to-end.
 */
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase mock builder – chainable query simulation
// ---------------------------------------------------------------------------

type RowData = Record<string, unknown>;

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

function createMockQueryBuilder(resolvedData: RowData | RowData[] | null = null, error: { message: string } | null = null): MockQueryBuilder {
  const result = { data: resolvedData, error };
  const builder: MockQueryBuilder = {} as MockQueryBuilder;

  const chainMethods = [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'not', 'in', 'like',
    'gte', 'lte', 'lt', 'gt',
    'order', 'limit',
  ] as const;

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  builder.single = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);

  // Make chainable methods also resolve when awaited
  const promisified = new Proxy(builder, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (val: unknown) => void) => resolve(result);
      }
      return (target as unknown as Record<string | symbol, unknown>)[prop];
    },
  });

  // Re-wire chain methods to return promisified proxy
  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(promisified);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);

  return builder;
}

interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
}

// ---------------------------------------------------------------------------
// Seed data factories
// ---------------------------------------------------------------------------

export const TEST_ORG_ID = 'org_test_001';
export const TEST_USER_ID = 'user_test_001';
export const TEST_CLIENT_ID = 'client_test_001';

export function makeOrganization(overrides: RowData = {}) {
  return {
    id: TEST_ORG_ID,
    name: 'Test Experiential Co',
    slug: 'test-experiential',
    logo_url: null,
    favicon_url: null,
    brand_config: {
      primaryColor: '#0f172a',
      secondaryColor: '#3b82f6',
      accentColor: '#6366f1',
      backgroundColor: '#ffffff',
      fontHeading: 'Inter',
      fontBody: 'Inter',
    },
    facilities: [
      { id: 'fac_001', name: 'HQ', city: 'LA', state: 'CA', country: 'US', type: 'headquarters', isHQ: true },
    ],
    default_payment_terms: { structure: '50/50', depositPercent: 50, balancePercent: 50 },
    default_phase_template_id: null,
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    invoice_prefix: 'INV',
    proposal_prefix: 'FD',
    subscription_tier: 'professional',
    stripe_customer_id: null,
    stripe_connect_account_id: null,
    stripe_connect_onboarding_complete: false,
    billing_email: 'billing@test.com',
    payment_instructions: null,
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    first_day_of_week: 0,
    number_format: 'en-US',
    language: 'en',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as Record<string, any>; // Test factory — flexible typing for assertion convenience
}

export function makeProposal(overrides: RowData = {}) {
  return {
    id: 'prop_test_001',
    organization_id: TEST_ORG_ID,
    client_id: TEST_CLIENT_ID,
    name: 'Brand Activation 2026',
    subtitle: null,
    version: 1,
    status: 'draft',
    current_phase_id: null,
    probability_percent: null,
    currency: 'USD',
    total_value: 150000,
    total_with_addons: 175000,
    prepared_date: '2026-03-01',
    valid_until: '2026-04-01',
    source: null,
    narrative_context: { brandVoice: 'Bold', audienceProfile: 'Young adults', experienceGoal: 'Immersion' },
    payment_terms: { structure: 'deposit_balance', depositPercent: 50, balancePercent: 50 },
    terms_document_id: null,
    assumptions: [],
    tags: [],
    portal_access_token: null,
    portal_first_viewed_at: null,
    created_by: TEST_USER_ID,
    parent_proposal_id: null,
    phase_template_id: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makePhase(overrides: RowData = {}) {
  const { number, ...rest } = overrides;
  return {
    id: 'phase_test_001',
    proposal_id: 'prop_test_001',
    phase_number: number !== undefined ? String(number) : '1',
    name: 'Discovery & Strategy',
    subtitle: null,
    status: 'not_started',
    terms_sections: [],
    narrative: null,
    phase_investment: 15000,
    sort_order: 0,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...rest,
  };
}

export function makeDeliverable(overrides: RowData = {}) {
  return {
    id: 'del_test_001',
    phase_id: 'phase_test_001',
    name: 'Brand Strategy Document',
    description: 'Comprehensive brand strategy',
    details: [],
    category: 'strategy',
    unit: 'document',
    qty: 1,
    unit_cost: 15000,
    total_cost: 15000,
    is_taxable: false,
    sort_order: 0,
    pm_metadata: null,
    asset_metadata: null,
    resource_metadata: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeMilestoneGate(overrides: RowData = {}) {
  return {
    id: 'ms_test_001',
    phase_id: 'phase_test_001',
    name: 'Strategy Approval',
    unlocks_description: null,
    status: 'pending',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeInvoice(overrides: RowData = {}) {
  return {
    id: 'inv_test_001',
    organization_id: TEST_ORG_ID,
    client_id: TEST_CLIENT_ID,
    proposal_id: 'prop_test_001',
    invoice_number: 'INV-2026-001',
    type: 'deposit',
    status: 'draft',
    issue_date: '2026-03-15',
    due_date: '2026-04-15',
    subtotal: 75000,
    tax_amount: 0,
    total: 75000,
    amount_paid: 0,
    currency: 'USD',
    memo: null,
    paid_date: null,
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-03-15T00:00:00Z',
    ...overrides,
  };
}

export function makeDeal(overrides: RowData = {}) {
  const { value, ...rest } = overrides;
  return {
    id: 'deal_test_001',
    organization_id: TEST_ORG_ID,
    client_id: TEST_CLIENT_ID,
    title: 'Nike Summer Activation',
    pipeline_id: null,
    deal_value: value !== undefined ? value : 250000,
    probability: 50,
    expected_close_date: '2026-06-01',
    stage: 'lead',
    owner_id: TEST_USER_ID,
    proposal_id: null,
    notes: null,
    lost_reason: null,
    won_date: null,
    lost_date: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...rest,
  };
}

export function makeTask(overrides: RowData = {}) {
  return {
    id: 'task_test_001',
    organization_id: TEST_ORG_ID,
    title: 'Review design mockups',
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: TEST_USER_ID,
    proposal_id: 'prop_test_001',
    phase_id: null,
    due_date: '2026-04-01',
    start_date: null,
    estimated_hours: 4,
    actual_hours: null,
    created_by: TEST_USER_ID,
    sort_order: 0,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeAsset(overrides: RowData = {}) {
  const { trackable, reusable, purchase_cost, ...rest } = overrides;
  return {
    id: 'asset_test_001',
    organization_id: TEST_ORG_ID,
    proposal_id: 'prop_test_001',
    name: 'LED Video Wall Panel',
    type: 'equipment',
    category: 'AV',
    is_trackable: trackable !== undefined ? trackable : true,
    status: 'planned',
    condition: 'new',
    deployment_count: 0,
    current_location: { facilityId: 'fac_001', type: 'warehouse' },
    barcode: null,
    serial_number: null,
    photo_urls: [],
    is_reusable: reusable !== undefined ? reusable : true,
    acquisition_cost: purchase_cost !== undefined ? purchase_cost : 5000,
    depreciation_method: null,
    notes: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...rest,
  };
}

export function makeAutomation(overrides: RowData = {}) {
  return {
    id: 'auto_test_001',
    organization_id: TEST_ORG_ID,
    name: 'Invoice on Approval',
    trigger_type: 'proposal_status_change',
    trigger_config: { from_status: 'negotiating', to_status: 'approved' },
    action_type: 'create_invoice',
    action_config: { client_id: TEST_CLIENT_ID },
    is_active: true,
    run_count: 0,
    last_run_at: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeCrewProfile(overrides: RowData = {}) {
  return {
    id: 'crew_test_001',
    organization_id: TEST_ORG_ID,
    user_id: 'user_crew_001',
    full_name: 'Alex Installer',
    role: 'crew',
    phone: '555-0100',
    email: 'alex@test.com',
    hourly_rate: 45,
    day_rate: 350,
    skills: ['AV setup', 'rigging'],
    certifications: ['OSHA-30'],
    emergency_contact: null,
    notes: null,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeCrewBooking(overrides: RowData = {}) {
  return {
    id: 'booking_test_001',
    organization_id: TEST_ORG_ID,
    crew_profile_id: 'crew_test_001',
    proposal_id: 'prop_test_001',
    venue_id: null,
    role: 'crew',
    shift_start: '2026-04-10T08:00:00Z',
    shift_end: '2026-04-10T18:00:00Z',
    call_time: null,
    rate_type: 'hourly',
    rate_amount: 45,
    notes: null,
    status: 'confirmed',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeEquipmentReservation(overrides: RowData = {}) {
  return {
    id: 'res_test_001',
    organization_id: TEST_ORG_ID,
    equipment_bundle_id: 'bundle_001',
    proposal_id: 'prop_test_001',
    reserved_by: TEST_USER_ID,
    pickup_date: '2026-04-08',
    return_date: '2026-04-12',
    status: 'reserved',
    checked_out_by: null,
    checked_out_at: null,
    returned_by: null,
    returned_at: null,
    condition_on_return: null,
    notes: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeLead(overrides: RowData = {}) {
  return {
    id: 'lead_test_001',
    organization_id: TEST_ORG_ID,
    source: 'website',
    company_name: 'New Prospect Inc',
    contact_first_name: 'Jamie',
    contact_last_name: 'Prospect',
    contact_email: 'jamie@prospect.com',
    contact_phone: '555-0200',
    event_type: 'brand activation',
    event_date: '2026-06-15',
    estimated_budget: 100000,
    message: 'Interested in summer activation',
    status: 'new',
    created_by: TEST_USER_ID,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeESignatureRequest(overrides: RowData = {}) {
  return {
    id: 'esign_test_001',
    organization_id: TEST_ORG_ID,
    proposal_id: 'prop_test_001',
    document_type: 'proposal',
    document_title: 'Brand Activation Agreement',
    signer_name: 'John Client',
    signer_email: 'john@client.com',
    token: 'esign-token-abc123',
    status: 'pending',
    signature_data: null,
    signed_at: null,
    signer_ip: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeTimeEntry(overrides: RowData = {}) {
  const { billable, ...rest } = overrides;
  return {
    id: 'time_test_001',
    organization_id: TEST_ORG_ID,
    user_id: TEST_USER_ID,
    proposal_id: 'prop_test_001',
    phase_id: null,
    description: 'Design review session',
    start_time: '2026-03-20T09:00:00Z',
    end_time: '2026-03-20T11:00:00Z',
    duration_minutes: 120,
    is_billable: billable !== undefined ? billable : true,
    hourly_rate: null,
    is_approved: false,
    created_at: '2026-03-20T09:00:00Z',
    updated_at: '2026-03-20T11:00:00Z',
    ...rest,
  };
}

export function makeWarehouseTransfer(overrides: RowData = {}) {
  return {
    id: 'transfer_test_001',
    organization_id: TEST_ORG_ID,
    from_facility_id: 'fac_001',
    to_facility_id: 'fac_002',
    status: 'pending',
    initiated_by: TEST_USER_ID,
    notes: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeChangeOrder(overrides: RowData = {}) {
  return {
    id: 'co_test_001',
    organization_id: TEST_ORG_ID,
    proposal_id: 'prop_test_001',
    number: 1,
    title: 'Add LED panels',
    status: 'draft',
    scope_additions: [{ description: '10x LED panels', cost: 20000 }],
    scope_removals: [],
    net_change: 20000,
    schedule_impact_days: 3,
    submitted_by: TEST_USER_ID,
    approved_by: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeWorkOrder(overrides: RowData = {}) {
  return {
    id: 'wo_test_001',
    organization_id: TEST_ORG_ID,
    wo_number: 'WO-2026-001',
    title: 'Festival Stage Build',
    description: 'Full stage construction for summer festival',
    status: 'draft',
    priority: 'high',
    is_public_board: false,
    bidding_deadline: null as string | null,
    budget_range: '$5,000 – $10,000',
    client_id: TEST_CLIENT_ID,
    proposal_id: null,
    location_name: 'Central Park West',
    location_address: '100 Central Park West, New York, NY',
    scheduled_start: '2026-05-01T08:00:00Z',
    scheduled_end: '2026-05-03T18:00:00Z',
    deleted_at: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

export function makeWorkOrderBid(overrides: RowData = {}) {
  return {
    id: 'bid_test_001',
    organization_id: TEST_ORG_ID,
    work_order_id: 'wo_test_001',
    crew_profile_id: 'crew_test_001',
    proposed_amount: 7500,
    proposed_start: '2026-05-01T08:00:00Z',
    proposed_end: '2026-05-03T18:00:00Z',
    notes: 'Available for the full duration. Have all required certifications.',
    status: 'pending',
    accepted_by: null,
    resolved_at: null,
    deleted_at: null,
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Permission context helpers
// ---------------------------------------------------------------------------
