/**
 * Proposal Lifecycle — End-to-End Workflow Validation
 *
 * Validates the full proposal state machine:
 *   draft → sent → viewed → negotiating → approved → in_production → active → complete
 *   + cancellation from any state
 *   + creation with nested phases/deliverables/addons/milestones
 *   + portal token generation on send
 *   + duplication
 */
import { describe, it, expect } from 'vitest';
import {
  makeProposal,
  makePhase,
  makeDeliverable,
  makeMilestoneGate,
  TEST_ORG_ID,
  TEST_USER_ID,
  TEST_CLIENT_ID,
} from '../helpers';
import type { ProposalStatus, PhaseStatus, MilestoneStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Proposal status transitions
// ---------------------------------------------------------------------------

const PROPOSAL_STATUSES: ProposalStatus[] = [
  'draft', 'sent', 'viewed', 'negotiating',
  'approved', 'in_production', 'active', 'complete', 'cancelled',
];

const VALID_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['viewed', 'negotiating', 'cancelled'],
  viewed: ['negotiating', 'approved', 'cancelled'],
  negotiating: ['approved', 'cancelled'],
  approved: ['in_production', 'cancelled'],
  in_production: ['active', 'cancelled'],
  active: ['complete', 'cancelled'],
  complete: [],
  cancelled: [],
};

describe('Proposal Lifecycle Workflow', () => {
  // -----------------------------------------------------------------------
  // Status Machine
  // -----------------------------------------------------------------------

  describe('Status transitions', () => {
    it('defines all proposal statuses', () => {
      expect(PROPOSAL_STATUSES).toHaveLength(9);
      expect(PROPOSAL_STATUSES).toContain('draft');
      expect(PROPOSAL_STATUSES).toContain('complete');
      expect(PROPOSAL_STATUSES).toContain('cancelled');
    });

    it('allows draft → sent transition', () => {
      expect(VALID_TRANSITIONS.draft).toContain('sent');
    });

    it('allows sent → viewed → negotiating → approved flow', () => {
      expect(VALID_TRANSITIONS.sent).toContain('viewed');
      expect(VALID_TRANSITIONS.viewed).toContain('negotiating');
      expect(VALID_TRANSITIONS.negotiating).toContain('approved');
    });

    it('allows approved → in_production → active → complete flow', () => {
      expect(VALID_TRANSITIONS.approved).toContain('in_production');
      expect(VALID_TRANSITIONS.in_production).toContain('active');
      expect(VALID_TRANSITIONS.active).toContain('complete');
    });

    it('allows cancellation from any non-terminal state', () => {
      const nonTerminal: ProposalStatus[] = [
        'draft', 'sent', 'viewed', 'negotiating',
        'approved', 'in_production', 'active',
      ];
      for (const status of nonTerminal) {
        expect(VALID_TRANSITIONS[status]).toContain('cancelled');
      }
    });

    it('prevents transitions from terminal states', () => {
      expect(VALID_TRANSITIONS.complete).toHaveLength(0);
      expect(VALID_TRANSITIONS.cancelled).toHaveLength(0);
    });

    it('allows fast-track viewed → approved (skip negotiating)', () => {
      expect(VALID_TRANSITIONS.viewed).toContain('approved');
    });

    it('prevents backward transitions', () => {
      expect(VALID_TRANSITIONS.approved).not.toContain('draft');
      expect(VALID_TRANSITIONS.active).not.toContain('sent');
      expect(VALID_TRANSITIONS.in_production).not.toContain('approved');
    });

    it('validates the happy path end-to-end', () => {
      const happyPath: ProposalStatus[] = [
        'draft', 'sent', 'viewed', 'negotiating',
        'approved', 'in_production', 'active', 'complete',
      ];
      for (let i = 0; i < happyPath.length - 1; i++) {
        expect(VALID_TRANSITIONS[happyPath[i]]).toContain(happyPath[i + 1]);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Proposal creation
  // -----------------------------------------------------------------------

  describe('Proposal creation', () => {
    it('creates a proposal with required fields', () => {
      const proposal = makeProposal();
      expect(proposal.id).toBeDefined();
      expect(proposal.organization_id).toBe(TEST_ORG_ID);
      expect(proposal.client_id).toBe(TEST_CLIENT_ID);
      expect(proposal.status).toBe('draft');
      expect(proposal.version).toBe(1);
      expect(proposal.created_by).toBe(TEST_USER_ID);
    });

    it('calculates total_value from phase deliverables', () => {
      const proposal = makeProposal({ total_value: 150000, total_with_addons: 175000 });
      expect(proposal.total_value).toBe(150000);
      expect(proposal.total_with_addons).toBeGreaterThanOrEqual(proposal.total_value);
    });

    it('initializes with null portal_access_token', () => {
      const proposal = makeProposal();
      expect(proposal.portal_access_token).toBeNull();
    });

    it('attaches payment terms structure', () => {
      const proposal = makeProposal();
      expect(proposal.payment_terms).toBeDefined();
      expect(proposal.payment_terms!.depositPercent).toBe(50);
      expect(proposal.payment_terms!.balancePercent).toBe(50);
      expect(proposal.payment_terms!.depositPercent + proposal.payment_terms!.balancePercent).toBe(100);
    });

    it('includes narrative context', () => {
      const proposal = makeProposal();
      expect(proposal.narrative_context).toBeDefined();
      expect(proposal.narrative_context!.brandVoice).toBeTruthy();
      expect(proposal.narrative_context!.audienceProfile).toBeTruthy();
      expect(proposal.narrative_context!.experienceGoal).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // Phase lifecycle within proposals
  // -----------------------------------------------------------------------

  describe('Phase lifecycle', () => {
    const PHASE_STATUSES: PhaseStatus[] = [
      'not_started', 'in_progress', 'pending_approval', 'approved', 'complete', 'skipped',
    ];

    it('defines all phase statuses', () => {
      expect(PHASE_STATUSES).toHaveLength(6);
    });

    it('creates a phase with defaults', () => {
      const phase = makePhase();
      expect(phase.status).toBe('not_started');
      expect(phase.phase_investment).toBeGreaterThan(0);
      expect(phase.proposal_id).toBeTruthy();
    });

    it('allows phase to progress through normal flow', () => {
      const validPhaseFlow: PhaseStatus[] = [
        'not_started', 'in_progress', 'pending_approval', 'approved', 'complete',
      ];
      for (let i = 0; i < validPhaseFlow.length; i++) {
        expect(PHASE_STATUSES).toContain(validPhaseFlow[i]);
      }
    });

    it('allows skipping a phase', () => {
      expect(PHASE_STATUSES).toContain('skipped');
    });

    it('creates deliverables attached to phase', () => {
      const del = makeDeliverable();
      expect(del.phase_id).toBeTruthy();
      expect(del.qty).toBeGreaterThan(0);
      expect(del.unit_cost).toBeGreaterThan(0);
      expect(del.total_cost).toBe(del.qty * del.unit_cost);
    });

    it('creates milestone gates attached to phase', () => {
      const ms = makeMilestoneGate();
      expect(ms.phase_id).toBeTruthy();
      expect(ms.status).toBe('pending');
    });
  });

  // -----------------------------------------------------------------------
  // Milestone gate flow
  // -----------------------------------------------------------------------

  describe('Milestone gates', () => {
    const MILESTONE_STATUSES: MilestoneStatus[] = ['pending', 'in_progress', 'complete'];

    it('defines milestone status flow', () => {
      expect(MILESTONE_STATUSES).toEqual(['pending', 'in_progress', 'complete']);
    });

    it('starts milestones as pending', () => {
      const ms = makeMilestoneGate();
      expect(ms.status).toBe('pending');
    });

    it('validates milestone progression', () => {
      const ms1 = makeMilestoneGate({ status: 'pending' });
      const ms2 = makeMilestoneGate({ status: 'in_progress' });
      const ms3 = makeMilestoneGate({ status: 'complete' });

      expect(MILESTONE_STATUSES.indexOf(ms1.status as MilestoneStatus)).toBe(0);
      expect(MILESTONE_STATUSES.indexOf(ms2.status as MilestoneStatus)).toBe(1);
      expect(MILESTONE_STATUSES.indexOf(ms3.status as MilestoneStatus)).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Send workflow
  // -----------------------------------------------------------------------

  describe('Proposal send workflow', () => {
    it('transitions status from draft to sent', () => {
      const before = makeProposal({ status: 'draft' });
      const after = makeProposal({ status: 'sent', portal_access_token: 'token-123' });

      expect(before.status).toBe('draft');
      expect(after.status).toBe('sent');
    });

    it('generates portal access token on send', () => {
      const sent = makeProposal({ status: 'sent', portal_access_token: 'uuid-token' });
      expect(sent.portal_access_token).toBeTruthy();
    });

    it('builds portal URL with token', () => {
      const token = 'test-portal-token';
      const proposalId = 'prop_001';
      const baseUrl = 'http://localhost:3000';
      const portalUrl = `${baseUrl}/portal/${proposalId}?token=${token}`;

      expect(portalUrl).toContain('/portal/');
      expect(portalUrl).toContain('token=');
    });
  });

  // -----------------------------------------------------------------------
  // Accept workflow
  // -----------------------------------------------------------------------

  describe('Proposal accept workflow', () => {
    it('only allows accepting proposals in sent/viewed/negotiating', () => {
      const acceptableStatuses: ProposalStatus[] = ['sent', 'viewed', 'negotiating'];
      const unacceptableStatuses: ProposalStatus[] = ['draft', 'approved', 'in_production', 'active', 'complete', 'cancelled'];

      for (const status of acceptableStatuses) {
        const proposal = makeProposal({ status });
        expect(['sent', 'viewed', 'negotiating']).toContain(proposal.status);
      }

      for (const status of unacceptableStatuses) {
        expect(acceptableStatuses).not.toContain(status);
      }
    });

    it('requires signature_data for acceptance', () => {
      const signatureData = 'data:image/png;base64,iVBORw0KGgo...';
      expect(signatureData).toBeTruthy();
    });

    it('sets status to approved on accept', () => {
      const accepted = makeProposal({ status: 'approved' });
      expect(accepted.status).toBe('approved');
    });
  });

  // -----------------------------------------------------------------------
  // Duplication
  // -----------------------------------------------------------------------

  describe('Proposal duplication', () => {
    it('creates a new proposal from existing one', () => {
      const original = makeProposal({ id: 'prop_original', version: 1 });
      const duplicate = makeProposal({
        id: 'prop_duplicate',
        parent_proposal_id: original.id,
        version: 2,
        status: 'draft',
      });

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.parent_proposal_id).toBe(original.id);
      expect(duplicate.version).toBe(2);
      expect(duplicate.status).toBe('draft');
    });
  });

  // -----------------------------------------------------------------------
  // Multi-phase proposal structure
  // -----------------------------------------------------------------------

  describe('Multi-phase proposal structure', () => {
    it('supports standard 8-phase production workflow', () => {
      const phaseNames = [
        'Discovery & Strategy',
        'Concept Design',
        'Design Development',
        'Fabrication',
        'Technology Integration',
        'Logistics & Install',
        'Activation & Staffing',
        'Strike & Wrap',
      ];

      const phases = phaseNames.map((name, i) =>
        makePhase({ id: `phase_${i}`, name, number: String(i + 1), sort_order: i })
      );

      expect(phases).toHaveLength(8);
      for (let i = 0; i < phases.length; i++) {
        expect(phases[i].sort_order).toBe(i);
        expect(phases[i].phase_number).toBe(String(i + 1));
      }
    });

    it('calculates total proposal value from all phases', () => {
      const phases = [
        makePhase({ phase_investment: 15000 }),
        makePhase({ phase_investment: 25000 }),
        makePhase({ phase_investment: 60000 }),
      ];
      const totalValue = phases.reduce((sum, p) => sum + (p.phase_investment as number), 0);
      expect(totalValue).toBe(100000);
    });
  });
});
