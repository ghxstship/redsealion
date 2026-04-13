import { formatLabel } from '@/lib/utils';

/* ────────────────────────────────────────────
 * Entity-specific color registries
 * ──────────────────────────────────────────── */

export const EQUIPMENT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-bg-secondary text-text-secondary',
  in_production: 'bg-amber-500/10 text-amber-600',
  in_transit: 'bg-blue-500/10 text-blue-600',
  deployed: 'bg-green-500/10 text-green-600',
  in_storage: 'bg-purple-500/10 text-purple-600',
  retired: 'bg-red-500/10 text-red-600',
  disposed: 'bg-bg-secondary text-text-muted',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-bg-secondary text-text-secondary',
  todo: 'bg-bg-secondary text-text-secondary',
  in_progress: 'bg-blue-500/10 text-blue-600',
  in_review: 'bg-purple-500/10 text-purple-600',
  review: 'bg-purple-500/10 text-purple-600',
  done: 'bg-green-500/10 text-green-600',
  blocked: 'bg-red-500/10 text-red-600',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-600',
  high: 'bg-orange-500/10 text-orange-600',
  medium: 'bg-yellow-500/10 text-yellow-600',
  low: 'bg-bg-secondary text-text-muted',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600',
  contacted: 'bg-yellow-500/10 text-yellow-600',
  qualified: 'bg-green-500/10 text-green-600',
  proposal_sent: 'bg-purple-500/10 text-purple-600',
  won: 'bg-green-500/15 text-green-600',
  lost: 'bg-red-500/10 text-red-600',
  archived: 'bg-bg-secondary text-text-muted',
  disqualified: 'bg-red-500/10 text-red-600',
};

/** Denser variant for card contexts (stronger intensity) */
export const LEAD_STATUS_COLORS_DENSE: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-600',
  contacted: 'bg-yellow-500/15 text-yellow-600',
  qualified: 'bg-green-500/15 text-green-600',
  proposal_sent: 'bg-purple-500/15 text-purple-600',
  won: 'bg-green-500/20 text-green-600',
  lost: 'bg-red-500/15 text-red-600',
  archived: 'bg-bg-secondary text-foreground',
};

export const RESERVATION_STATUS_COLORS: Record<string, string> = {
  reserved: 'bg-blue-400',
  checked_out: 'bg-green-500',
  returned: 'bg-gray-400',
};

export const AVAILABILITY_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-400',
  unavailable: 'bg-red-400',
  tentative: 'bg-yellow-400',
};

export const PIPELINE_STAGE_COLORS: Record<string, string> = {
  // DB enum values (canonical)
  lead: 'bg-blue-500/10 text-blue-600',
  qualified: 'bg-indigo-500/10 text-indigo-600',
  proposal_sent: 'bg-purple-500/10 text-purple-600',
  negotiation: 'bg-amber-500/10 text-amber-600',
  verbal_yes: 'bg-emerald-500/10 text-emerald-600',
  contract_signed: 'bg-green-500/10 text-green-600',
  lost: 'bg-red-500/10 text-red-600',
  on_hold: 'bg-bg-secondary text-text-muted',
  // UI display aliases
  discovery: 'bg-blue-500/10 text-blue-600',
  qualification: 'bg-indigo-500/10 text-indigo-600',
  proposal: 'bg-purple-500/10 text-purple-600',
  closed_won: 'bg-green-500/10 text-green-600',
  closed_lost: 'bg-red-500/10 text-red-600',
};

export const PHOTO_TYPE_COLORS: Record<string, string> = {
  before: 'bg-bg-secondary text-text-muted',
  progress: 'bg-blue-500/10 text-blue-600',
  completion: 'bg-green-500/10 text-green-600',
  issue: 'bg-red-500/10 text-red-600',
  reference: 'bg-purple-500/10 text-purple-600',
};

export const LEAD_SOURCE_COLORS: Record<string, string> = {
  referral: 'bg-bg-tertiary text-foreground',
  website: 'bg-bg-tertiary text-foreground',
  cold_call: 'bg-bg-tertiary text-foreground',
  event: 'bg-bg-tertiary text-foreground',
};

export const EVENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  confirmed: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const ACTIVATION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  confirmed: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const LOCATION_TYPE_COLORS: Record<string, string> = {
  venue: 'bg-indigo-500/10 text-indigo-600',
  arena: 'bg-blue-500/10 text-blue-600',
  stadium: 'bg-blue-500/10 text-blue-600',
  convention_center: 'bg-purple-500/10 text-purple-600',
  hotel: 'bg-amber-500/10 text-amber-600',
  outdoor: 'bg-green-500/10 text-green-600',
  warehouse: 'bg-bg-secondary text-text-secondary',
  office: 'bg-bg-secondary text-text-secondary',
  studio: 'bg-pink-500/10 text-pink-600',
  restaurant: 'bg-orange-500/10 text-orange-600',
  virtual: 'bg-cyan-500/10 text-cyan-600',
  other: 'bg-bg-secondary text-text-muted',
};

export const LOCATION_TYPE_ICONS: Record<string, string> = {
  venue: '🏟️',
  arena: '🏟️',
  stadium: '🏟️',
  convention_center: '🏢',
  hotel: '🏨',
  outdoor: '🌳',
  warehouse: '🏭',
  office: '🏢',
  studio: '🎥',
  restaurant: '🍽️',
  virtual: '💻',
  other: '📍',
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  developer: 'bg-red-500/10 text-red-600',
  owner: 'bg-indigo-500/10 text-indigo-600',
  admin: 'bg-indigo-500/10 text-indigo-600',
  controller: 'bg-emerald-500/10 text-emerald-600',
  manager: 'bg-blue-500/10 text-blue-600',
  team_member: 'bg-purple-500/10 text-purple-600',
  client: 'bg-bg-secondary text-text-secondary',
  contractor: 'bg-amber-500/10 text-amber-600',
  crew: 'bg-orange-500/10 text-orange-600',
  viewer: 'bg-bg-secondary text-text-muted',
};

export const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  in_transit: 'bg-blue-500/10 text-blue-600',
  delivered: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-muted',
  scheduled: 'bg-blue-500/10 text-blue-600',
  sending: 'bg-amber-500/10 text-amber-600',
  sent: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const AUTOMATION_RUN_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-600',
  running: 'bg-blue-500/10 text-blue-600',
  failed: 'bg-red-500/10 text-red-600',
  pending: 'bg-yellow-500/10 text-yellow-600',
  cancelled: 'bg-bg-secondary text-text-secondary',
};

export const PROCUREMENT_REQUISITION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  submitted: 'bg-yellow-500/10 text-yellow-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
  ordered: 'bg-blue-500/10 text-blue-600',
};

export const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  sent: 'bg-blue-500/10 text-blue-600',
  acknowledged: 'bg-purple-500/10 text-purple-600',
  partially_received: 'bg-yellow-500/10 text-yellow-600',
  received: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const RECEIPT_STATUS_COLORS: Record<string, string> = {
  partial: 'bg-yellow-500/10 text-yellow-600',
  complete: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
};

export const TRANSFER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  in_transit: 'bg-blue-500/10 text-blue-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const COUNT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  in_progress: 'bg-blue-500/10 text-blue-600',
  submitted: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
};

export const CHECK_IN_OUT_STATUS_COLORS: Record<string, string> = {
  checked_out: 'bg-amber-500/10 text-amber-600',
  checked_in: 'bg-green-500/10 text-green-600',
  overdue: 'bg-red-500/10 text-red-600',
  reserved: 'bg-blue-500/10 text-blue-600',
};

export const DAILY_REPORT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  submitted: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
};

export const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-green-500/10 text-green-600',
  overdue: 'bg-red-500/10 text-red-600',
  cancelled: 'bg-bg-secondary text-text-muted',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  sent: 'bg-blue-500/10 text-blue-600',
  viewed: 'bg-indigo-500/10 text-indigo-600',
  paid: 'bg-green-500/10 text-green-600',
  partially_paid: 'bg-amber-500/10 text-amber-600',
  overdue: 'bg-red-500/10 text-red-600',
  void: 'bg-bg-secondary text-text-muted',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const PURCHASE_ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-muted',
  sent: 'bg-blue-500/10 text-blue-600',
  acknowledged: 'bg-purple-500/10 text-purple-600',
  approved: 'bg-green-500/10 text-green-600',
  fulfilled: 'bg-green-500/10 text-green-600',
  received: 'bg-teal-500/10 text-teal-600',
  closed: 'bg-bg-secondary text-text-secondary',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const SUPPLIER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600',
  inactive: 'bg-bg-secondary text-text-muted',
  pending: 'bg-yellow-500/10 text-yellow-600',
  blocked: 'bg-red-500/10 text-red-600',
};

export const RENTAL_ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  reserved: 'bg-blue-500/10 text-blue-600',
  checked_out: 'bg-purple-500/10 text-purple-600',
  on_site: 'bg-green-500/10 text-green-600',
  returned: 'bg-bg-secondary text-text-secondary',
  invoiced: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const RETURN_CONDITION_COLORS: Record<string, string> = {
  good: 'bg-green-500/10 text-green-600',
  fair: 'bg-yellow-500/10 text-yellow-600',
  damaged: 'bg-red-500/10 text-red-600',
  missing: 'bg-red-500/15 text-red-600',
};

export const SUB_RENTAL_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  requested: 'bg-yellow-500/10 text-yellow-600',
  confirmed: 'bg-blue-500/10 text-blue-600',
  checked_out: 'bg-purple-500/10 text-purple-600',
  returned: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};




export const PROJECT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-muted',
  planning: 'bg-bg-secondary text-text-secondary',
  active: 'bg-green-500/15 text-green-600',
  in_progress: 'bg-blue-500/15 text-blue-600',
  on_hold: 'bg-amber-500/15 text-amber-600',
  completed: 'bg-purple-500/15 text-purple-600',
  archived: 'bg-bg-secondary text-text-muted',
};

export const PHASE_STATUS_COLORS: Record<string, string> = {
  complete: 'bg-green-500/10 text-green-600',
  in_progress: 'bg-blue-500/10 text-blue-600',
  pending_approval: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  not_started: 'bg-bg-secondary text-text-muted',
  skipped: 'bg-bg-secondary text-text-muted',
};

/** Bar colors for roadmap timeline — solid bg-* classes for progress bars, not text badges */
export const ROADMAP_BAR_COLORS: Record<string, string> = {
  approved: 'bg-green-500',
  sent: 'bg-blue-500',
  active: 'bg-blue-500',
  completed: 'bg-text-muted',
  cancelled: 'bg-red-400',
};
export const WORK_ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  dispatched: 'bg-blue-500/10 text-blue-600',
  accepted: 'bg-indigo-500/10 text-indigo-600',
  in_progress: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
  assigned: 'bg-sky-500/10 text-sky-600',
  declined: 'bg-bg-secondary text-text-muted',
};

export const CREW_AVAILABILITY_COLORS: Record<string, string> = {
  available: 'bg-green-500/10 text-green-600',
  unavailable: 'bg-red-500/10 text-red-600',
  tentative: 'bg-yellow-500/10 text-yellow-600',
};

export const CREW_ONBOARDING_COLORS: Record<string, string> = {
  complete: 'bg-green-500/10 text-green-600',
  in_progress: 'bg-blue-500/10 text-blue-600',
  not_started: 'bg-bg-secondary text-text-muted',
  pending: 'bg-bg-secondary text-text-muted',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-600',
  tentative: 'bg-yellow-500/10 text-yellow-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-500/10 text-green-600',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-orange-500/10 text-orange-600',
  urgent: 'bg-red-500/10 text-red-600',
};

export const BID_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-500/15 text-blue-600',
  accepted: 'bg-green-500/15 text-green-600',
  rejected: 'bg-red-500/15 text-red-600',
  withdrawn: 'bg-bg-secondary text-text-secondary',
};

export const PROJECT_STATUS_UPDATE_COLORS: Record<string, string> = {
  on_track: 'bg-green-500/15 text-green-600',
  at_risk: 'bg-amber-500/15 text-amber-600',
  off_track: 'bg-red-500/15 text-red-600',
  completed: 'bg-blue-500/15 text-blue-600',
};

export const DISPATCH_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  assigned: 'bg-blue-500/10 text-blue-600',
  en_route: 'bg-indigo-500/10 text-indigo-600',
  on_site: 'bg-green-500/10 text-green-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const FABRICATION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  pending: 'bg-yellow-500/10 text-yellow-600',
  in_production: 'bg-blue-500/10 text-blue-600',
  quality_check: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-green-500/10 text-green-600',
  on_hold: 'bg-bg-secondary text-text-muted',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const BOM_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  ordered: 'bg-blue-500/10 text-blue-600',
  received: 'bg-green-500/10 text-green-600',
  allocated: 'bg-purple-500/10 text-purple-600',
};

export const PRODUCTION_SCHEDULE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-600',
  published: 'bg-blue-500/10 text-blue-600',
  live: 'bg-green-500/10 text-green-600',
  active: 'bg-green-500/10 text-green-600',
  completed: 'bg-bg-secondary text-text-secondary',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const SCHEDULE_BLOCK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-bg-secondary text-text-secondary',
  in_progress: 'bg-blue-500/10 text-blue-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const MILESTONE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  completed: 'bg-green-500/10 text-green-600',
  missed: 'bg-red-500/10 text-red-600',
};

export const TERMS_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600',
  draft: 'bg-bg-secondary text-text-secondary',
  archived: 'bg-bg-secondary text-text-muted',
};

export const SCHEDULE_TYPE_COLORS: Record<string, string> = {
  build_strike: 'bg-purple-500/10 text-purple-600',
  run_of_show: 'bg-purple-500/10 text-purple-600',
  rehearsal: 'bg-purple-500/10 text-purple-600',
  general: 'bg-purple-500/10 text-purple-600',
};

export const SCHEDULE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  confirmed: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-green-500/10 text-green-600',
  delayed: 'bg-red-500/10 text-red-600',
  on_hold: 'bg-bg-secondary text-text-muted',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const GOAL_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-bg-secondary text-text-secondary',
  in_progress: 'bg-blue-500/10 text-blue-600',
  at_risk: 'bg-red-500/10 text-red-600',
  on_track: 'bg-green-500/10 text-green-600',
  completed: 'bg-green-500/10 text-green-600',
  deferred: 'bg-bg-secondary text-text-muted',
};

export const ADVANCE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  pending: 'bg-yellow-500/10 text-yellow-600',
  submitted: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
  fulfilled: 'bg-green-500/15 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export const COMPLIANCE_STATUS_COLORS: Record<string, string> = {
  compliant: 'bg-green-500/10 text-green-600',
  verified: 'bg-green-500/10 text-green-600',
  non_compliant: 'bg-red-500/10 text-red-600',
  pending_review: 'bg-yellow-500/10 text-yellow-600',
  pending: 'bg-yellow-500/10 text-yellow-600',
  expired: 'bg-red-500/10 text-red-600',
  rejected: 'bg-bg-secondary text-text-muted',
  uploaded: 'bg-blue-500/10 text-blue-600',
  not_applicable: 'bg-bg-secondary text-text-muted',
};

export const MILEAGE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  submitted: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
  reimbursed: 'bg-green-500/15 text-green-600',
};

export const SYNC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  syncing: 'bg-blue-500/10 text-blue-600',
  synced: 'bg-green-500/10 text-green-600',
  error: 'bg-red-500/10 text-red-600',
  warning: 'bg-amber-500/10 text-amber-600',
};

/** Generic fallback — covers the most common status vocabulary. */
export const GENERIC_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  active: 'bg-green-500/10 text-green-600',
  inactive: 'bg-bg-secondary text-text-muted',
  pending: 'bg-yellow-500/10 text-yellow-600',
  submitted: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
  in_progress: 'bg-blue-500/10 text-blue-600',
  on_hold: 'bg-bg-secondary text-text-muted',
  overdue: 'bg-red-500/10 text-red-600',
  scheduled: 'bg-blue-500/10 text-blue-600',
  sent: 'bg-blue-500/10 text-blue-600',
  paid: 'bg-green-500/10 text-green-600',
  failed: 'bg-red-500/10 text-red-600',
  open: 'bg-blue-500/10 text-blue-600',
  closed: 'bg-bg-secondary text-text-muted',
};

/* ────────────────────────────────────────────
 * StatusBadge Component
 * ──────────────────────────────────────────── */

export interface StatusBadgeProps {
  /** The raw status string (e.g. 'in_progress'). Auto-formatted to title case. */
  status: string;
  /** Color registry to look up the status. Defaults to GENERIC_STATUS_COLORS. */
  colorMap?: Record<string, string>;
  /** Fallback color when status not found in map. */
  fallback?: string;
  /** Additional className. */
  className?: string;
}

/**
 * Canonical StatusBadge molecule.
 * Renders a pill badge with entity-specific color derived from a color registry.
 */
export default function StatusBadge({
  status,
  colorMap = GENERIC_STATUS_COLORS,
  fallback = 'bg-bg-secondary text-text-secondary',
  className = '',
}: StatusBadgeProps) {
  const colorClass = colorMap[status] ?? fallback;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorClass} ${className}`}>
      {formatLabel(status)}
    </span>
  );
}
