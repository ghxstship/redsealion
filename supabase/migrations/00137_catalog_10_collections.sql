-- =============================================================================
-- Migration 00137: Catalog Expansion — 10 Collection Groups
-- =============================================================================
-- Expands the Universal Advance Seed Catalog from 8 to 10 Collection Groups.
-- Adds:
--   Collection 3: Scenic Fabrication (6 categories, 18 subcategories)
--   Collection 10: Permits, Legal & Compliance (6 categories, 18 subcategories)
--
-- These are required by the Atomic Production System spec for full service
-- vertical integration. The existing seed_advance_categories() function is
-- NOT modified — these are additive inserts via a new seeder function.
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_advance_categories_v7_expansion(p_org_id UUID) RETURNS VOID AS $$
DECLARE
  g_scenic UUID;
  g_compliance UUID;
  c_id UUID;
BEGIN

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 3: SCENIC FABRICATION
  -- Custom structures, scenic panels, props, dimensional signage,
  -- surface finishing, and modular build systems.
  -- Spec color: #FF6B35
  -- ══════════════════════════════════════════════════════════

  -- Check if already seeded
  IF EXISTS (
    SELECT 1 FROM advance_category_groups
    WHERE organization_id = p_org_id AND slug = 'scenic'
  ) THEN
    -- Already exists, skip
    NULL;
  ELSE
    INSERT INTO advance_category_groups (
      organization_id, name, slug, description, icon, color_hex, sort_order, metadata
    ) VALUES (
      p_org_id, 'Scenic Fabrication', 'scenic',
      'Custom structures, scenic panels, props, dimensional signage, surface finishing, and modular build systems',
      'Hammer', '#FF6B35', 3,
      '{"item_count": 0}'
    ) RETURNING id INTO g_scenic;

    -- Category 1: Custom Structures & Facades
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_scenic, 'Custom Structures & Facades', 'custom-structures-facades',
      'Bespoke structural elements and architectural facades', 1) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Steel Structures',         'steel-structures',         1, '{"cat_code":"SCEN","sub_code":"STST"}'),
      (p_org_id, c_id, 'Wood Framing',             'wood-framing',             2, '{"cat_code":"SCEN","sub_code":"WOOD"}'),
      (p_org_id, c_id, 'Architectural Facades',    'architectural-facades',    3, '{"cat_code":"SCEN","sub_code":"FACD"}');

    -- Category 2: Scenic Panels & Walls
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_scenic, 'Scenic Panels & Walls', 'scenic-panels-walls',
      'Flat scenic elements, backdrops, and wall treatments', 2) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Hard Flats',               'hard-flats',               1, '{"cat_code":"SCEN","sub_code":"HRDF"}'),
      (p_org_id, c_id, 'Soft Goods & Backdrops',   'soft-goods-backdrops',     2, '{"cat_code":"SCEN","sub_code":"SFGD"}'),
      (p_org_id, c_id, 'Wall Treatments',          'wall-treatments',          3, '{"cat_code":"SCEN","sub_code":"WALL"}');

    -- Category 3: Props & Dimensional Décor
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_scenic, 'Props & Dimensional Décor', 'props-dimensional-decor',
      '3D scenic elements, props, and decorative installations', 3) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Props & Set Dressing',     'props-set-dressing',       1, '{"cat_code":"SCEN","sub_code":"PROP"}'),
      (p_org_id, c_id, 'Sculptural Elements',      'sculptural-elements',      2, '{"cat_code":"SCEN","sub_code":"SCUL"}'),
      (p_org_id, c_id, 'Floral & Organic',         'floral-organic',           3, '{"cat_code":"SCEN","sub_code":"FLOR"}');

    -- Category 4: Dimensional Signage & Logos
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_scenic, 'Dimensional Signage & Logos', 'dimensional-signage-logos',
      '3D letters, logo builds, and branded scenic elements', 4) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, '3D Letters & Logos',        '3d-letters-logos',         1, '{"cat_code":"SCEN","sub_code":"3DLG"}'),
      (p_org_id, c_id, 'Channel Letters',           'channel-letters',          2, '{"cat_code":"SCEN","sub_code":"CHNL"}'),
      (p_org_id, c_id, 'Monument Signs',            'monument-signs',           3, '{"cat_code":"SCEN","sub_code":"MNMT"}');

    -- Category 5: Surface Finishing & Wraps
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_scenic, 'Surface Finishing & Wraps', 'surface-finishing-wraps',
      'Paint, vinyl wraps, laminates, and texture applications', 5) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Paint & Coatings',          'paint-coatings',           1, '{"cat_code":"SCEN","sub_code":"PANT"}'),
      (p_org_id, c_id, 'Vinyl Wraps & Graphics',    'vinyl-wraps-graphics',     2, '{"cat_code":"SCEN","sub_code":"VNYL"}'),
      (p_org_id, c_id, 'Laminates & Textures',      'laminates-textures',       3, '{"cat_code":"SCEN","sub_code":"LMNT"}');

    -- Category 6: Modular Build Systems
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_scenic, 'Modular Build Systems', 'modular-build-systems',
      'Reusable modular scenic platforms and frameworks', 6) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Modular Platforms',          'modular-platforms',        1, '{"cat_code":"SCEN","sub_code":"MODP"}'),
      (p_org_id, c_id, 'Framework Systems',          'framework-systems',        2, '{"cat_code":"SCEN","sub_code":"FRMW"}'),
      (p_org_id, c_id, 'Quick-Connect Panels',       'quick-connect-panels',     3, '{"cat_code":"SCEN","sub_code":"QKPN"}');
  END IF;


  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 10: PERMITS, LEGAL & COMPLIANCE
  -- Municipal permits, alcohol/food licensing, insurance,
  -- public safety plans, ADA, environmental/sustainability.
  -- Spec color: #8B572A
  -- ══════════════════════════════════════════════════════════

  IF EXISTS (
    SELECT 1 FROM advance_category_groups
    WHERE organization_id = p_org_id AND slug = 'compliance'
  ) THEN
    NULL;
  ELSE
    INSERT INTO advance_category_groups (
      organization_id, name, slug, description, icon, color_hex, sort_order, metadata
    ) VALUES (
      p_org_id, 'Permits, Legal & Compliance', 'compliance',
      'Municipal permits, licensing, insurance, public safety, ADA, and environmental compliance',
      'Scale', '#8B572A', 10,
      '{"item_count": 0}'
    ) RETURNING id INTO g_compliance;

    -- Category 1: Municipal Permits & Licensing
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_compliance, 'Municipal Permits & Licensing', 'municipal-permits-licensing',
      'City/county permits, road closures, noise variances', 1) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Event Permits',            'event-permits',            1, '{"cat_code":"CMPL","sub_code":"EVPR"}'),
      (p_org_id, c_id, 'Road & Street Closures',   'road-street-closures',     2, '{"cat_code":"CMPL","sub_code":"ROAD"}'),
      (p_org_id, c_id, 'Noise Variances',          'noise-variances',          3, '{"cat_code":"CMPL","sub_code":"NOIS"}');

    -- Category 2: Alcohol & Food Licensing
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_compliance, 'Alcohol & Food Licensing', 'alcohol-food-licensing',
      'Liquor licenses, food handler permits, health inspections', 2) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Liquor Licenses',          'liquor-licenses',          1, '{"cat_code":"CMPL","sub_code":"LIQR"}'),
      (p_org_id, c_id, 'Food Permits',             'food-permits',             2, '{"cat_code":"CMPL","sub_code":"FOOD"}'),
      (p_org_id, c_id, 'Health Inspections',        'health-inspections',       3, '{"cat_code":"CMPL","sub_code":"HLTH"}');

    -- Category 3: Insurance & Liability
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_compliance, 'Insurance & Liability', 'insurance-liability',
      'General liability, workers comp, COIs, waivers', 3) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'General Liability',         'general-liability',        1, '{"cat_code":"CMPL","sub_code":"GLIB"}'),
      (p_org_id, c_id, 'Workers Compensation',      'workers-compensation',     2, '{"cat_code":"CMPL","sub_code":"WKCP"}'),
      (p_org_id, c_id, 'Certificates & Waivers',    'certificates-waivers',     3, '{"cat_code":"CMPL","sub_code":"CERT"}');

    -- Category 4: Public Safety Plans
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_compliance, 'Public Safety Plans', 'public-safety-plans',
      'Emergency action plans, crowd management, fire safety', 4) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Emergency Action Plans',    'emergency-action-plans',   1, '{"cat_code":"CMPL","sub_code":"EMRG"}'),
      (p_org_id, c_id, 'Crowd Management',          'crowd-management',         2, '{"cat_code":"CMPL","sub_code":"CRWD"}'),
      (p_org_id, c_id, 'Fire Safety & Egress',      'fire-safety-egress',       3, '{"cat_code":"CMPL","sub_code":"FIRE"}');

    -- Category 5: ADA & Accessibility
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_compliance, 'ADA & Accessibility', 'ada-accessibility',
      'ADA compliance, accessible infrastructure, interpreter services', 5) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'ADA Infrastructure',        'ada-infrastructure',       1, '{"cat_code":"CMPL","sub_code":"ADAI"}'),
      (p_org_id, c_id, 'Accessible Seating',        'accessible-seating',       2, '{"cat_code":"CMPL","sub_code":"ASEA"}'),
      (p_org_id, c_id, 'Interpreter & Captioning',  'interpreter-captioning',   3, '{"cat_code":"CMPL","sub_code":"INTR"}');

    -- Category 6: Environmental & Sustainability
    INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
    VALUES (p_org_id, g_compliance, 'Environmental & Sustainability', 'environmental-sustainability',
      'Waste diversion, carbon offsets, green certifications', 6) RETURNING id INTO c_id;
    INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
      (p_org_id, c_id, 'Waste Diversion Plans',     'waste-diversion-plans',    1, '{"cat_code":"CMPL","sub_code":"WDVR"}'),
      (p_org_id, c_id, 'Carbon Offsets',             'carbon-offsets',           2, '{"cat_code":"CMPL","sub_code":"CRBN"}'),
      (p_org_id, c_id, 'Green Certifications',       'green-certifications',     3, '{"cat_code":"CMPL","sub_code":"GRCR"}');
  END IF;

END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════════════
-- Re-order existing collections to match the 10-collection spec
-- ═══════════════════════════════════════════════════════════════════════════════
-- Spec order: site(1), technical(2), scenic(3), hospitality(4), food-beverage(5),
--             retail(6), workplace(7), travel(8), labor(9), compliance(10)

UPDATE advance_category_groups SET sort_order = 1  WHERE slug = 'site';
UPDATE advance_category_groups SET sort_order = 2  WHERE slug = 'technical';
-- scenic is inserted at sort_order = 3 above
UPDATE advance_category_groups SET sort_order = 4  WHERE slug = 'hospitality';
UPDATE advance_category_groups SET sort_order = 5  WHERE slug = 'food-beverage';
UPDATE advance_category_groups SET sort_order = 6  WHERE slug = 'retail';
UPDATE advance_category_groups SET sort_order = 7  WHERE slug = 'workplace';
UPDATE advance_category_groups SET sort_order = 8  WHERE slug = 'travel';
UPDATE advance_category_groups SET sort_order = 9  WHERE slug = 'labor';
-- compliance is inserted at sort_order = 10 above
