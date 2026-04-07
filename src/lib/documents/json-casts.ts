/**
 * JSON field cast helpers for Supabase auto-generated types.
 *
 * The auto-generated schema assigns `Json | null` to all JSONB columns.
 * These helpers safely cast them to typed interfaces at the boundary
 * so template and business-logic code can access properties directly.
 */

import type {
  BrandConfig,
  Facility,
  PaymentTerms,
  Address,
  VenueActivationDates,
  VenueLoadInStrike,
  VenueContact,
  NarrativeContext,
  AssetMetadata,
  ResourceMetadata,
  FinanceTrigger,
  PmMetadata,
  TermsSection,
  ChangeOrderLineItem,
  AssetLocation,
  RecurrenceRule,
  OrgSettings,
  Json,
} from '@/types/database';

/** Brand config from organization.brand_config */
export function castBrandConfig(val: Json | null): BrandConfig {
  return (val ?? {}) as unknown as BrandConfig;
}

/** Facilities from organization.facilities */
export function castFacilities(val: Json | null): Facility[] {
  return (val ?? []) as unknown as Facility[];
}

/** Payment terms from organization.payment_terms */
export function castPaymentTerms(val: Json | null): PaymentTerms | null {
  return val ? (val as unknown as PaymentTerms) : null;
}

/** Address from various JSONB address columns */
export function castAddress(val: Json | null): Address | null {
  return val ? (val as unknown as Address) : null;
}

/** Venue activation dates */
export function castActivationDates(val: Json | null): VenueActivationDates | null {
  return val ? (val as unknown as VenueActivationDates) : null;
}

/** Venue load-in / strike schedule */
export function castLoadInStrike(val: Json | null): VenueLoadInStrike[] {
  return (val ?? []) as unknown as VenueLoadInStrike[];
}

/** Venue contact */
export function castVenueContact(val: Json | null): VenueContact | null {
  return val ? (val as unknown as VenueContact) : null;
}

/** Narrative context from proposals / phases */
export function castNarrativeContext(val: Json | null): NarrativeContext | null {
  return val ? (val as unknown as NarrativeContext) : null;
}

/** Asset metadata from phase_deliverables */
export function castAssetMetadata(val: Json | null): AssetMetadata | null {
  return val ? (val as unknown as AssetMetadata) : null;
}

/** Resource metadata from phase_deliverables */
export function castResourceMetadata(val: Json | null): ResourceMetadata | null {
  return val ? (val as unknown as ResourceMetadata) : null;
}

/** Finance trigger from phase_deliverables */
export function castFinanceTrigger(val: Json | null): FinanceTrigger | null {
  return val ? (val as unknown as FinanceTrigger) : null;
}

/** PM metadata from phase_deliverables / addons */
export function castPmMetadata(val: Json | null): PmMetadata | null {
  return val ? (val as unknown as PmMetadata) : null;
}

/** Terms sections from terms_documents */
export function castTermsSections(val: Json | null): TermsSection[] {
  return (val ?? []) as unknown as TermsSection[];
}

/** Change order line items */
export function castChangeOrderLineItems(val: Json | null): ChangeOrderLineItem[] {
  return (val ?? []) as unknown as ChangeOrderLineItem[];
}

/** Asset location */
export function castAssetLocation(val: Json | null): AssetLocation | null {
  return val ? (val as unknown as AssetLocation) : null;
}

/** Recurrence rule */
export function castRecurrenceRule(val: Json | null): RecurrenceRule | null {
  return val ? (val as unknown as RecurrenceRule) : null;
}

/** Org settings */
export function castOrgSettings(val: Json | null): OrgSettings | null {
  return val ? (val as unknown as OrgSettings) : null;
}

/** Generic JSON cast — use sparingly */
export function castJson<T>(val: Json | null, fallback: T): T {
  return (val ?? fallback) as unknown as T;
}
