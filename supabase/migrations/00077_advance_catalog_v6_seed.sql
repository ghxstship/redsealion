-- ═══════════════════════════════════════════════════════════
-- Universal Advance Seed Catalog v6.0
-- Replaces prior seed_advance_categories() with the full
-- GHXSTSHIP Industries taxonomy: 8 Collections, 32 Categories,
-- 82 Subcategories, to be populated with 351 catalog items.
-- ═══════════════════════════════════════════════════════════

-- Add weather_rating enum if not exists
DO $$ BEGIN
  CREATE TYPE weather_rating AS ENUM ('indoor_only','sheltered','outdoor_rated','all_weather','not_applicable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────
-- Replace seed function with v6 taxonomy
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION seed_advance_categories(p_org_id UUID) RETURNS VOID AS $$
DECLARE
  -- Collection (group) IDs
  g_site UUID; g_tech UUID; g_hosp UUID; g_fnb UUID;
  g_retail UUID; g_work UUID; g_travel UUID; g_labor UUID;
  -- Category IDs (reused per-category)
  c_id UUID;
BEGIN

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 1: SITE (97 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Site', 'site', 'Site infrastructure, vehicles, equipment, and services', 'MapPin', '#10B981', 1,
    '{"item_count":97}')
  RETURNING id INTO g_site;

  -- Category: Site Assets & Infrastructure (30 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_site, 'Site Assets & Infrastructure', 'site-assets-infrastructure',
    'Fencing, tents, flooring, and portable facilities', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Fencing & Barriers',   'fencing-barriers',   1, '{"cat_code":"INFR","sub_code":"FENC","unspsc":"30191500","item_count":9}'),
    (p_org_id, c_id, 'Tents & Structures',   'tents-structures',   2, '{"cat_code":"INFR","sub_code":"TENT","unspsc":"30181500","item_count":7}'),
    (p_org_id, c_id, 'Flooring & Surfaces',  'flooring-surfaces',  3, '{"cat_code":"INFR","sub_code":"FLOR","unspsc":"30161500","item_count":7}'),
    (p_org_id, c_id, 'Portable Facilities',  'portable-facilities', 4, '{"cat_code":"INFR","sub_code":"PORT","unspsc":"30181600","item_count":7}');

  -- Category: Site Vehicles (14 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_site, 'Site Vehicles', 'site-vehicles',
    'Utility vehicles, trucks, and specialty fleet', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Utility Vehicles',    'utility-vehicles',    1, '{"cat_code":"VEHI","sub_code":"UTIL","unspsc":"25101700","item_count":5}'),
    (p_org_id, c_id, 'Trucks & Transport',  'trucks-transport',    2, '{"cat_code":"VEHI","sub_code":"TRUK","unspsc":"25101500","item_count":6}'),
    (p_org_id, c_id, 'Specialty Vehicles',  'specialty-vehicles',  3, '{"cat_code":"VEHI","sub_code":"SPEC","unspsc":"25101900","item_count":3}');

  -- Category: Heavy Equipment (9 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_site, 'Heavy Equipment', 'heavy-equipment',
    'Aerial lifts, forklifts, and cranes', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Aerial Lifts',        'aerial-lifts',        1, '{"cat_code":"HEQP","sub_code":"AERI","unspsc":"22101500","item_count":4}'),
    (p_org_id, c_id, 'Forklifts & Loaders', 'forklifts-loaders',   2, '{"cat_code":"HEQP","sub_code":"FORK","unspsc":"22101600","item_count":3}'),
    (p_org_id, c_id, 'Cranes',              'cranes',              3, '{"cat_code":"HEQP","sub_code":"CRAN","unspsc":"22101700","item_count":2}');

  -- Category: Site Services (18 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_site, 'Site Services', 'site-services',
    'Power, water, waste, climate, and connectivity', 4) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Power & Electrical',      'power-electrical',      1, '{"cat_code":"SERV","sub_code":"POWR","unspsc":"26111700","item_count":6}'),
    (p_org_id, c_id, 'Water & Plumbing',        'water-plumbing',        2, '{"cat_code":"SERV","sub_code":"WATR","unspsc":"47131600","item_count":2}'),
    (p_org_id, c_id, 'Waste Management',        'waste-management',      3, '{"cat_code":"SERV","sub_code":"WAST","unspsc":"76111500","item_count":4}'),
    (p_org_id, c_id, 'Climate Control',         'climate-control',       4, '{"cat_code":"SERV","sub_code":"CLIM","unspsc":"40101500","item_count":3}'),
    (p_org_id, c_id, 'Internet & Connectivity', 'internet-connectivity', 5, '{"cat_code":"SERV","sub_code":"INET","unspsc":"43222600","item_count":3}');

  -- Category: Site Equipment & Tools (14 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_site, 'Site Equipment & Tools', 'site-equipment-tools',
    'Safety equipment, general tools, and expendables', 5) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Safety Equipment',           'safety-equipment',           1, '{"cat_code":"TOOL","sub_code":"SAFE","unspsc":"46191600","item_count":5}'),
    (p_org_id, c_id, 'General Tools & Hardware',   'general-tools-hardware',     2, '{"cat_code":"TOOL","sub_code":"HDWR","unspsc":"27111500","item_count":5}'),
    (p_org_id, c_id, 'Expendables & Consumables',  'expendables-consumables',    3, '{"cat_code":"TOOL","sub_code":"EXPD","unspsc":"31201500","item_count":4}');

  -- Category: Signage & Wayfinding (12 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_site, 'Signage & Wayfinding', 'signage-wayfinding',
    'Directional, digital, and decorative signage', 6) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Directional Signage',  'directional-signage',  1, '{"cat_code":"SIGN","sub_code":"DIRE","unspsc":"55121700","item_count":7}'),
    (p_org_id, c_id, 'Digital Signage',      'digital-signage',      2, '{"cat_code":"SIGN","sub_code":"DGTL","unspsc":"43211700","item_count":2}'),
    (p_org_id, c_id, 'Scenic & Decorative',  'scenic-decorative',    3, '{"cat_code":"SIGN","sub_code":"SCEN","unspsc":"55101500","item_count":3}');

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 2: TECHNICAL (80 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Technical', 'technical', 'Audio, lighting, video, staging, rigging, and backline', 'Cpu', '#8B5CF6', 2,
    '{"item_count":80}')
  RETURNING id INTO g_tech;

  -- Category: Audio (22 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_tech, 'Audio', 'audio', 'PA systems, DJ equipment, microphones, mixing, and infrastructure', 1)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'PA Systems',            'pa-systems',            1, '{"cat_code":"AUDI","sub_code":"PASY","unspsc":"52161500","item_count":6}'),
    (p_org_id, c_id, 'DJ Equipment',          'dj-equipment',          2, '{"cat_code":"AUDI","sub_code":"DJEQ","unspsc":"52161505","item_count":4}'),
    (p_org_id, c_id, 'Microphones & DI',      'microphones-di',        3, '{"cat_code":"AUDI","sub_code":"MICR","unspsc":"52161512","item_count":5}'),
    (p_org_id, c_id, 'Mixing Consoles',       'mixing-consoles',       4, '{"cat_code":"AUDI","sub_code":"CONS","unspsc":"52161510","item_count":2}'),
    (p_org_id, c_id, 'Audio Infrastructure',  'audio-infrastructure',  5, '{"cat_code":"AUDI","sub_code":"AINF","unspsc":"52161520","item_count":5}');

  -- Category: Lighting (23 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_tech, 'Lighting', 'lighting', 'Automated and static fixtures, atmospheric effects, and control', 2)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Automated Fixtures',   'automated-fixtures',   1, '{"cat_code":"LITE","sub_code":"AUTO","unspsc":"39111600","item_count":5}'),
    (p_org_id, c_id, 'Static Fixtures',      'static-fixtures',      2, '{"cat_code":"LITE","sub_code":"STAT","unspsc":"39111500","item_count":8}'),
    (p_org_id, c_id, 'Atmospheric Effects',  'atmospheric-effects',  3, '{"cat_code":"LITE","sub_code":"ATMO","unspsc":"60141100","item_count":7}'),
    (p_org_id, c_id, 'Lighting Control',     'lighting-control',     4, '{"cat_code":"LITE","sub_code":"CTRL","unspsc":"39112100","item_count":3}');

  -- Category: Video (15 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_tech, 'Video', 'video', 'LED walls, cameras, projection, and playback', 3)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'LED Walls & Displays',  'led-walls-displays',  1, '{"cat_code":"VIDO","sub_code":"LEDW","unspsc":"45111600","item_count":6}'),
    (p_org_id, c_id, 'Cameras & Capture',     'cameras-capture',     2, '{"cat_code":"VIDO","sub_code":"CAMR","unspsc":"45121500","item_count":3}'),
    (p_org_id, c_id, 'Projection',            'projection',          3, '{"cat_code":"VIDO","sub_code":"PROJ","unspsc":"45111612","item_count":4}'),
    (p_org_id, c_id, 'Playback & Processing', 'playback-processing', 4, '{"cat_code":"VIDO","sub_code":"PLAY","unspsc":"45111700","item_count":2}');

  -- Category: Staging (10 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_tech, 'Staging', 'staging', 'Stage decks, risers, and infrastructure', 4)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Stage Decks & Risers',  'stage-decks-risers',  1, '{"cat_code":"STAG","sub_code":"DECK","unspsc":"56101700","item_count":6}'),
    (p_org_id, c_id, 'Stage Infrastructure',   'stage-infrastructure', 2, '{"cat_code":"STAG","sub_code":"SINF","unspsc":"56101800","item_count":4}');

  -- Category: Rigging (8 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_tech, 'Rigging', 'rigging', 'Truss, motors, and rigging hardware', 5)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Truss',                  'truss',                 1, '{"cat_code":"RIGG","sub_code":"TRUS","unspsc":"31162400","item_count":4}'),
    (p_org_id, c_id, 'Motors & Chain Hoists',   'motors-chain-hoists',   2, '{"cat_code":"RIGG","sub_code":"MOTR","unspsc":"24102000","item_count":3}'),
    (p_org_id, c_id, 'Rigging Hardware',        'rigging-hardware',      3, '{"cat_code":"RIGG","sub_code":"RGHW","unspsc":"31162200","item_count":1}');

  -- Category: Backline (9 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_tech, 'Backline', 'backline', 'Amplifiers, keyboards, drums, and misc', 6)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Amplifiers & Cabinets',      'amplifiers-cabinets',      1, '{"cat_code":"BKLN","sub_code":"AMPL","unspsc":"60131100","item_count":2}'),
    (p_org_id, c_id, 'Keyboards & Controllers',    'keyboards-controllers',    2, '{"cat_code":"BKLN","sub_code":"KEYS","unspsc":"60131200","item_count":2}'),
    (p_org_id, c_id, 'Drum Kits',                  'drum-kits',                3, '{"cat_code":"BKLN","sub_code":"DRUM","unspsc":"60131300","item_count":2}'),
    (p_org_id, c_id, 'Miscellaneous Backline',     'miscellaneous-backline',   4, '{"cat_code":"BKLN","sub_code":"MISC","unspsc":"60131400","item_count":3}');

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 3: HOSPITALITY (20 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Hospitality', 'hospitality', 'Catering, green room, artist hospitality, and amenities', 'UtensilsCrossed', '#EC4899', 3,
    '{"item_count":20}')
  RETURNING id INTO g_hosp;

  -- Category: Catering (9 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_hosp, 'Catering', 'catering', 'Artist, crew, and VIP catering services', 1)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Artist & Crew Catering', 'artist-crew-catering', 1, '{"cat_code":"CATR","sub_code":"ARTC","unspsc":"90101600","item_count":5}'),
    (p_org_id, c_id, 'Guest & VIP Catering',   'guest-vip-catering',   2, '{"cat_code":"CATR","sub_code":"VIPC","unspsc":"90101700","item_count":4}');

  -- Category: Green Room & Hospitality (11 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_hosp, 'Green Room & Hospitality', 'green-room-hospitality',
    'Artist hospitality, VIP lounges, and amenities', 2)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Artist Hospitality',    'artist-hospitality',    1, '{"cat_code":"GRHP","sub_code":"ARTH","unspsc":"90101800","item_count":4}'),
    (p_org_id, c_id, 'VIP & Lounge',          'vip-lounge',            2, '{"cat_code":"GRHP","sub_code":"VIPL","unspsc":"90101900","item_count":3}'),
    (p_org_id, c_id, 'Amenities & Services',  'amenities-services',    3, '{"cat_code":"GRHP","sub_code":"AMEN","unspsc":"90102000","item_count":4}');

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 4: FOOD & BEVERAGE (22 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Food & Beverage', 'food-beverage', 'Bar, restaurant, kitchen, and concessions equipment', 'Wine', '#F59E0B', 4,
    '{"item_count":22}')
  RETURNING id INTO g_fnb;

  -- Category: Bar (8 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_fnb, 'Bar', 'bar', 'Bar equipment and consumables', 1)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Bar Equipment',    'bar-equipment',    1, '{"cat_code":"BARR","sub_code":"BEQP","unspsc":"48101500","item_count":5}'),
    (p_org_id, c_id, 'Bar Consumables',  'bar-consumables',  2, '{"cat_code":"BARR","sub_code":"BCON","unspsc":"48101600","item_count":3}');

  -- Category: Restaurant (5 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_fnb, 'Restaurant', 'restaurant', 'Service equipment for dining', 2)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Service Equipment', 'service-equipment', 1, '{"cat_code":"REST","sub_code":"SEQP","unspsc":"48101700","item_count":5}');

  -- Category: Kitchen (9 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_fnb, 'Kitchen', 'kitchen', 'Commercial kitchen equipment and concessions', 3)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Kitchen Equipment',     'kitchen-equipment',     1, '{"cat_code":"KTCH","sub_code":"KEQP","unspsc":"48101800","item_count":6}'),
    (p_org_id, c_id, 'Concessions & Carts',   'concessions-carts',     2, '{"cat_code":"KTCH","sub_code":"CART","unspsc":"48101900","item_count":3}');

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 5: RETAIL (14 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Retail', 'retail', 'Merchandise, POS, and vendor marketplace infrastructure', 'ShoppingBag', '#F97316', 5,
    '{"item_count":14}')
  RETURNING id INTO g_retail;

  -- Category: Merchandise (11 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_retail, 'Merchandise', 'merchandise', 'Display fixtures, POS, and packaging', 1)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Display & Fixtures',    'display-fixtures',      1, '{"cat_code":"MRCH","sub_code":"DISP","unspsc":"52141500","item_count":6}'),
    (p_org_id, c_id, 'POS & Technology',      'pos-technology',        2, '{"cat_code":"MRCH","sub_code":"POST","unspsc":"52161600","item_count":3}'),
    (p_org_id, c_id, 'Packaging & Supplies',  'packaging-supplies',    3, '{"cat_code":"MRCH","sub_code":"PACK","unspsc":"55121500","item_count":2}');

  -- Category: Vendor Marketplace (3 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_retail, 'Vendor Marketplace', 'vendor-marketplace', 'Vendor infrastructure and activation spaces', 2)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Vendor Infrastructure', 'vendor-infrastructure', 1, '{"cat_code":"VMKT","sub_code":"VINF","unspsc":"80141600","item_count":3}');

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 6: WORKPLACE (40 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Workplace', 'workplace', 'Access, communications, uniforms, furnishings, and safety', 'Building2', '#3B82F6', 6,
    '{"item_count":40}')
  RETURNING id INTO g_work;

  -- Category: Access & Credentials (7 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_work, 'Access & Credentials', 'access-credentials',
    'Credentials, access control, and security screening', 1)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Credentials',     'credentials',     1, '{"cat_code":"ACCS","sub_code":"CRED","unspsc":"44103100","item_count":3}'),
    (p_org_id, c_id, 'Access Control',  'access-control',  2, '{"cat_code":"ACCS","sub_code":"ACTC","unspsc":"46171600","item_count":4}');

  -- Category: Radio & Communications (6 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_work, 'Radio & Communications', 'radio-communications',
    'Two-way radios and intercom systems', 2)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Two-Way Radios', 'two-way-radios', 1, '{"cat_code":"COMM","sub_code":"RDIO","unspsc":"43191500","item_count":4}'),
    (p_org_id, c_id, 'Intercoms',      'intercoms',      2, '{"cat_code":"COMM","sub_code":"INTC","unspsc":"43191600","item_count":2}');

  -- Category: Uniforms (5 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_work, 'Uniforms', 'uniforms', 'Staff apparel and rain gear', 3)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Staff Apparel', 'staff-apparel', 1, '{"cat_code":"UNIF","sub_code":"APRL","unspsc":"53101500","item_count":5}');

  -- Category: Furnishings (11 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_work, 'Furnishings', 'furnishings', 'Tables, chairs, office, and lounge furniture', 4)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Office & Production', 'office-production', 1, '{"cat_code":"FURN","sub_code":"OFFC","unspsc":"56101500","item_count":8}'),
    (p_org_id, c_id, 'Lounge & VIP',       'lounge-vip',       2, '{"cat_code":"FURN","sub_code":"LNGE","unspsc":"56101600","item_count":3}');

  -- Category: Health & Safety (9 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_work, 'Health & Safety', 'health-safety', 'Medical, PPE, and security systems', 5)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Medical',           'medical',           1, '{"cat_code":"HLTH","sub_code":"MEDL","unspsc":"85121800","item_count":3}'),
    (p_org_id, c_id, 'PPE',               'ppe',               2, '{"cat_code":"HLTH","sub_code":"PPEE","unspsc":"46181500","item_count":4}'),
    (p_org_id, c_id, 'Security Systems',  'security-systems',  3, '{"cat_code":"HLTH","sub_code":"SECU","unspsc":"46171500","item_count":2}');

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 7: TRAVEL & ACCOMMODATIONS (25 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Travel & Accommodations', 'travel', 'Airfare, lodging, transportation, and rental vehicles', 'Plane', '#6366F1', 7,
    '{"item_count":25}')
  RETURNING id INTO g_travel;

  -- Category: Airfare (6 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_travel, 'Airfare', 'airfare', 'Flights and charter services', 1)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Flights', 'flights', 1, '{"cat_code":"AIRF","sub_code":"FLIT","unspsc":"78111500","item_count":6}');

  -- Category: Lodging (5 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_travel, 'Lodging', 'lodging', 'Hotels and alternative accommodation', 2)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Hotels',              'hotels',              1, '{"cat_code":"LODG","sub_code":"HOTL","unspsc":"90111500","item_count":3}'),
    (p_org_id, c_id, 'Alternative Lodging', 'alternative-lodging', 2, '{"cat_code":"LODG","sub_code":"ALTL","unspsc":"90111600","item_count":2}');

  -- Category: Transportation (7 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_travel, 'Transportation', 'transportation', 'Ground and water transport', 3)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Ground Transport', 'ground-transport', 1, '{"cat_code":"TRNS","sub_code":"GRND","unspsc":"78111800","item_count":6}'),
    (p_org_id, c_id, 'Water Transport',  'water-transport',  2, '{"cat_code":"TRNS","sub_code":"WTRT","unspsc":"78111900","item_count":1}');

  -- Category: Rental Vehicles (7 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_travel, 'Rental Vehicles', 'rental-vehicles', 'Car, truck, and specialty rental', 4)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Cars & Trucks',      'cars-trucks',      1, '{"cat_code":"RENT","sub_code":"CARS","unspsc":"78111600","item_count":4}'),
    (p_org_id, c_id, 'Specialty Rentals',   'specialty-rentals', 2, '{"cat_code":"RENT","sub_code":"SPCR","unspsc":"78111700","item_count":3}');

  -- ══════════════════════════════════════════════════════════
  -- COLLECTION 8: LABOR (48 items)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order, metadata)
  VALUES (p_org_id, 'Labor', 'labor', 'Production management, operators, skilled labor, and general staff', 'HardHat', '#EF4444', 8,
    '{"item_count":48}')
  RETURNING id INTO g_labor;

  -- Category: Leadership (12 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_labor, 'Leadership', 'leadership', 'Production management and department heads', 1)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Production Management', 'production-management', 1, '{"cat_code":"LEAD","sub_code":"PMGT","unspsc":"80111600","item_count":5}'),
    (p_org_id, c_id, 'Department Heads',      'department-heads',      2, '{"cat_code":"LEAD","sub_code":"DEPT","unspsc":"80111700","item_count":7}');

  -- Category: Heavy Equipment Operators (4 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_labor, 'Heavy Equipment Operators', 'heavy-equipment-operators',
    'Certified equipment operators', 2)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Certified Operators', 'certified-operators', 1, '{"cat_code":"OPER","sub_code":"CERT","unspsc":"80111800","item_count":4}');

  -- Category: Skilled Labor (13 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_labor, 'Skilled Labor', 'skilled-labor', 'Technical crew and creative specialists', 3)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Technical Crew',       'technical-crew',       1, '{"cat_code":"SKIL","sub_code":"TCRE","unspsc":"80111900","item_count":7}'),
    (p_org_id, c_id, 'Creative & Specialty', 'creative-specialty',   2, '{"cat_code":"SKIL","sub_code":"CREA","unspsc":"80112000","item_count":6}');

  -- Category: General Labor (19 items)
  INSERT INTO advance_categories (organization_id, group_id, name, slug, description, sort_order)
  VALUES (p_org_id, g_labor, 'General Labor', 'general-labor', 'Stagehands, event staff, and specialty personnel', 4)
  RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order, metadata) VALUES
    (p_org_id, c_id, 'Stagehands',      'stagehands',      1, '{"cat_code":"GENL","sub_code":"HAND","unspsc":"80111500","item_count":2}'),
    (p_org_id, c_id, 'Event Staff',     'event-staff',     2, '{"cat_code":"GENL","sub_code":"EVST","unspsc":"80111501","item_count":8}'),
    (p_org_id, c_id, 'Specialty Staff', 'specialty-staff', 3, '{"cat_code":"GENL","sub_code":"SPST","unspsc":"80111502","item_count":9}');

END;
$$ LANGUAGE plpgsql;
