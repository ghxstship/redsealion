/**
 * Production Advancing Module — Module-specific compound types
 *
 * These extend the base database row types with API request/response shapes,
 * cart state, and UI helper types.
 *
 * @module lib/advances/types
 */

import type {
  AdvanceCatalogItem,
  AdvanceCatalogVariant,
  AdvanceModifierList,
  AdvanceModifierOption,
  AdvanceCategoryGroup,
  AdvanceCategory,
  AdvanceSubcategory,
  ProductionAdvance,
  AdvanceLineItem,
  AdvanceCollaborator,
  AdvanceStatusHistoryEntry,
  AdvanceType,
  AdvanceMode,
  AdvanceStatus,
  AdvancePriority,
  FulfillmentType,
  UnitOfMeasure,
} from '@/types/database';

/* ─────────────────────────────────────────────────────────
   Catalog Tree
   ───────────────────────────────────────────────────────── */

interface CatalogTreeNode {
  group: AdvanceCategoryGroup;
  categories: Array<{
    category: AdvanceCategory;
    subcategories: Array<{
      subcategory: AdvanceSubcategory;
      itemCount: number;
    }>;
  }>;
}

/* ─────────────────────────────────────────────────────────
   Cart State (React — useState/useReducer)
   ───────────────────────────────────────────────────────── */

export interface CartModifierSelection {
  list_id: string;
  list_name: string;
  option_id: string;
  option_name: string;
  pre_modifier: string | null;
  price_adjustment_cents: number;
  quantity: number;
}

export interface CartItem {
  /** Client-generated ID for tracking in the cart before submission */
  cartId: string;
  catalogItemId: string | null;
  catalogVariantId: string | null;
  itemName: string;
  itemCode: string | null;
  variantName: string | null;
  variantSku: string | null;
  itemDescription: string | null;
  specificationsSnapshot: Record<string, unknown>;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  makeModel: string | null;
  selectedModifiers: CartModifierSelection[];
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  loadInDate: string | null;
  strikeDate: string | null;
  purpose: string | null;
  specialConsiderations: string | null;
  notes: string | null;
  specialRequest: string | null;
  unitPriceCents: number | null;
  modifierTotalCents: number;
  lineTotalCents: number | null;
  isAdHoc: boolean;
}

/* ─────────────────────────────────────────────────────────
   Advance With Related Data
   ───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   Status Transitions
   ───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   Filters & Listing
   ───────────────────────────────────────────────────────── */

export interface AdvanceFilters {
  status?: AdvanceStatus | AdvanceStatus[];
  mode?: AdvanceMode;
  type?: AdvanceType;
  priority?: AdvancePriority;
  projectId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  tab?: 'all' | 'my_advances' | 'pending_review' | 'collaborations' | 'approved' | 'fulfilled';
}

/* ─────────────────────────────────────────────────────────
   API Request / Response Shapes
   ───────────────────────────────────────────────────────── */

export interface CreateAdvanceRequest {
  advance_mode: AdvanceMode;
  advance_type: AdvanceType;
  project_id?: string;
  event_name?: string;
  company_name?: string;
  venue_name?: string;
  venue_address?: Record<string, unknown>;
  priority?: AdvancePriority;
  service_start_date?: string;
  service_end_date?: string;
  load_in_date?: string;
  strike_date?: string;
  submission_deadline?: string;
  purpose?: string;
  special_considerations?: string;
  notes?: string;
  submission_instructions?: string;
  fulfillment_type?: FulfillmentType;
  // Collection mode settings
  is_catalog_shared?: boolean;
  allow_ad_hoc_items?: boolean;
  require_approval_per_contributor?: boolean;
  allowed_advance_types?: AdvanceType[];
  allowed_category_groups?: string[];
  max_submissions?: number;
}

export interface AddLineItemRequest {
  catalog_item_id?: string;
  catalog_variant_id?: string;
  item_name: string;
  item_code?: string;
  variant_name?: string;
  variant_sku?: string;
  item_description?: string;
  specifications_snapshot?: Record<string, unknown>;
  quantity: number;
  unit_of_measure?: UnitOfMeasure;
  make_model?: string;
  selected_modifiers?: CartModifierSelection[];
  service_start_date?: string;
  service_end_date?: string;
  load_in_date?: string;
  strike_date?: string;
  purpose?: string;
  special_considerations?: string;
  notes?: string;
  special_request?: string;
  unit_price_cents?: number;
}

/* ─────────────────────────────────────────────────────────
   Catalog Intelligence Layer
   ───────────────────────────────────────────────────────── */

// Interchange
interface CatalogItemInterchange {
  id: string;
  source_item_id: string;
  target_item_id: string;
  relationship_type: 'direct_substitute' | 'budget_alternative' | 'premium_upgrade' | 'same_class_comparable' | 'partial_substitute';
  compatibility_score: number;
  comparison_data: Record<string, any>;
  is_bidirectional: boolean;
  valid_contexts: string[];
  verified_by?: string;
  verified_at?: string;
  notes?: string;
}

// Supersession
interface CatalogItemSupersession {
  id: string;
  predecessor_item_id: string;
  successor_item_id: string;
  effective_date?: string;
  change_summary?: string;
  predecessor_status: 'discontinued' | 'legacy_available' | 'end_of_life' | 'recalled' | 'reclassified';
  backward_compatible: boolean;
}

export interface SupersessionChainNode {
  chain_position: number;
  item_id: string;
  item_name: string;
  status: string;
  effective_date?: string;
  change_summary?: string;
}

// Fitment
interface FitmentDimension {
  id: string;
  dimension_type: 'venue_type' | 'event_scale' | 'environment' | 'budget_tier' | 'use_case' | 'power_class' | 'control_protocol' | 'regulatory' | 'logistics';
  dimension_value: string;
  display_label: string;
  applicable_collections: string[];
}

interface CatalogItemFitment {
  id: string;
  catalog_item_id: string;
  fitment_dimension_id: string;
  fit_rating: 1 | 2 | 3 | 4 | 5;
  fit_notes?: string;
}

interface FitmentSearchResult {
  item_id: string;
  item_name: string;
  collection_name: string;
  category_name: string;
  avg_fit_rating: number;
  matching_dimensions: number;
}


