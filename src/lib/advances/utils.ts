/**
 * Production Advancing Module — Utility Functions
 *
 * @module lib/advances/utils
 */

import type {
  AdvanceCategoryGroup,
  AdvanceCategory,
  AdvanceSubcategory,
  UnitOfMeasure,
} from '@/types/database';
import type { CartItem, CartModifierSelection, CatalogTreeNode } from './types';

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

export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.lineTotalCents ?? 0), 0);
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

export function formatAdvanceNumber(advanceNumber: string): string {
  return advanceNumber.toUpperCase();
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
   Catalog Tree Builder
   ───────────────────────────────────────────────────────── */

export function buildCatalogTree(
  groups: AdvanceCategoryGroup[],
  categories: AdvanceCategory[],
  subcategories: AdvanceSubcategory[],
  itemCountsBySubcategory?: Record<string, number>,
): CatalogTreeNode[] {
  return groups
    .filter((g) => g.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((group) => ({
      group,
      categories: categories
        .filter((c) => c.group_id === group.id && c.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((category) => ({
          category,
          subcategories: subcategories
            .filter((s) => s.category_id === category.id && s.is_active !== false)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((subcategory) => ({
              subcategory,
              itemCount: itemCountsBySubcategory?.[subcategory.id] ?? 0,
            })),
        })),
    }));
}

/* ─────────────────────────────────────────────────────────
   Access Code Generation
   ───────────────────────────────────────────────────────── */

export function generateAccessCode(prefix?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 for readability
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix ? `${prefix}-${code}` : code;
}

/* ─────────────────────────────────────────────────────────
   Cart Reducer
   ───────────────────────────────────────────────────────── */

export function cartReducer(state: CartItem[], action: { type: string; [key: string]: unknown }): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM':
      return [...state, action.item as CartItem];
    case 'REMOVE_ITEM':
      return state.filter((item) => item.cartId !== action.cartId);
    case 'UPDATE_QUANTITY':
      return state.map((item) =>
        item.cartId === action.cartId
          ? {
              ...item,
              quantity: action.quantity as number,
              lineTotalCents: calculateLineTotal(
                item.unitPriceCents,
                action.quantity as number,
                item.modifierTotalCents,
              ),
            }
          : item,
      );
    case 'UPDATE_MODIFIERS': {
      const modifiers = action.modifiers as CartModifierSelection[];
      const modifierTotal = calculateModifierTotal(modifiers);
      return state.map((item) =>
        item.cartId === action.cartId
          ? {
              ...item,
              selectedModifiers: modifiers,
              modifierTotalCents: modifierTotal,
              lineTotalCents: calculateLineTotal(item.unitPriceCents, item.quantity, modifierTotal),
            }
          : item,
      );
    }
    case 'UPDATE_NOTES':
      return state.map((item) =>
        item.cartId === action.cartId ? { ...item, notes: action.notes as string } : item,
      );
    case 'UPDATE_DATES':
      return state.map((item) =>
        item.cartId === action.cartId ? { ...item, ...(action.dates as Partial<CartItem>) } : item,
      );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
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

export function getDeadlineCountdown(deadline: string | null): { label: string; isUrgent: boolean; isPassed: boolean } {
  if (!deadline) return { label: 'No deadline', isUrgent: false, isPassed: false };

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff < 0) return { label: 'Deadline passed', isUrgent: true, isPassed: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 1) return { label: `${days} days left`, isUrgent: days <= 2, isPassed: false };
  if (hours > 1) return { label: `${hours} hours left`, isUrgent: true, isPassed: false };
  return { label: 'Less than 1 hour', isUrgent: true, isPassed: false };
}
