/**
 * Asset Status Transition Map
 *
 * Single source of truth for valid asset lifecycle transitions.
 * Used by the API to enforce state machine integrity.
 */

import type { AssetStatus } from '@/types/database';

const VALID_ASSET_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  planned: ['in_production', 'disposed'],
  in_production: ['in_transit', 'in_storage'],
  in_transit: ['deployed', 'in_storage'],
  deployed: ['in_transit', 'in_storage', 'retired'],
  in_storage: ['in_transit', 'retired', 'disposed'],
  retired: ['disposed', 'in_storage'],     // can be reconditioned
  disposed: [],                             // terminal
};

/**
 * Check whether a status transition is allowed.
 */
export function isValidTransition(from: AssetStatus, to: AssetStatus): boolean {
  if (from === to) return true; // no-op is always valid
  return (VALID_ASSET_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Status transitions that require extra metadata.
 */
export const TRANSITION_REQUIREMENTS: Partial<Record<AssetStatus, string[]>> = {
  retired: ['disposal_reason'],
  disposed: ['disposal_method'],
};

/**
 * Check that all required fields for a transition are present.
 */
export function getMissingTransitionFields(
  targetStatus: AssetStatus,
  body: Record<string, unknown>,
): string[] {
  const required = TRANSITION_REQUIREMENTS[targetStatus] ?? [];
  return required.filter((field) => !body[field]);
}
