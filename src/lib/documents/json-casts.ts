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
