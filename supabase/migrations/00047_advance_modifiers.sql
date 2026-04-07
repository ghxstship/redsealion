-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 4: Modifier Lists & Options
-- ═══════════════════════════════════════════════════════════

CREATE TABLE advance_modifier_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selection_type modifier_selection_type DEFAULT 'list',
  min_selected INTEGER DEFAULT 0,
  max_selected INTEGER,
  allow_quantities BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE advance_modifier_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  modifier_list_id UUID NOT NULL REFERENCES advance_modifier_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_adjustment_cents INTEGER DEFAULT 0,
  price_adjustment_type TEXT DEFAULT 'fixed',
  is_default BOOLEAN DEFAULT false,
  pre_modifier TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_modifier_options_list ON advance_modifier_options(modifier_list_id);

-- Junction: which modifier lists apply to which items
CREATE TABLE advance_item_modifier_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,
  modifier_list_id UUID NOT NULL REFERENCES advance_modifier_lists(id) ON DELETE CASCADE,
  min_selected_override INTEGER,
  max_selected_override INTEGER,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(item_id, modifier_list_id)
);
