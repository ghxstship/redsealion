-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 11: Row Level Security
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE advance_category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_catalog_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_modifier_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_item_modifier_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_webhook_events ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- CATEGORY & CATALOG: Org members see own, collaborators see shared
-- ═══════════════════════════════════════════════════════════

CREATE POLICY category_groups_org_select ON advance_category_groups FOR SELECT USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY category_groups_org_all ON advance_category_groups FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

CREATE POLICY categories_org_select ON advance_categories FOR SELECT USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY categories_org_all ON advance_categories FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

CREATE POLICY subcategories_org_select ON advance_subcategories FOR SELECT USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY subcategories_org_all ON advance_subcategories FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

-- Catalog items: org members + collaborators on shared catalogs
CREATE POLICY catalog_items_org_select ON advance_catalog_items FOR SELECT USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
  OR (
    is_shared_catalog = true AND organization_id IN (
      SELECT pa.organization_id FROM production_advances pa
      JOIN advance_collaborators ac ON ac.advance_id = pa.id
      WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted' AND pa.is_catalog_shared = true
    )
  )
);
CREATE POLICY catalog_items_org_all ON advance_catalog_items FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

-- Variants inherit visibility from items
CREATE POLICY variants_org_select ON advance_catalog_variants FOR SELECT USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
  OR item_id IN (
    SELECT ci.id FROM advance_catalog_items ci
    WHERE ci.is_shared_catalog = true AND ci.organization_id IN (
      SELECT pa.organization_id FROM production_advances pa
      JOIN advance_collaborators ac ON ac.advance_id = pa.id
      WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted' AND pa.is_catalog_shared = true
    )
  )
);
CREATE POLICY variants_org_all ON advance_catalog_variants FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

-- Modifiers: org members only
CREATE POLICY modifier_lists_org ON advance_modifier_lists FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY modifier_options_org ON advance_modifier_options FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY item_modifier_lists_select ON advance_item_modifier_lists FOR SELECT USING (true);
CREATE POLICY item_modifier_lists_manage ON advance_item_modifier_lists FOR ALL USING (
  item_id IN (SELECT ci.id FROM advance_catalog_items ci WHERE ci.organization_id IN (
    SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'
  ))
);

-- ═══════════════════════════════════════════════════════════
-- INVENTORY: Org members only
-- ═══════════════════════════════════════════════════════════

CREATE POLICY inv_locations_org ON advance_inventory_locations FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY inv_levels_org ON advance_inventory_levels FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY inv_txn_org ON advance_inventory_transactions FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

-- ═══════════════════════════════════════════════════════════
-- ADVANCES: Org members see all, collaborators see their advances
-- ═══════════════════════════════════════════════════════════

CREATE POLICY advances_org_select ON production_advances FOR SELECT USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY advances_collaborator_select ON production_advances FOR SELECT USING (
  id IN (SELECT ac.advance_id FROM advance_collaborators ac WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted')
);
CREATE POLICY advances_org_all ON production_advances FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

-- ═══════════════════════════════════════════════════════════
-- LINE ITEMS: Org members see all, collaborators see own + approved
-- ═══════════════════════════════════════════════════════════

CREATE POLICY line_items_org_select ON advance_line_items FOR SELECT USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY line_items_collaborator_select ON advance_line_items FOR SELECT USING (
  advance_id IN (
    SELECT ac.advance_id FROM advance_collaborators ac
    WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted'
  )
  AND (submitted_by_user_id = auth.uid() OR approval_status = 'approved')
);
CREATE POLICY line_items_org_all ON advance_line_items FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
CREATE POLICY line_items_collaborator_insert ON advance_line_items FOR INSERT WITH CHECK (
  advance_id IN (
    SELECT ac.advance_id FROM advance_collaborators ac
    WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted'
      AND ac.collaborator_role IN ('contributor', 'vendor', 'manager', 'owner')
  )
);
CREATE POLICY line_items_collaborator_update ON advance_line_items FOR UPDATE USING (
  submitted_by_user_id = auth.uid() AND approval_status = 'pending'
);

-- ═══════════════════════════════════════════════════════════
-- COLLABORATORS & ACCESS CODES: Advance owner's org manages
-- ═══════════════════════════════════════════════════════════

CREATE POLICY collaborators_org_all ON advance_collaborators FOR ALL USING (
  advance_id IN (SELECT pa.id FROM production_advances pa WHERE pa.organization_id IN (
    SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'
  ))
);
CREATE POLICY collaborators_self_select ON advance_collaborators FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY access_codes_org ON advance_access_codes FOR ALL USING (
  advance_id IN (SELECT pa.id FROM production_advances pa WHERE pa.organization_id IN (
    SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'
  ))
);
-- Public lookup for joining (limited to code lookup)
CREATE POLICY access_codes_public_select ON advance_access_codes FOR SELECT USING (is_active = true);

-- ═══════════════════════════════════════════════════════════
-- COMMENTS: Filter internal from non-org-members
-- ═══════════════════════════════════════════════════════════

CREATE POLICY comments_org_all ON advance_comments FOR ALL USING (
  advance_id IN (SELECT pa.id FROM production_advances pa WHERE pa.organization_id IN (
    SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'
  ))
);
CREATE POLICY comments_collaborator_select ON advance_comments FOR SELECT USING (
  is_internal = false
  AND advance_id IN (SELECT ac.advance_id FROM advance_collaborators ac WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted')
);

-- ═══════════════════════════════════════════════════════════
-- STATUS HISTORY, TEMPLATES, WEBHOOK EVENTS: Org members only
-- ═══════════════════════════════════════════════════════════

CREATE POLICY status_history_org ON advance_status_history FOR SELECT USING (
  advance_id IN (SELECT pa.id FROM production_advances pa WHERE pa.organization_id IN (
    SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'
  ))
);

CREATE POLICY templates_org ON advance_templates FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);

CREATE POLICY webhook_events_org ON advance_webhook_events FOR ALL USING (
  organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active')
);
