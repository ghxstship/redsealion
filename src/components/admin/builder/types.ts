/**
 * Shared types, factory functions, and constants for the proposal builder.
 *
 * Extracted from PhaseEditorStep.tsx to keep components under the 300-line limit
 * and enable reuse across builder sub-components.
 *
 * @module components/admin/builder/types
 */

import type { RequirementAssignee } from '@/types/database';

/* ─── Data Interfaces ───────────────────────────────────────────────── */

export interface DeliverableData {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  qty: number;
  unitCost: number;
  totalCost: number;
}

export interface AddonData extends DeliverableData {
  selected: boolean;
  mutuallyExclusiveGroup: string;
}

export interface MilestoneRequirementData {
  id: string;
  text: string;
  assignee: RequirementAssignee;
}

export interface MilestoneData {
  name: string;
  requirements: MilestoneRequirementData[];
}

export interface PhaseData {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  narrative: string;
  deliverables: DeliverableData[];
  addons: AddonData[];
  milestone: MilestoneData;
}

/* ─── Constants ─────────────────────────────────────────────────────── */

export const CATEGORY_SUGGESTIONS = [
  'Design',
  'Fabrication',
  'Technology',
  'Logistics',
  'Staffing',
  'AV/Production',
  'Content',
  'Installation',
  'Management',
];

export const UNIT_OPTIONS = ['unit', 'hour', 'day', 'sq ft', 'linear ft', 'lot', 'each', 'set', 'person'];

export const ASSIGNEE_OPTIONS: { value: RequirementAssignee; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'producer', label: 'Producer' },
  { value: 'both', label: 'Both' },
  { value: 'external_vendor', label: 'External Vendor' },
];

/* ─── Factory Functions ─────────────────────────────────────────────── */

export function createEmptyDeliverable(): DeliverableData {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    category: '',
    unit: 'unit',
    qty: 1,
    unitCost: 0,
    totalCost: 0,
  };
}

export function createEmptyAddon(): AddonData {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    category: '',
    unit: 'unit',
    qty: 1,
    unitCost: 0,
    totalCost: 0,
    selected: false,
    mutuallyExclusiveGroup: '',
  };
}

export function createEmptyRequirement(): MilestoneRequirementData {
  return {
    id: crypto.randomUUID(),
    text: '',
    assignee: 'producer',
  };
}

/* ─── Formatters ────────────────────────────────────────────────────── */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
