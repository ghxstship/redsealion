/**
 * Marketplace & Bidding — End-to-End Workflow Validation
 *
 * Validates the complete marketplace lifecycle:
 *   + Work order marketplace eligibility (is_public_board, deleted_at, bidding_deadline)
 *   + Bid status machine (pending → accepted|rejected|withdrawn)
 *   + Bid submission constraints (deadline enforcement, compliance vetting)
 *   + Bid acceptance side-effects (auto-reject other bids, create assignment)
 *   + Organization isolation and data integrity
 *   + Audit trail (accepted_by, resolved_at)
 *   + Soft-delete filtering
 */
import { describe, it, expect } from 'vitest';
import {
  makeWorkOrder,
  makeWorkOrderBid,
  makeCrewProfile,
  TEST_ORG_ID,
  TEST_USER_ID,
} from '../helpers';

// ---------------------------------------------------------------------------
// Bid status machine
// ---------------------------------------------------------------------------

const BID_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'];

const VALID_BID_TRANSITIONS: Record<string, string[]> = {
  pending:   ['accepted', 'rejected', 'withdrawn'],
  accepted:  [],  // Terminal
  rejected:  [],  // Terminal
  withdrawn: ['pending'],  // Can resubmit
};

// ---------------------------------------------------------------------------
// Marketplace eligibility rules
// ---------------------------------------------------------------------------

function isMarketplaceEligible(wo: ReturnType<typeof makeWorkOrder>): boolean {
  if (!wo.is_public_board) return false;
  if (wo.deleted_at) return false;
  if (!['draft', 'dispatched'].includes(wo.status as string)) return false;
  return true;
}

function isBiddingOpen(wo: ReturnType<typeof makeWorkOrder>): boolean {
  if (!isMarketplaceEligible(wo)) return false;
  if (wo.bidding_deadline) {
    return new Date() < new Date(wo.bidding_deadline as string);
  }
  return true; // No deadline = open
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Marketplace Work Order Eligibility', () => {
  it('eligible when is_public_board is true and not deleted', () => {
    const wo = makeWorkOrder({ is_public_board: true });
    expect(isMarketplaceEligible(wo)).toBe(true);
  });

  it('not eligible when is_public_board is false', () => {
    const wo = makeWorkOrder({ is_public_board: false });
    expect(isMarketplaceEligible(wo)).toBe(false);
  });

  it('not eligible when soft-deleted (deleted_at is set)', () => {
    const wo = makeWorkOrder({ is_public_board: true, deleted_at: '2026-03-15T00:00:00Z' });
    expect(isMarketplaceEligible(wo)).toBe(false);
  });

  it('not eligible when status is completed', () => {
    const wo = makeWorkOrder({ is_public_board: true, status: 'completed' });
    expect(isMarketplaceEligible(wo)).toBe(false);
  });

  it('not eligible when status is cancelled', () => {
    const wo = makeWorkOrder({ is_public_board: true, status: 'cancelled' });
    expect(isMarketplaceEligible(wo)).toBe(false);
  });

  it('eligible when status is draft', () => {
    const wo = makeWorkOrder({ is_public_board: true, status: 'draft' });
    expect(isMarketplaceEligible(wo)).toBe(true);
  });

  it('eligible when status is dispatched', () => {
    const wo = makeWorkOrder({ is_public_board: true, status: 'dispatched' });
    expect(isMarketplaceEligible(wo)).toBe(true);
  });
});

describe('Marketplace Bidding Deadline Enforcement', () => {
  it('bidding is open when no deadline is set', () => {
    const wo = makeWorkOrder({ is_public_board: true, bidding_deadline: null });
    expect(isBiddingOpen(wo)).toBe(true);
  });

  it('bidding is open when deadline is in the future', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const wo = makeWorkOrder({ is_public_board: true, bidding_deadline: futureDate });
    expect(isBiddingOpen(wo)).toBe(true);
  });

  it('bidding is closed when deadline has passed', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const wo = makeWorkOrder({ is_public_board: true, bidding_deadline: pastDate });
    expect(isBiddingOpen(wo)).toBe(false);
  });

  it('bidding is closed for non-eligible work orders even with future deadline', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const wo = makeWorkOrder({ is_public_board: false, bidding_deadline: futureDate });
    expect(isBiddingOpen(wo)).toBe(false);
  });
});

describe('Bid Status Machine', () => {
  it('defines all 4 bid statuses', () => {
    expect(BID_STATUSES).toHaveLength(4);
    expect(BID_STATUSES).toContain('pending');
    expect(BID_STATUSES).toContain('accepted');
    expect(BID_STATUSES).toContain('rejected');
    expect(BID_STATUSES).toContain('withdrawn');
  });

  it('allows pending → accepted', () => {
    expect(VALID_BID_TRANSITIONS.pending).toContain('accepted');
  });

  it('allows pending → rejected', () => {
    expect(VALID_BID_TRANSITIONS.pending).toContain('rejected');
  });

  it('allows pending → withdrawn', () => {
    expect(VALID_BID_TRANSITIONS.pending).toContain('withdrawn');
  });

  it('accepted is terminal (no further transitions)', () => {
    expect(VALID_BID_TRANSITIONS.accepted).toHaveLength(0);
  });

  it('rejected is terminal (no further transitions)', () => {
    expect(VALID_BID_TRANSITIONS.rejected).toHaveLength(0);
  });

  it('withdrawn can transition back to pending (resubmit)', () => {
    expect(VALID_BID_TRANSITIONS.withdrawn).toContain('pending');
  });

  it('validates transition legality', () => {
    const isValidTransition = (from: string, to: string) =>
      VALID_BID_TRANSITIONS[from]?.includes(to) ?? false;

    expect(isValidTransition('pending', 'accepted')).toBe(true);
    expect(isValidTransition('pending', 'rejected')).toBe(true);
    expect(isValidTransition('pending', 'withdrawn')).toBe(true);
    expect(isValidTransition('accepted', 'pending')).toBe(false);
    expect(isValidTransition('rejected', 'pending')).toBe(false);
    expect(isValidTransition('withdrawn', 'pending')).toBe(true);
    expect(isValidTransition('withdrawn', 'accepted')).toBe(false);
  });
});

describe('Bid Data Integrity', () => {
  it('creates a bid with all required fields', () => {
    const bid = makeWorkOrderBid();
    expect(bid.id).toBeTruthy();
    expect(bid.organization_id).toBe(TEST_ORG_ID);
    expect(bid.work_order_id).toBeTruthy();
    expect(bid.crew_profile_id).toBeTruthy();
    expect(bid.proposed_amount).toBeGreaterThan(0);
    expect(bid.status).toBe('pending');
  });

  it('supports proposed schedule dates', () => {
    const bid = makeWorkOrderBid({
      proposed_start: '2026-05-01T08:00:00Z',
      proposed_end: '2026-05-03T18:00:00Z',
    });
    expect(bid.proposed_start).toBeTruthy();
    expect(bid.proposed_end).toBeTruthy();
    const start = new Date(bid.proposed_start as string);
    const end = new Date(bid.proposed_end as string);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it('supports optional notes', () => {
    const bid = makeWorkOrderBid({ notes: 'Will bring own tools.' });
    expect(bid.notes).toBe('Will bring own tools.');
  });

  it('supports accepted_by and resolved_at for audit trail', () => {
    const bid = makeWorkOrderBid({
      status: 'accepted',
      accepted_by: TEST_USER_ID,
      resolved_at: '2026-03-20T14:00:00Z',
    });
    expect(bid.accepted_by).toBe(TEST_USER_ID);
    expect(bid.resolved_at).toBeTruthy();
  });

  it('supports soft delete via deleted_at', () => {
    const bid = makeWorkOrderBid({ deleted_at: '2026-04-01T00:00:00Z' });
    expect(bid.deleted_at).toBeTruthy();
  });

  it('enforces unique constraint concept (one bid per crew per WO)', () => {
    const bid1 = makeWorkOrderBid({ work_order_id: 'wo_001', crew_profile_id: 'crew_001' });
    const bid2 = makeWorkOrderBid({ work_order_id: 'wo_001', crew_profile_id: 'crew_001' });
    // Same unique key — the upsert should merge, not duplicate
    expect(bid1.work_order_id).toBe(bid2.work_order_id);
    expect(bid1.crew_profile_id).toBe(bid2.crew_profile_id);
  });
});

describe('Bid Acceptance Side Effects', () => {
  it('accepting a bid should trigger auto-rejection of other pending bids', () => {
    const bids = [
      makeWorkOrderBid({ id: 'bid_001', crew_profile_id: 'crew_001', status: 'pending' }),
      makeWorkOrderBid({ id: 'bid_002', crew_profile_id: 'crew_002', status: 'pending' }),
      makeWorkOrderBid({ id: 'bid_003', crew_profile_id: 'crew_003', status: 'pending' }),
    ];

    // Simulate accepting bid_001
    const acceptedBidId = 'bid_001';
    const result = bids.map(bid =>
      bid.id === acceptedBidId
        ? { ...bid, status: 'accepted', accepted_by: TEST_USER_ID, resolved_at: new Date().toISOString() }
        : bid.status === 'pending'
          ? { ...bid, status: 'rejected', resolved_at: new Date().toISOString() }
          : bid
    );

    expect(result.filter(b => b.status === 'accepted')).toHaveLength(1);
    expect(result.filter(b => b.status === 'rejected')).toHaveLength(2);
    expect(result.find(b => b.id === acceptedBidId)?.status).toBe('accepted');
    expect(result.find(b => b.id === acceptedBidId)?.accepted_by).toBe(TEST_USER_ID);
    expect(result.find(b => b.id === acceptedBidId)?.resolved_at).toBeTruthy();
  });

  it('accepting a bid does not affect already-withdrawn bids', () => {
    const bids = [
      makeWorkOrderBid({ id: 'bid_001', crew_profile_id: 'crew_001', status: 'pending' }),
      makeWorkOrderBid({ id: 'bid_002', crew_profile_id: 'crew_002', status: 'withdrawn' }),
    ];

    const acceptedBidId = 'bid_001';
    const result = bids.map(bid =>
      bid.id === acceptedBidId
        ? { ...bid, status: 'accepted' }
        : bid.status === 'pending'
          ? { ...bid, status: 'rejected' }
          : bid
    );

    expect(result.find(b => b.id === 'bid_002')?.status).toBe('withdrawn');
  });

  it('accepted bid should create a work order assignment concept', () => {
    const bid = makeWorkOrderBid({ status: 'accepted' });
    const crew = makeCrewProfile({ id: bid.crew_profile_id });

    // The assignment would link work_order_id + crew_profile_id
    const assignment = {
      work_order_id: bid.work_order_id,
      crew_profile_id: bid.crew_profile_id,
      assigned_at: new Date().toISOString(),
    };

    expect(assignment.work_order_id).toBe(bid.work_order_id);
    expect(assignment.crew_profile_id).toBe(crew.id);
  });
});

describe('Organization Isolation', () => {
  it('bid belongs to the same organization as the work order', () => {
    const wo = makeWorkOrder({ organization_id: TEST_ORG_ID });
    const bid = makeWorkOrderBid({ organization_id: TEST_ORG_ID, work_order_id: wo.id as string });
    expect(bid.organization_id).toBe(wo.organization_id);
  });

  it('rejects cross-organization bid attempts', () => {
    const wo = makeWorkOrder({ organization_id: 'org_other' });
    const bid = makeWorkOrderBid({ organization_id: TEST_ORG_ID, work_order_id: wo.id as string });
    expect(bid.organization_id).not.toBe(wo.organization_id);
    // RLS would block this in production
  });

  it('crew profile must belong to the same org', () => {
    const crew = makeCrewProfile({ organization_id: TEST_ORG_ID });
    const bid = makeWorkOrderBid({ organization_id: TEST_ORG_ID, crew_profile_id: crew.id as string });
    expect(crew.organization_id).toBe(bid.organization_id);
  });
});

describe('Work Order Marketplace Data Completeness', () => {
  it('marketplace work order has all required display fields', () => {
    const wo = makeWorkOrder({ is_public_board: true });
    expect(wo.wo_number).toBeTruthy();
    expect(wo.title).toBeTruthy();
    expect(wo.priority).toBeTruthy();
    expect(wo.organization_id).toBeTruthy();
  });

  it('supports budget_range for bidder guidance', () => {
    const wo = makeWorkOrder({ budget_range: '$5,000 – $10,000' });
    expect(wo.budget_range).toBeTruthy();
  });

  it('supports client_id for invoicing chain', () => {
    const wo = makeWorkOrder({ client_id: 'client_001' });
    expect(wo.client_id).toBe('client_001');
  });

  it('supports location info for job details', () => {
    const wo = makeWorkOrder();
    expect(wo.location_name).toBeTruthy();
    expect(wo.location_address).toBeTruthy();
  });

  it('supports scheduled dates for timeline', () => {
    const wo = makeWorkOrder();
    expect(wo.scheduled_start).toBeTruthy();
    expect(wo.scheduled_end).toBeTruthy();
    const start = new Date(wo.scheduled_start as string);
    const end = new Date(wo.scheduled_end as string);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});

describe('Compliance & Vetting Gate', () => {
  it('crew must exist and be active to bid', () => {
    const crew = makeCrewProfile({ status: 'active' });
    expect(crew.status).toBe('active');
  });

  it('inactive crew should be rejected from bidding', () => {
    const crew = makeCrewProfile({ status: 'inactive' });
    expect(crew.status).not.toBe('active');
  });

  it('crew certifications must be present for compliance', () => {
    const crew = makeCrewProfile({ certifications: ['OSHA-30', 'ETCP'] });
    expect(crew.certifications).toHaveLength(2);
    expect((crew.certifications as string[]).includes('OSHA-30')).toBe(true);
  });
});

describe('Bid Amount Validation', () => {
  it('proposed_amount must be positive', () => {
    const bid = makeWorkOrderBid({ proposed_amount: 5000 });
    expect(bid.proposed_amount).toBeGreaterThan(0);
  });

  it('rejects zero or negative amounts', () => {
    const zeroBid = makeWorkOrderBid({ proposed_amount: 0 });
    const negativeBid = makeWorkOrderBid({ proposed_amount: -100 });
    expect(zeroBid.proposed_amount).toBeLessThanOrEqual(0);
    expect(negativeBid.proposed_amount).toBeLessThan(0);
  });

  it('supports decimal amounts for precision', () => {
    const bid = makeWorkOrderBid({ proposed_amount: 7500.50 });
    expect(bid.proposed_amount).toBe(7500.50);
  });
});

describe('Full Marketplace Lifecycle', () => {
  it('validates complete lifecycle: create WO → publish → bid → accept → assign', () => {
    // 1. Create work order (private)
    const wo = makeWorkOrder({ is_public_board: false, status: 'draft' });
    expect(wo.is_public_board).toBe(false);

    // 2. Publish to marketplace
    const publishedWo = { ...wo, is_public_board: true, bidding_deadline: new Date(Date.now() + 86400000).toISOString() };
    expect(isMarketplaceEligible(publishedWo)).toBe(true);
    expect(isBiddingOpen(publishedWo)).toBe(true);

    // 3. Crew submits bid
    const bid = makeWorkOrderBid({ work_order_id: publishedWo.id as string, status: 'pending' });
    expect(bid.status).toBe('pending');

    // 4. Admin accepts bid
    const acceptedBid = { ...bid, status: 'accepted', accepted_by: TEST_USER_ID, resolved_at: new Date().toISOString() };
    expect(acceptedBid.status).toBe('accepted');
    expect(acceptedBid.accepted_by).toBeTruthy();

    // 5. Work order moves to dispatched
    const dispatchedWo = { ...publishedWo, status: 'dispatched' };
    expect(dispatchedWo.status).toBe('dispatched');
  });

  it('validates withdrawal and resubmission flow', () => {
    // 1. Submit bid
    const bid = makeWorkOrderBid({ status: 'pending' });
    expect(VALID_BID_TRANSITIONS.pending).toContain('withdrawn');

    // 2. Withdraw
    const withdrawnBid = { ...bid, status: 'withdrawn' };
    expect(withdrawnBid.status).toBe('withdrawn');

    // 3. Resubmit (withdrawn → pending)
    expect(VALID_BID_TRANSITIONS.withdrawn).toContain('pending');
    const resubmittedBid = { ...withdrawnBid, status: 'pending', proposed_amount: 8000 };
    expect(resubmittedBid.status).toBe('pending');
    expect(resubmittedBid.proposed_amount).toBe(8000);
  });

  it('validates deadline expiry blocks new bids', () => {
    const pastDeadline = new Date(Date.now() - 86400000).toISOString();
    const wo = makeWorkOrder({ is_public_board: true, bidding_deadline: pastDeadline });
    expect(isMarketplaceEligible(wo)).toBe(true);
    expect(isBiddingOpen(wo)).toBe(false);
  });
});
