-- Migration: 00142_advance_catalog_item_interchange.sql

CREATE TABLE IF NOT EXISTS advance_catalog_item_interchange (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source and target items (both reference advance_catalog_items)
  source_item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,
  target_item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,

  -- Relationship classification
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'direct_substitute',      -- Drop-in replacement, near-identical specs
    'budget_alternative',     -- Lower cost, acceptable tradeoffs
    'premium_upgrade',        -- Higher spec/cost option
    'same_class_comparable',  -- Same category, different vendor/manufacturer
    'partial_substitute'      -- Covers some but not all use cases
  )),

  -- Compatibility scoring (0-100)
  -- 90-100: Near-identical, transparent swap
  -- 70-89:  Strong substitute with minor tradeoffs
  -- 50-69:  Acceptable alternative, notable differences
  -- 30-49:  Usable in a pinch, significant compromises
  -- 0-29:   Last resort only
  compatibility_score INTEGER NOT NULL DEFAULT 50 CHECK (
    compatibility_score >= 0 AND compatibility_score <= 100
  ),

  -- Dimensional comparison metadata
  comparison_data JSONB DEFAULT '{}',
  
  -- Bidirectional flag
  is_bidirectional BOOLEAN DEFAULT true,

  -- Context constraints — when is this interchange valid?
  valid_contexts TEXT[] DEFAULT '{}',

  -- Admin metadata
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source_item_id, target_item_id, relationship_type)
);

CREATE INDEX idx_interchange_source ON advance_catalog_item_interchange(source_item_id);
CREATE INDEX idx_interchange_target ON advance_catalog_item_interchange(target_item_id);
CREATE INDEX idx_interchange_type ON advance_catalog_item_interchange(relationship_type);
CREATE INDEX idx_interchange_score ON advance_catalog_item_interchange(compatibility_score DESC);
CREATE INDEX idx_interchange_contexts ON advance_catalog_item_interchange USING GIN(valid_contexts);
