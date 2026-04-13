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

/** Generic JSON cast helper. Safely narrows Json to T. */
export function castJson<T>(val: Json | null, fallback: T): T {
  // Encapsulated unsafe cast to avoid leaking `as unknown as` into business logic
  return (val === null || val === undefined ? fallback : val) as unknown as T;
}

/** Brand config from organization.brand_config */
export function castBrandConfig(val: Json | null): BrandConfig {
  return castJson<BrandConfig>(val, {} as BrandConfig);
}

/** Facilities from organization.facilities */
export function castFacilities(val: Json | null): Facility[] {
  return castJson<Facility[]>(val, []);
}

/** Payment terms from organization.payment_terms */
export function castPaymentTerms(val: Json | null): PaymentTerms | null {
  return castJson<PaymentTerms | null>(val, null);
}

/** Address from various JSONB address columns */
function castAddress(val: Json | null): Address | null {
  return castJson<Address | null>(val, null);
}

/** Venue activation dates */
function castActivationDates(val: Json | null): VenueActivationDates | null {
  return castJson<VenueActivationDates | null>(val, null);
}

/** Venue load-in / strike schedule */
function castLoadInStrike(val: Json | null): VenueLoadInStrike[] {
  return castJson<VenueLoadInStrike[]>(val, []);
}

/** Venue contact */
function castVenueContact(val: Json | null): VenueContact | null {
  return castJson<VenueContact | null>(val, null);
}

/** Narrative context from proposals / phases */
function castNarrativeContext(val: Json | null): NarrativeContext | null {
  return castJson<NarrativeContext | null>(val, null);
}

/** Asset metadata from phase_deliverables */
function castAssetMetadata(val: Json | null): AssetMetadata | null {
  return castJson<AssetMetadata | null>(val, null);
}

/** Resource metadata from phase_deliverables */
function castResourceMetadata(val: Json | null): ResourceMetadata | null {
  return castJson<ResourceMetadata | null>(val, null);
}

/** Finance trigger from phase_deliverables */
function castFinanceTrigger(val: Json | null): FinanceTrigger | null {
  return castJson<FinanceTrigger | null>(val, null);
}

/** PM metadata from phase_deliverables / addons */
function castPmMetadata(val: Json | null): PmMetadata | null {
  return castJson<PmMetadata | null>(val, null);
}

/** Terms sections from terms_documents */
function castTermsSections(val: Json | null): TermsSection[] {
  return castJson<TermsSection[]>(val, []);
}

/** Change order line items */
function castChangeOrderLineItems(val: Json | null): ChangeOrderLineItem[] {
  return castJson<ChangeOrderLineItem[]>(val, []);
}

/** Asset location */
function castAssetLocation(val: Json | null): AssetLocation | null {
  return castJson<AssetLocation | null>(val, null);
}

/** Recurrence rule */
function castRecurrenceRule(val: Json | null): RecurrenceRule | null {
  return castJson<RecurrenceRule | null>(val, null);
}

/** Org settings */
function castOrgSettings(val: Json | null): OrgSettings | null {
  return castJson<OrgSettings | null>(val, null);
}
