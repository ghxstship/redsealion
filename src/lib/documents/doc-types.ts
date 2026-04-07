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

export function castDocAddress(val: Json | null | undefined): DocAddress | null {
  return val ? (val as unknown as DocAddress) : null;
}

export function castDocContact(val: Json | null | undefined): DocContact | null {
  return val ? (val as unknown as DocContact) : null;
}

export function castActivationDates(val: Json | null | undefined): DocVenueActivationDates | null {
  return val ? (val as unknown as DocVenueActivationDates) : null;
}

export function castLoadInStrike(val: Json | null | undefined): DocVenueLoadInStrike[] {
  return (val ?? []) as unknown as DocVenueLoadInStrike[];
}

export function castVenueContact(val: Json | null | undefined): DocVenueContact | null {
  return val ? (val as unknown as DocVenueContact) : null;
}

export function castTermsSections(val: Json | null | undefined): DocTermsSection[] {
  return (val ?? []) as unknown as DocTermsSection[];
}

export function castDeliverableMeta(val: Json | null | undefined): DocDeliverableMeta {
  return (val ?? {}) as unknown as DocDeliverableMeta;
}

export function castChangeOrders(val: unknown[]): DocChangeOrder[] {
  return val as unknown as DocChangeOrder[];
}
