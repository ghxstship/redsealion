'use client';

import StatusBadge from '@/components/ui/StatusBadge';

/**
 * Advance status color registry for the canonical StatusBadge atom.
 */
export const ADVANCE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open_for_submissions: 'bg-blue-50 text-blue-700',
  submitted: 'bg-violet-50 text-violet-700',
  under_review: 'bg-amber-50 text-amber-700',
  changes_requested: 'bg-orange-50 text-orange-700',
  approved: 'bg-emerald-50 text-emerald-700',
  partially_fulfilled: 'bg-cyan-50 text-cyan-700',
  fulfilled: 'bg-green-50 text-green-700',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  on_hold: 'bg-yellow-50 text-yellow-700',
  expired: 'bg-gray-100 text-gray-500',
};

export const ADVANCE_PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-blue-50 text-blue-700',
  low: 'bg-gray-100 text-gray-700',
};

export const FULFILLMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  sourcing: 'bg-violet-50 text-violet-700',
  quoted: 'bg-indigo-50 text-indigo-700',
  confirmed: 'bg-blue-50 text-blue-700',
  reserved: 'bg-sky-50 text-sky-700',
  in_transit: 'bg-amber-50 text-amber-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  inspected: 'bg-green-50 text-green-700',
  setup_complete: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  struck: 'bg-orange-50 text-orange-700',
  returned: 'bg-gray-100 text-gray-700',
  damaged: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export const ADVANCE_MODE_COLORS: Record<string, string> = {
  internal: 'bg-gray-100 text-gray-700',
  collection: 'bg-indigo-50 text-indigo-700',
};

interface AdvanceStatusBadgeProps {
  status: string;
  className?: string;
}

export default function AdvanceStatusBadge({ status, className }: AdvanceStatusBadgeProps) {
  return <StatusBadge status={status} colorMap={ADVANCE_STATUS_COLORS} className={className} />;
}
