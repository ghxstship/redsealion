import { formatLabel } from '@/lib/utils';

/* ────────────────────────────────────────────
 * Entity-specific color registries
 * ──────────────────────────────────────────── */

export const EQUIPMENT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_production: 'bg-amber-50 text-amber-700',
  in_transit: 'bg-blue-50 text-blue-700',
  deployed: 'bg-green-50 text-green-700',
  in_storage: 'bg-purple-50 text-purple-700',
  retired: 'bg-red-50 text-red-700',
  disposed: 'bg-gray-100 text-gray-500',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  todo: 'bg-gray-100 text-gray-700',
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
  low: 'bg-gray-100 text-gray-600',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-yellow-50 text-yellow-700',
  qualified: 'bg-green-50 text-green-700',
  proposal_sent: 'bg-purple-50 text-purple-700',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-50 text-red-700',
  archived: 'bg-gray-100 text-gray-600',
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
  archived: 'bg-gray-100 text-gray-800',
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
  fallback = 'bg-gray-100 text-gray-700',
  className = '',
}: StatusBadgeProps) {
  const colorClass = colorMap[status] ?? fallback;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorClass} ${className}`}>
      {formatLabel(status)}
    </span>
  );
}
