import type { ProposalStatus } from '@/types/enums';

/**
 * Canonical project-related constants — SSOT
 * 
 * All status/visibility/category enums for projects and profitability
 * are defined here to prevent drift between create forms, list filters,
 * and API validation.
 */

/* ────────────────────────────────────────────
 * PROJECT STATUSES & VISIBILITY
 * ──────────────────────────────────────────── */

export const PROJECT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
] as const;

const PROJECT_STATUS_VALUES = PROJECT_STATUSES.map((s) => s.value);

export const PROJECT_VISIBILITY = [
  { value: 'internal', label: 'Internal' },
  { value: 'client', label: 'Client Visible' },
  { value: 'public', label: 'Public' },
] as const;

/* ────────────────────────────────────────────
 * PROFITABILITY ELIGIBLE STATUSES
 *
 * Proposals with these statuses are included
 * in profitability analysis.
 * ──────────────────────────────────────────── */

export const PROFITABILITY_ELIGIBLE_STATUSES: ProposalStatus[] = [
  'approved',
  'in_production',
  'active',
  'complete',
];

/* ────────────────────────────────────────────
 * COST CATEGORIES
 *
 * Used in AddCostButton, profitability detail,
 * and potentially budget views.
 * ──────────────────────────────────────────── */

export const COST_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'travel', label: 'Travel' },
  { value: 'venue', label: 'Venue' },
  { value: 'catering', label: 'Catering' },
  { value: 'permits', label: 'Permits & Insurance' },
  { value: 'other', label: 'Other' },
] as const;
