/**
 * Production Advancing Module — Utility Functions
 *
 * @module lib/advances/utils
 */

import type {
  UnitOfMeasure,
} from '@/types/database';
import type { CartModifierSelection } from './types';

/* ─────────────────────────────────────────────────────────
   Price Calculations
   ───────────────────────────────────────────────────────── */

export function calculateModifierTotal(modifiers: CartModifierSelection[]): number {
  return modifiers.reduce((total, mod) => {
    return total + mod.price_adjustment_cents * (mod.quantity || 1);
  }, 0);
}

export function calculateLineTotal(
  unitPriceCents: number | null,
  quantity: number,
  modifierTotalCents: number,
  discountCents: number = 0,
): number | null {
  if (unitPriceCents === null) return null;
  return (unitPriceCents * quantity) + modifierTotalCents - discountCents;
}



/* ─────────────────────────────────────────────────────────
   Formatting
   ───────────────────────────────────────────────────────── */

export function formatCents(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}



const UOM_LABELS: Record<UnitOfMeasure, string> = {
  each: 'ea',
  pair: 'pr',
  set: 'set',
  case: 'case',
  pallet: 'pallet',
  linear_ft: 'lin ft',
  sq_ft: 'sq ft',
  cubic_ft: 'cu ft',
  hour: 'hr',
  half_day: '½ day',
  day: 'day',
  week: 'wk',
  month: 'mo',
  lb: 'lb',
  ton: 'ton',
  gallon: 'gal',
  liter: 'L',
  person: 'person',
  crew: 'crew',
  flat_rate: 'flat',
};

export function formatUnitOfMeasure(uom: UnitOfMeasure): string {
  return UOM_LABELS[uom] ?? uom;
}





/* ─────────────────────────────────────────────────────────
   Date Formatting
   ───────────────────────────────────────────────────────── */

export function formatAdvanceDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
}


