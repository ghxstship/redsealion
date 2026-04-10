import { formatLabel } from '@/lib/utils';

/* ────────────────────────────────────────────
 * Entity-specific color registries
 * ──────────────────────────────────────────── */

export const EQUIPMENT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-bg-secondary text-text-secondary',
  in_production: 'bg-amber-50 text-amber-700',
  in_transit: 'bg-blue-50 text-blue-700',
  deployed: 'bg-green-50 text-green-700',
  in_storage: 'bg-purple-50 text-purple-700',
  retired: 'bg-red-50 text-red-700',
  disposed: 'bg-bg-secondary text-text-muted',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-bg-secondary text-text-secondary',
  todo: 'bg-bg-secondary text-text-secondary',
  in_progress: 'bg-blue-50 text-blue-700',
  in_review: 'bg-purple-50 text-purple-700',
  review: 'bg-purple-50 text-purple-700',
  done: 'bg-green-50 text-green-700',
  blocked: 'bg-red-50 text-red-700',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-bg-secondary text-text-muted',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-yellow-50 text-yellow-700',
  qualified: 'bg-green-50 text-green-700',
  proposal_sent: 'bg-purple-50 text-purple-700',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-50 text-red-700',
  archived: 'bg-bg-secondary text-text-muted',
  disqualified: 'bg-red-50 text-red-700',
};

/** Denser variant for card contexts (stronger intensity) */
export const LEAD_STATUS_COLORS_DENSE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  proposal_sent: 'bg-purple-100 text-purple-800',
  won: 'bg-green-200 text-green-900',
  lost: 'bg-red-100 text-red-800',
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
  discovery: 'bg-blue-50 text-blue-700',
  qualification: 'bg-indigo-50 text-indigo-700',
  proposal: 'bg-purple-50 text-purple-700',
  negotiation: 'bg-amber-50 text-amber-700',
  closed_won: 'bg-green-50 text-green-700',
  closed_lost: 'bg-red-50 text-red-700',
};

export const PHOTO_TYPE_COLORS: Record<string, string> = {
  before: 'bg-bg-secondary text-text-muted',
  progress: 'bg-blue-50 text-blue-700',
  completion: 'bg-green-50 text-green-700',
  issue: 'bg-red-50 text-red-700',
  reference: 'bg-purple-50 text-purple-700',
};

export const LEAD_SOURCE_COLORS: Record<string, string> = {
  referral: 'bg-bg-tertiary text-foreground',
  website: 'bg-bg-tertiary text-foreground',
  cold_call: 'bg-bg-tertiary text-foreground',
  event: 'bg-bg-tertiary text-foreground',
};

export const EVENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  confirmed: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const ACTIVATION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  confirmed: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const LOCATION_TYPE_COLORS: Record<string, string> = {
  venue: 'bg-indigo-50 text-indigo-700',
  arena: 'bg-blue-50 text-blue-700',
  stadium: 'bg-blue-50 text-blue-700',
  convention_center: 'bg-purple-50 text-purple-700',
  hotel: 'bg-amber-50 text-amber-700',
  outdoor: 'bg-green-50 text-green-700',
  warehouse: 'bg-bg-secondary text-text-secondary',
  office: 'bg-bg-secondary text-text-secondary',
  studio: 'bg-pink-50 text-pink-700',
  restaurant: 'bg-orange-50 text-orange-700',
  virtual: 'bg-cyan-50 text-cyan-700',
  other: 'bg-bg-secondary text-text-muted',
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  developer: 'bg-red-50 text-red-700',
  owner: 'bg-indigo-50 text-indigo-700',
  admin: 'bg-indigo-50 text-indigo-700',
  controller: 'bg-emerald-50 text-emerald-700',
  manager: 'bg-blue-50 text-blue-700',
  team_member: 'bg-purple-50 text-purple-700',
  client: 'bg-bg-secondary text-text-secondary',
  contractor: 'bg-amber-50 text-amber-700',
  crew: 'bg-orange-50 text-orange-700',
  viewer: 'bg-bg-secondary text-text-muted',
};

export const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  in_transit: 'bg-blue-50 text-blue-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-muted',
  scheduled: 'bg-blue-50 text-blue-700',
  sending: 'bg-amber-50 text-amber-700',
  sent: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

export const AUTOMATION_RUN_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  running: 'bg-blue-50 text-blue-700',
  failed: 'bg-red-50 text-red-700',
  pending: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-bg-secondary text-text-secondary',
};

export const PROCUREMENT_REQUISITION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  submitted: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  ordered: 'bg-blue-50 text-blue-700',
};

export const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  sent: 'bg-blue-50 text-blue-700',
  acknowledged: 'bg-purple-50 text-purple-700',
  partially_received: 'bg-yellow-50 text-yellow-700',
  received: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const RECEIPT_STATUS_COLORS: Record<string, string> = {
  partial: 'bg-yellow-50 text-yellow-700',
  complete: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export const TRANSFER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  in_transit: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const COUNT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  in_progress: 'bg-blue-50 text-blue-700',
  submitted: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export const CHECK_IN_OUT_STATUS_COLORS: Record<string, string> = {
  checked_out: 'bg-amber-50 text-amber-700',
  checked_in: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
  reserved: 'bg-blue-50 text-blue-700',
};

export const DAILY_REPORT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  submitted: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
};

export const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-bg-secondary text-text-muted',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-indigo-50 text-indigo-700',
  paid: 'bg-green-50 text-green-700',
  partially_paid: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  void: 'bg-bg-secondary text-text-muted',
  cancelled: 'bg-red-50 text-red-700',
};

export const SUPPLIER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-bg-secondary text-text-muted',
  pending: 'bg-yellow-50 text-yellow-700',
  blocked: 'bg-red-50 text-red-700',
};

export const RENTAL_ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  reserved: 'bg-blue-50 text-blue-700',
  checked_out: 'bg-purple-50 text-purple-700',
  on_site: 'bg-green-50 text-green-700',
  returned: 'bg-bg-secondary text-text-secondary',
  invoiced: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const WORK_ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  dispatched: 'bg-blue-50 text-blue-700',
  accepted: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const DISPATCH_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  assigned: 'bg-blue-50 text-blue-700',
  en_route: 'bg-indigo-50 text-indigo-700',
  on_site: 'bg-green-50 text-green-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const FABRICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  in_production: 'bg-blue-50 text-blue-700',
  quality_check: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  on_hold: 'bg-bg-secondary text-text-muted',
};

/* ────────────────────────────────────────────
 * StatusBadge Component
 * ──────────────────────────────────────────── */

interface StatusBadgeProps {
  /** The raw status string (e.g. 'in_progress'). Auto-formatted to title case. */
  status: string;
  /** Color registry to look up the status. */
  colorMap: Record<string, string>;
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
  colorMap,
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
