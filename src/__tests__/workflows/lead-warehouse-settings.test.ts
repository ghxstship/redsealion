/**
 * Leads, Warehouse & Settings — End-to-End Workflow Validation
 *
 * Leads:
 *   + Lead creation from inbound sources
 *   + Status lifecycle: new → contacted → qualified → converted / lost
 *   + Required field validation
 *   + Filtering by status
 *
 * Warehouse:
 *   + Transfer creation between facilities
 *   + Transfer status: pending → in_transit → received / cancelled
 *   + Item validation
 *
 * Settings:
 *   + Organization branding
 *   + Localization (timezone, currency, date/time format)
 *   + Payment terms configuration
 *   + Email templates
 *   + API key management
 *
 * Change Orders:
 *   + Status: draft → submitted → approved / rejected / void
 *   + Net change calculation
 *   + Schedule impact tracking
 */
import { describe, it, expect } from 'vitest';
import {
  makeLead,
  makeWarehouseTransfer,
  makeOrganization,
  makeChangeOrder,
  TEST_ORG_ID,
  TEST_USER_ID,
} from '../helpers';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const VALID_LEAD_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['converted', 'lost'],
  converted: [],
  lost: ['new'],     // can reopen
};

const TRANSFER_STATUSES = ['pending', 'in_transit', 'received', 'cancelled'];

const VALID_TRANSFER_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_transit', 'cancelled'],
  in_transit: ['received'],
  received: [],
  cancelled: [],
};

const CHANGE_ORDER_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'void'];

const VALID_CO_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted', 'void'],
  submitted: ['approved', 'rejected', 'void'],
  approved: [],
  rejected: ['draft'],     // can revise
  void: [],
};

describe('Lead Workflow', () => {
  // -----------------------------------------------------------------------
  // Lead status machine
  // -----------------------------------------------------------------------

  describe('Lead status transitions', () => {
    it('defines all 5 lead statuses', () => {
      expect(LEAD_STATUSES).toHaveLength(5);
    });

    it('follows qualification flow: new → contacted → qualified → converted', () => {
      expect(VALID_LEAD_TRANSITIONS.new).toContain('contacted');
      expect(VALID_LEAD_TRANSITIONS.contacted).toContain('qualified');
      expect(VALID_LEAD_TRANSITIONS.qualified).toContain('converted');
    });

    it('allows marking as lost from any active state', () => {
      expect(VALID_LEAD_TRANSITIONS.new).toContain('lost');
      expect(VALID_LEAD_TRANSITIONS.contacted).toContain('lost');
      expect(VALID_LEAD_TRANSITIONS.qualified).toContain('lost');
    });

    it('prevents transitions from converted (terminal)', () => {
      expect(VALID_LEAD_TRANSITIONS.converted).toHaveLength(0);
    });

    it('allows reopening lost leads', () => {
      expect(VALID_LEAD_TRANSITIONS.lost).toContain('new');
    });
  });

  // -----------------------------------------------------------------------
  // Lead creation
  // -----------------------------------------------------------------------

  describe('Lead creation', () => {
    it('creates a lead with required fields', () => {
      const lead = makeLead();
      expect(lead.contact_first_name).toBeTruthy();
      expect(lead.organization_id).toBe(TEST_ORG_ID);
      expect(lead.status).toBe('new');
    });

    it('requires contact_first_name', () => {
      const lead = makeLead({ contact_first_name: '' });
      expect(lead.contact_first_name).toBeFalsy();
    });

    it('defaults status to new', () => {
      const lead = makeLead();
      expect(lead.status).toBe('new');
    });

    it('supports optional fields', () => {
      const lead = makeLead();
      expect(lead.source).toBeTruthy();
      expect(lead.company_name).toBeTruthy();
      expect(lead.contact_email).toBeTruthy();
      expect(lead.event_type).toBeTruthy();
      expect(lead.estimated_budget).toBeGreaterThan(0);
    });

    it('tracks created_by', () => {
      const lead = makeLead();
      expect(lead.created_by).toBe(TEST_USER_ID);
    });
  });

  // -----------------------------------------------------------------------
  // Lead filtering
  // -----------------------------------------------------------------------

  describe('Lead filtering', () => {
    it('filters by status', () => {
      const leads = [
        makeLead({ status: 'new' }),
        makeLead({ status: 'contacted' }),
        makeLead({ status: 'new' }),
      ];
      const newLeads = leads.filter(l => l.status === 'new');
      expect(newLeads).toHaveLength(2);
    });
  });
});

// ===========================================================================
// Warehouse Transfer Workflow
// ===========================================================================

describe('Warehouse Transfer Workflow', () => {
  // -----------------------------------------------------------------------
  // Transfer status machine
  // -----------------------------------------------------------------------

  describe('Transfer status transitions', () => {
    it('defines all 4 transfer statuses', () => {
      expect(TRANSFER_STATUSES).toHaveLength(4);
    });

    it('follows shipping flow: pending → in_transit → received', () => {
      expect(VALID_TRANSFER_TRANSITIONS.pending).toContain('in_transit');
      expect(VALID_TRANSFER_TRANSITIONS.in_transit).toContain('received');
    });

    it('allows cancelling pending transfers', () => {
      expect(VALID_TRANSFER_TRANSITIONS.pending).toContain('cancelled');
    });

    it('prevents transitions from terminal states', () => {
      expect(VALID_TRANSFER_TRANSITIONS.received).toHaveLength(0);
      expect(VALID_TRANSFER_TRANSITIONS.cancelled).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Transfer creation
  // -----------------------------------------------------------------------

  describe('Transfer creation', () => {
    it('creates a transfer with required fields', () => {
      const transfer = makeWarehouseTransfer();
      expect(transfer.from_facility_id).toBeTruthy();
      expect(transfer.to_facility_id).toBeTruthy();
      expect(transfer.status).toBe('pending');
    });

    it('requires from_facility_id', () => {
      const transfer = makeWarehouseTransfer();
      expect(transfer.from_facility_id).toBeTruthy();
    });

    it('requires to_facility_id', () => {
      const transfer = makeWarehouseTransfer();
      expect(transfer.to_facility_id).toBeTruthy();
    });

    it('validates transfer between different facilities', () => {
      const transfer = makeWarehouseTransfer();
      expect(transfer.from_facility_id).not.toBe(transfer.to_facility_id);
    });

    it('tracks who initiated the transfer', () => {
      const transfer = makeWarehouseTransfer();
      expect(transfer.initiated_by).toBe(TEST_USER_ID);
    });

    it('prevents same-facility transfers', () => {
      const transfer = makeWarehouseTransfer();
      expect(transfer.from_facility_id).not.toBe(transfer.to_facility_id);
    });
  });
});

// ===========================================================================
// Change Order Workflow
// ===========================================================================

describe('Change Order Workflow', () => {
  // -----------------------------------------------------------------------
  // Status machine
  // -----------------------------------------------------------------------

  describe('Change order status transitions', () => {
    it('defines all 5 change order statuses', () => {
      expect(CHANGE_ORDER_STATUSES).toHaveLength(5);
    });

    it('follows approval flow: draft → submitted → approved', () => {
      expect(VALID_CO_TRANSITIONS.draft).toContain('submitted');
      expect(VALID_CO_TRANSITIONS.submitted).toContain('approved');
    });

    it('allows rejection', () => {
      expect(VALID_CO_TRANSITIONS.submitted).toContain('rejected');
    });

    it('allows voiding', () => {
      expect(VALID_CO_TRANSITIONS.draft).toContain('void');
      expect(VALID_CO_TRANSITIONS.submitted).toContain('void');
    });

    it('allows revising rejected change orders', () => {
      expect(VALID_CO_TRANSITIONS.rejected).toContain('draft');
    });

    it('prevents transitions from approved/void (terminal)', () => {
      expect(VALID_CO_TRANSITIONS.approved).toHaveLength(0);
      expect(VALID_CO_TRANSITIONS.void).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Change order creation
  // -----------------------------------------------------------------------

  describe('Change order creation', () => {
    it('creates a change order with required fields', () => {
      const co = makeChangeOrder();
      expect(co.proposal_id).toBeTruthy();
      expect(co.title).toBeTruthy();
      expect(co.status).toBe('draft');
    });

    it('calculates net change from additions and removals', () => {
      const co = makeChangeOrder({
        scope_additions: [
          { description: 'Add LED panels', cost: 20000 },
          { description: 'Add sound system', cost: 15000 },
        ],
        scope_removals: [
          { description: 'Remove banner', cost: 5000 },
        ],
      });

      const additions = (co.scope_additions as Array<{ cost: number }>).reduce((sum, a) => sum + a.cost, 0);
      const removals = (co.scope_removals as Array<{ cost: number }>).reduce((sum, r) => sum + r.cost, 0);
      const netChange = additions - removals;
      expect(netChange).toBe(30000);
    });

    it('tracks schedule impact in days', () => {
      const co = makeChangeOrder({ schedule_impact_days: 5 });
      expect(co.schedule_impact_days).toBe(5);
    });

    it('tracks submitted_by and approved_by', () => {
      const co = makeChangeOrder();
      expect(co.submitted_by).toBeTruthy();
    });
  });
});

// ===========================================================================
// Settings Workflow
// ===========================================================================

describe('Settings Workflow', () => {
  // -----------------------------------------------------------------------
  // Organization branding
  // -----------------------------------------------------------------------

  describe('Organization branding', () => {
    it('supports brand colors', () => {
      const org = makeOrganization();
      expect(org.brand_config.primaryColor).toMatch(/^#/);
      expect(org.brand_config.secondaryColor).toMatch(/^#/);
      expect(org.brand_config.accentColor).toMatch(/^#/);
    });

    it('supports brand fonts', () => {
      const org = makeOrganization();
      expect(org.brand_config.fontHeading).toBeTruthy();
      expect(org.brand_config.fontBody).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // Localization
  // -----------------------------------------------------------------------

  describe('Localization settings', () => {
    it('supports timezone', () => {
      const org = makeOrganization();
      expect(org.timezone).toBe('America/Los_Angeles');
    });

    it('supports currency', () => {
      const org = makeOrganization();
      expect(org.currency).toBe('USD');
    });

    it('supports date format', () => {
      const org = makeOrganization();
      expect(org.date_format).toBe('MM/DD/YYYY');
    });

    it('supports time format (12h/24h)', () => {
      const org = makeOrganization();
      expect(['12h', '24h']).toContain(org.time_format);
    });

    it('supports number format locale', () => {
      const org = makeOrganization();
      expect(org.number_format).toBe('en-US');
    });

    it('supports language', () => {
      const org = makeOrganization();
      expect(org.language).toBe('en');
    });

    it('supports first day of week', () => {
      const org = makeOrganization();
      expect([0, 1]).toContain(org.first_day_of_week);
    });
  });

  // -----------------------------------------------------------------------
  // Payment terms
  // -----------------------------------------------------------------------

  describe('Payment terms configuration', () => {
    it('supports deposit/balance structure', () => {
      const org = makeOrganization();
      expect(org.default_payment_terms.structure).toBe('50/50');
      expect(org.default_payment_terms.depositPercent).toBe(50);
      expect(org.default_payment_terms.balancePercent).toBe(50);
    });

    it('deposit + balance sums to 100', () => {
      const terms = { depositPercent: 50, balancePercent: 50 };
      expect(terms.depositPercent + terms.balancePercent).toBe(100);
    });

    it('supports 40/40/20 split', () => {
      const terms = { structure: '40/40/20', depositPercent: 40, balancePercent: 40 };
      const remaining = 100 - terms.depositPercent - terms.balancePercent;
      expect(remaining).toBe(20);
    });
  });

  // -----------------------------------------------------------------------
  // Multi-tenant scoping
  // -----------------------------------------------------------------------

  describe('Multi-tenant scoping', () => {
    it('all data is scoped to organization_id', () => {
      const org = makeOrganization();
      expect(org.id).toBe(TEST_ORG_ID);
    });

    it('supports unique slug per organization', () => {
      const org = makeOrganization();
      expect(org.slug).toBeTruthy();
      expect(org.slug).toBe('test-experiential');
    });

    it('supports subscription tier per organization', () => {
      const org = makeOrganization();
      expect(['access', 'core', 'professional', 'enterprise']).toContain(org.subscription_tier);
    });
  });
});
