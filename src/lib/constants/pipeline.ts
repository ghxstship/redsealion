import type { DealStage } from '@/types/database';

/**
 * Canonical deal stage labels.
 * Single source of truth for pipeline stage display names.
 *
 * Used by: pipeline/[id], pipeline/(hub)/settings, pipeline/(hub)/board
 */
export const STAGE_LABELS: Record<DealStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  verbal_yes: 'Verbal Yes',
  contract_signed: 'Contract Signed',
  lost: 'Lost',
  on_hold: 'On Hold',
};

/**
 * Ordered list of active stages (excludes terminal states like lost/on_hold).
 * Used by pipeline board layout and forecast calculations.
 */
export const ACTIVE_STAGES: DealStage[] = [
  'lead',
  'qualified',
  'proposal_sent',
  'negotiation',
  'verbal_yes',
  'contract_signed',
];
