/**
 * Document Template Types
 *
 * Extended interfaces used by document generation templates.
 * These are supersets of the DB row types, containing computed/joined
 * fields that the API layer provides at render time.
 *
 * @module lib/documents/types
 */

import type { Json } from '@/types/database';

/* ─────────────────────────────────────────────────────────
   Shared Address / Contact (for JSONB columns)
   ───────────────────────────────────────────────────────── */

export interface DocAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface DocContact {
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
}

/* ─────────────────────────────────────────────────────────
   Venue-related (JSONB columns on venues table)
   ───────────────────────────────────────────────────────── */

export interface DocVenueActivationDates {
  start?: string;
  end?: string;
}

export interface DocVenueLoadInStrike {
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  notes?: string;
}

export interface DocVenueContact {
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
}

/* ─────────────────────────────────────────────────────────
   Change Order (extended beyond DB row)
   ───────────────────────────────────────────────────────── */

export interface DocChangeOrder {
  id: string;
  number: number;
  status: string;
  title: string;
  description: string | null;
  reason: string | null;
  amount: number;
  original_value: number;
  net_change: number;
  revised_value: number;
  schedule_impact_days: number | null;
  scope_additions: DocChangeOrderLineItem[];
  scope_removals: DocChangeOrderLineItem[];
  created_at: string;
}

export interface DocChangeOrderLineItem {
  description: string;
  phase_number: string | null;
  qty: number;
  unit_cost: number;
  total: number;
}

/* ─────────────────────────────────────────────────────────
   Terms Document (JSONB sections)
   ───────────────────────────────────────────────────────── */

export interface DocTermsSection {
  title: string;
  body: string;
  order?: number;
}

/* ─────────────────────────────────────────────────────────
   BOM / Deliverable Metadata (JSONB)
   ───────────────────────────────────────────────────────── */

export interface DocDeliverableMeta {
  dimensions?: string;
  weight?: string | number;
  material?: string;
  specs?: Record<string, unknown>;
}

/* ─────────────────────────────────────────────────────────
   Cast Helpers
   ───────────────────────────────────────────────────────── */

import { castJson } from './json-casts';

export function castDocAddress(val: Json | null | undefined): DocAddress | null {
  return castJson<DocAddress | null>(val ?? null, null);
}

export function castDocContact(val: Json | null | undefined): DocContact | null {
  return castJson<DocContact | null>(val ?? null, null);
}

export function castActivationDates(val: Json | null | undefined): DocVenueActivationDates | null {
  return castJson<DocVenueActivationDates | null>(val ?? null, null);
}

export function castLoadInStrike(val: Json | null | undefined): DocVenueLoadInStrike[] {
  return castJson<DocVenueLoadInStrike[]>(val ?? null, []);
}

export function castVenueContact(val: Json | null | undefined): DocVenueContact | null {
  return castJson<DocVenueContact | null>(val ?? null, null);
}

export function castTermsSections(val: Json | null | undefined): DocTermsSection[] {
  return castJson<DocTermsSection[]>(val ?? null, []);
}

export function castDeliverableMeta(val: Json | null | undefined): DocDeliverableMeta {
  return castJson<DocDeliverableMeta>(val ?? null, {});
}

export function castChangeOrders(val: unknown[]): DocChangeOrder[] {
  // Supabase returns ChangeOrder rows as unknown[] from JSONB — narrow to doc shape.
  return val as DocChangeOrder[];
}

/**
 * Cast a single load_in or strike JSONB column to DocVenueLoadInStrike.
 * Unlike castLoadInStrike (which wraps arrays), this handles the scalar case
 * used by crew-call-sheet, load-in-strike, production-schedule, and proposal templates.
 */
export function castLoadInStrikeEntry(val: Json | null | undefined): DocVenueLoadInStrike | null {
  return castJson<DocVenueLoadInStrike | null>(val ?? null, null);
}

/** Location JSONB column (assets / location history) */
export interface DocAssetLocation {
  facilityId?: string;
  type?: string;
  venueId?: string;
}

export function castAssetLocationDoc(val: Json | null | undefined): DocAssetLocation | null {
  return castJson<DocAssetLocation | null>(val ?? null, null);
}
