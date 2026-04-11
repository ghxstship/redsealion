/**
 * Types and helpers for the proposal detail page.
 *
 * @module app/app/proposals/[id]/_detail-types
 */

import { formatLabel } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────── */

export type DetailTab = 'overview' | 'builder' | 'preview' | 'export' | 'analytics' | 'versions' | 'activity';

export const detailTabs: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'builder', label: 'Builder' },
  { key: 'preview', label: 'Preview' },
  { key: 'export', label: 'Export' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'versions', label: 'Versions' },
  { key: 'activity', label: 'Activity' },
];

export interface ProposalData {
  id: string;
  name: string;
  subtitle: string | null;
  status: string;
  total_value: number;
  total_with_addons: number;
  probability_percent: number | null;
  currency: string;
  version: number;
  prepared_date: string | null;
  valid_until: string | null;
  tags: string[];
  narrative_context: Record<string, string> | null;
  payment_terms: {
    structure: string;
    depositPercent: number;
    balancePercent: number;
  } | null;
  client_name: string;
}

export interface PhaseData {
  id: string;
  name: string;
  subtitle: string | null;
  phase_number: number;
  status: string;
  phase_investment: number;
}

/* ─── Helpers ───────────────────────────────────────────── */

export function formatStatus(status: string): string {
  return formatLabel(status);
}

export const phaseColorMap: Record<string, string> = {
  complete: 'bg-green-500',
  in_progress: 'bg-blue-500',
  pending_approval: 'bg-amber-500',
  approved: 'bg-green-400',
  not_started: 'bg-gray-200',
  skipped: 'bg-gray-100',
};
