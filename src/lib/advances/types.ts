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

export interface CatalogTreeNode {
  group: AdvanceCategoryGroup;
  categories: Array<{
    category: AdvanceCategory;
    subcategories: Array<{
      subcategory: AdvanceSubcategory;
      itemCount: number;
    }>;
  }>;
}

export interface CatalogItemWithVariants extends AdvanceCatalogItem {
  variants: AdvanceCatalogVariant[];
  modifier_lists: Array<AdvanceModifierList & { options: AdvanceModifierOption[] }>;
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

export type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; cartId: string }
  | { type: 'UPDATE_QUANTITY'; cartId: string; quantity: number }
  | { type: 'UPDATE_MODIFIERS'; cartId: string; modifiers: CartModifierSelection[] }
  | { type: 'UPDATE_NOTES'; cartId: string; notes: string }
  | { type: 'UPDATE_DATES'; cartId: string; dates: Partial<Pick<CartItem, 'serviceStartDate' | 'serviceEndDate' | 'loadInDate' | 'strikeDate'>> }
  | { type: 'CLEAR_CART' };

/* ─────────────────────────────────────────────────────────
   Advance With Related Data
   ───────────────────────────────────────────────────────── */

export interface AdvanceWithItems extends ProductionAdvance {
  line_items: AdvanceLineItem[];
  collaborators?: AdvanceCollaborator[];
  status_history?: AdvanceStatusHistoryEntry[];
  project_name?: string | null;
}

export interface CollaboratorWithSubmission extends AdvanceCollaborator {
  user_name?: string | null;
  user_email?: string | null;
  org_name?: string | null;
  item_count: number;
  total_cents: number;
}

/* ─────────────────────────────────────────────────────────
   Status Transitions
   ───────────────────────────────────────────────────────── */

export interface StatusTransition {
  from: AdvanceStatus;
  to: AdvanceStatus;
  label: string;
  requiresReason?: boolean;
  requiresRole?: string[];
}

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

export interface UpdateAdvanceRequest {
  event_name?: string;
  venue_name?: string;
  venue_address?: Record<string, unknown>;
  advance_type?: AdvanceType;
  priority?: AdvancePriority;
  service_start_date?: string;
  service_end_date?: string;
  load_in_date?: string;
  strike_date?: string;
  submission_deadline?: string;
  purpose?: string;
  special_considerations?: string;
  notes?: string;
  internal_notes?: string;
  submission_instructions?: string;
  fulfillment_type?: FulfillmentType;
  is_catalog_shared?: boolean;
  allow_ad_hoc_items?: boolean;
  require_approval_per_contributor?: boolean;
  allowed_advance_types?: AdvanceType[];
  allowed_category_groups?: string[];
  max_submissions?: number;
  version: number;
}

export interface InviteCollaboratorRequest {
  user_id?: string;
  organization_id?: string;
  email?: string;
  collaborator_role?: string;
  allowed_advance_types?: AdvanceType[];
  allowed_category_groups?: string[];
  custom_instructions?: string;
}

export interface GenerateAccessCodeRequest {
  code_type?: string;
  collaborator_role?: string;
  allowed_advance_types?: AdvanceType[];
  allowed_category_groups?: string[];
  allowed_domains?: string[];
  max_uses?: number;
  expires_at?: string;
}
