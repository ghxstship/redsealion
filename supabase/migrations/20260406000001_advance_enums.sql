-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 1: All Enums
-- ═══════════════════════════════════════════════════════════

-- CATALOG ENUMS

CREATE TYPE pricing_strategy AS ENUM (
  'fixed',
  'open',
  'tiered',
  'market',
  'computed'
);

CREATE TYPE procurement_method AS ENUM (
  'rent', 'buy', 'internal', 'subcontract', 'consignment'
);

CREATE TYPE unit_of_measure AS ENUM (
  'each', 'pair', 'set', 'case', 'pallet',
  'linear_ft', 'sq_ft', 'cubic_ft',
  'hour', 'half_day', 'day', 'week', 'month',
  'lb', 'ton', 'gallon', 'liter',
  'person', 'crew', 'flat_rate'
);

CREATE TYPE modifier_selection_type AS ENUM (
  'list', 'text', 'quantity', 'boolean', 'date', 'date_range'
);

-- ADVANCE ENUMS

CREATE TYPE advance_mode AS ENUM (
  'internal',
  'collection'
);

CREATE TYPE advance_status AS ENUM (
  'draft', 'open_for_submissions', 'submitted', 'under_review',
  'changes_requested', 'approved', 'partially_fulfilled', 'fulfilled',
  'completed', 'rejected', 'cancelled', 'on_hold', 'expired'
);

CREATE TYPE advance_type AS ENUM (
  'access', 'production', 'technical', 'hospitality',
  'travel', 'labor', 'custom'
);

CREATE TYPE advance_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE fulfillment_status AS ENUM (
  'pending', 'sourcing', 'quoted', 'confirmed', 'reserved',
  'in_transit', 'delivered', 'inspected', 'setup_complete',
  'active', 'struck', 'returned', 'damaged', 'cancelled'
);

CREATE TYPE fulfillment_type AS ENUM (
  'pickup', 'delivery', 'on_site', 'drop_ship', 'will_call', 'digital'
);

-- COLLABORATION ENUMS

CREATE TYPE collaborator_role AS ENUM (
  'owner',
  'manager',
  'contributor',
  'viewer',
  'vendor'
);

CREATE TYPE invite_status AS ENUM (
  'pending', 'accepted', 'declined', 'expired', 'revoked'
);

CREATE TYPE access_code_type AS ENUM (
  'single_use',
  'multi_use',
  'unlimited'
);
