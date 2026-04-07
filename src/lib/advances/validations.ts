/**
 * Production Advancing Module — Server-side Validations
 *
 * @module lib/advances/validations
 */

import type { AdvanceStatus, AdvanceMode, AdvanceType } from '@/types/database';
import type { CreateAdvanceRequest, AddLineItemRequest, CartModifierSelection } from './types';
import { getValidTransitions } from './constants';

/* ─────────────────────────────────────────────────────────
   Status Transition Guard
   ───────────────────────────────────────────────────────── */

export function validateStatusTransition(
  mode: AdvanceMode,
  currentStatus: AdvanceStatus,
  targetStatus: AdvanceStatus,
): { valid: boolean; error?: string } {
  const valid = getValidTransitions(mode, currentStatus);
  if (!valid.includes(targetStatus)) {
    return {
      valid: false,
      error: `Cannot transition from '${currentStatus}' to '${targetStatus}' in ${mode} mode. Valid targets: ${valid.join(', ') || 'none'}`,
    };
  }
  return { valid: true };
}

/* ─────────────────────────────────────────────────────────
   Create Advance Validation
   ───────────────────────────────────────────────────────── */

export function validateCreateAdvance(body: Partial<CreateAdvanceRequest>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.advance_mode || !['internal', 'collection'].includes(body.advance_mode)) {
    errors.push('advance_mode is required and must be "internal" or "collection"');
  }

  if (!body.advance_type) {
    errors.push('advance_type is required');
  }

  const validTypes: AdvanceType[] = ['access', 'production', 'technical', 'hospitality', 'travel', 'labor', 'custom'];
  if (body.advance_type && !validTypes.includes(body.advance_type)) {
    errors.push(`advance_type must be one of: ${validTypes.join(', ')}`);
  }

  // Collection mode requires at least one of event_name or project_id
  if (body.advance_mode === 'collection') {
    if (!body.event_name && !body.project_id) {
      errors.push('Collection mode requires event_name or project_id');
    }
  }

  // Date validation
  if (body.service_start_date && body.service_end_date) {
    if (new Date(body.service_start_date) > new Date(body.service_end_date)) {
      errors.push('service_start_date must be before service_end_date');
    }
  }

  if (body.load_in_date && body.service_start_date) {
    if (new Date(body.load_in_date) > new Date(body.service_start_date)) {
      errors.push('load_in_date must be before or equal to service_start_date');
    }
  }

  return { valid: errors.length === 0, errors };
}

/* ─────────────────────────────────────────────────────────
   Line Item Validation
   ───────────────────────────────────────────────────────── */

export function validateAddLineItem(body: Partial<AddLineItemRequest>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.item_name || body.item_name.trim().length === 0) {
    errors.push('item_name is required');
  }

  if (!body.quantity || body.quantity < 1) {
    errors.push('quantity must be at least 1');
  }

  // If catalog references provided, both item and variant must be set
  if (body.catalog_item_id && !body.catalog_variant_id) {
    errors.push('catalog_variant_id is required when catalog_item_id is provided (always order variants, not items)');
  }

  return { valid: errors.length === 0, errors };
}

/* ─────────────────────────────────────────────────────────
   Modifier Validation
   ───────────────────────────────────────────────────────── */

export function validateModifierSelections(
  modifiers: CartModifierSelection[],
  modifierLists: Array<{
    id: string;
    name: string;
    min_selected: number;
    max_selected: number | null;
    is_required: boolean;
  }>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const list of modifierLists) {
    const selections = modifiers.filter((m) => m.list_id === list.id);
    const count = selections.length;

    if (list.is_required && count === 0) {
      errors.push(`Modifier list "${list.name}" requires at least one selection`);
    }

    if (count < list.min_selected) {
      errors.push(`Modifier list "${list.name}" requires at least ${list.min_selected} selections (got ${count})`);
    }

    if (list.max_selected !== null && count > list.max_selected) {
      errors.push(`Modifier list "${list.name}" allows at most ${list.max_selected} selections (got ${count})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/* ─────────────────────────────────────────────────────────
   Submission Deadline Check
   ───────────────────────────────────────────────────────── */

export function isSubmissionDeadlinePassed(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

/* ─────────────────────────────────────────────────────────
   Quantity Rules
   ───────────────────────────────────────────────────────── */

export function validateQuantityRules(
  quantity: number,
  min: number,
  max: number | null,
  increment: number,
): { valid: boolean; error?: string } {
  if (quantity < min) {
    return { valid: false, error: `Minimum order quantity is ${min}` };
  }
  if (max !== null && quantity > max) {
    return { valid: false, error: `Maximum order quantity is ${max}` };
  }
  if (increment > 1 && (quantity - min) % increment !== 0) {
    return { valid: false, error: `Quantity must be in increments of ${increment} (starting from ${min})` };
  }
  return { valid: true };
}
