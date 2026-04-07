-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 2: Category Hierarchy
-- Groups → Categories → Subcategories + Seed Data
-- ═══════════════════════════════════════════════════════════

CREATE TABLE advance_category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color_hex VARCHAR(7),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE advance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES advance_category_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, group_id, slug)
);

CREATE TABLE advance_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES advance_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, category_id, slug)
);

-- Indexes
CREATE INDEX idx_category_groups_org ON advance_category_groups(organization_id);
CREATE INDEX idx_categories_group ON advance_categories(group_id);
CREATE INDEX idx_subcategories_category ON advance_subcategories(category_id);

-- ═══════════════════════════════════════════════════════════
-- SEED: Universal Advance Catalog — 8 Groups, 24 Categories, 94 Subcategories
-- Seed data is inserted per-org via a function.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION seed_advance_categories(p_org_id UUID) RETURNS VOID AS $$
DECLARE
  g_audio UUID; g_video UUID; g_lighting UUID; g_staging UUID;
  g_power UUID; g_hospitality UUID; g_labor UUID; g_logistics UUID;
  c_id UUID;
BEGIN
  -- ══════════ GROUP 1: AUDIO ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Audio', 'audio', 'Sound reinforcement, playback, and communications', 'Volume2', '#3B82F6', 1)
  RETURNING id INTO g_audio;

  -- Category: PA Systems
  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_audio, 'PA Systems', 'pa-systems', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Line Arrays', 'line-arrays', 1),
    (p_org_id, c_id, 'Point Source', 'point-source', 2),
    (p_org_id, c_id, 'Subwoofers', 'subwoofers', 3),
    (p_org_id, c_id, 'Monitors', 'monitors', 4),
    (p_org_id, c_id, 'Delay Systems', 'delay-systems', 5);

  -- Category: Mixing & Processing
  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_audio, 'Mixing & Processing', 'mixing-processing', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Consoles', 'consoles', 1),
    (p_org_id, c_id, 'Stage Boxes', 'stage-boxes', 2),
    (p_org_id, c_id, 'Signal Processing', 'signal-processing', 3),
    (p_org_id, c_id, 'Wireless Systems', 'wireless-systems', 4);

  -- Category: Playback & Recording
  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_audio, 'Playback & Recording', 'playback-recording', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Media Servers', 'media-servers', 1),
    (p_org_id, c_id, 'Playback Rigs', 'playback-rigs', 2),
    (p_org_id, c_id, 'Recording Systems', 'recording-systems', 3);

  -- ══════════ GROUP 2: VIDEO ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Video', 'video', 'LED, projection, cameras, and switching', 'Monitor', '#8B5CF6', 2)
  RETURNING id INTO g_video;

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_video, 'LED & Displays', 'led-displays', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Indoor LED', 'indoor-led', 1),
    (p_org_id, c_id, 'Outdoor LED', 'outdoor-led', 2),
    (p_org_id, c_id, 'LED Processors', 'led-processors', 3),
    (p_org_id, c_id, 'Monitors & TVs', 'monitors-tvs', 4);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_video, 'Projection', 'projection', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Projectors', 'projectors', 1),
    (p_org_id, c_id, 'Screens & Surfaces', 'screens-surfaces', 2),
    (p_org_id, c_id, 'Projection Mapping', 'projection-mapping', 3);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_video, 'Cameras & Switching', 'cameras-switching', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Cameras', 'cameras', 1),
    (p_org_id, c_id, 'Video Switchers', 'video-switchers', 2),
    (p_org_id, c_id, 'Streaming', 'streaming', 3);

  -- ══════════ GROUP 3: LIGHTING ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Lighting', 'lighting', 'Fixtures, control, rigging, and effects', 'Lightbulb', '#F59E0B', 3)
  RETURNING id INTO g_lighting;

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_lighting, 'Fixtures', 'fixtures', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Moving Heads', 'moving-heads', 1),
    (p_org_id, c_id, 'LED Wash', 'led-wash', 2),
    (p_org_id, c_id, 'Spots & Profiles', 'spots-profiles', 3),
    (p_org_id, c_id, 'Strobes & Blinders', 'strobes-blinders', 4),
    (p_org_id, c_id, 'Followspots', 'followspots', 5);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_lighting, 'Control', 'lighting-control', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Consoles', 'lighting-consoles', 1),
    (p_org_id, c_id, 'DMX Distribution', 'dmx-distribution', 2),
    (p_org_id, c_id, 'Dimmers & Power', 'dimmers-power', 3);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_lighting, 'Effects', 'lighting-effects', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Haze & Fog', 'haze-fog', 1),
    (p_org_id, c_id, 'Lasers', 'lasers', 2),
    (p_org_id, c_id, 'Pyro & CO2', 'pyro-co2', 3);

  -- ══════════ GROUP 4: STAGING & STRUCTURES ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Staging & Structures', 'staging', 'Stages, truss, rigging, and scenic elements', 'Building2', '#10B981', 4)
  RETURNING id INTO g_staging;

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_staging, 'Staging', 'stages', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Stage Decks', 'stage-decks', 1),
    (p_org_id, c_id, 'Risers', 'risers', 2),
    (p_org_id, c_id, 'Barricade', 'barricade', 3),
    (p_org_id, c_id, 'Ramps & Stairs', 'ramps-stairs', 4);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_staging, 'Truss & Rigging', 'truss-rigging', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Truss', 'truss', 1),
    (p_org_id, c_id, 'Chain Hoists', 'chain-hoists', 2),
    (p_org_id, c_id, 'Ground Support', 'ground-support', 3),
    (p_org_id, c_id, 'Hardware', 'rigging-hardware', 4);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_staging, 'Scenic & Fabrication', 'scenic-fabrication', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Custom Scenic', 'custom-scenic', 1),
    (p_org_id, c_id, 'Drape & Soft Goods', 'drape-soft-goods', 2),
    (p_org_id, c_id, 'Signage', 'signage', 3);

  -- ══════════ GROUP 5: POWER & ELECTRICAL ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Power & Electrical', 'power', 'Generators, distro, cabling, and comms', 'Zap', '#EF4444', 5)
  RETURNING id INTO g_power;

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_power, 'Power Generation', 'power-generation', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Generators', 'generators', 1),
    (p_org_id, c_id, 'Battery Systems', 'battery-systems', 2);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_power, 'Distribution', 'power-distribution', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Distro Panels', 'distro-panels', 1),
    (p_org_id, c_id, 'Cable & Connectors', 'cable-connectors', 2),
    (p_org_id, c_id, 'UPS & Conditioning', 'ups-conditioning', 3);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_power, 'Communications', 'communications', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Radios', 'radios', 1),
    (p_org_id, c_id, 'Intercom', 'intercom', 2),
    (p_org_id, c_id, 'Network & Wi-Fi', 'network-wifi', 3);

  -- ══════════ GROUP 6: HOSPITALITY & ACCESS ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Hospitality & Access', 'hospitality', 'Catering, credentials, facilities, and security', 'UtensilsCrossed', '#EC4899', 6)
  RETURNING id INTO g_hospitality;

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_hospitality, 'Catering', 'catering', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Meals', 'meals', 1),
    (p_org_id, c_id, 'Beverages', 'beverages', 2),
    (p_org_id, c_id, 'Craft Services', 'craft-services', 3);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_hospitality, 'Credentials & Access', 'credentials-access', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Badges & Laminates', 'badges-laminates', 1),
    (p_org_id, c_id, 'Wristbands', 'wristbands', 2),
    (p_org_id, c_id, 'Parking Passes', 'parking-passes', 3);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_hospitality, 'Facilities', 'facilities', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Tents & Canopies', 'tents-canopies', 1),
    (p_org_id, c_id, 'Tables & Chairs', 'tables-chairs', 2),
    (p_org_id, c_id, 'Restrooms', 'restrooms', 3),
    (p_org_id, c_id, 'Climate Control', 'climate-control', 4);

  -- ══════════ GROUP 7: LABOR & CREW ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Labor & Crew', 'labor', 'Stagehands, technicians, operators, and specialists', 'HardHat', '#F97316', 7)
  RETURNING id INTO g_labor;

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_labor, 'Stagehands', 'stagehands', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Load In / Load Out', 'load-in-out', 1),
    (p_org_id, c_id, 'Running Crew', 'running-crew', 2),
    (p_org_id, c_id, 'Riggers', 'riggers', 3);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_labor, 'Technicians', 'technicians', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Audio Engineers', 'audio-engineers', 1),
    (p_org_id, c_id, 'Lighting Designers', 'lighting-designers', 2),
    (p_org_id, c_id, 'Video Engineers', 'video-engineers', 3),
    (p_org_id, c_id, 'Stage Managers', 'stage-managers', 4);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_labor, 'Specialists', 'specialists', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Carpenters', 'carpenters', 1),
    (p_org_id, c_id, 'Electricians', 'electricians', 2),
    (p_org_id, c_id, 'Welders', 'welders', 3);

  -- ══════════ GROUP 8: LOGISTICS & TRANSPORT ══════════
  INSERT INTO advance_category_groups (organization_id, name, slug, description, icon, color_hex, sort_order)
  VALUES (p_org_id, 'Logistics & Transport', 'logistics', 'Vehicles, freight, storage, and site services', 'Truck', '#6366F1', 8)
  RETURNING id INTO g_logistics;

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_logistics, 'Vehicles', 'vehicles', 1) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Box Trucks', 'box-trucks', 1),
    (p_org_id, c_id, 'Flatbeds', 'flatbeds', 2),
    (p_org_id, c_id, 'Vans & Sprinters', 'vans-sprinters', 3),
    (p_org_id, c_id, 'Forklifts & Lifts', 'forklifts-lifts', 4);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_logistics, 'Freight & Shipping', 'freight-shipping', 2) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Ground Freight', 'ground-freight', 1),
    (p_org_id, c_id, 'Air Freight', 'air-freight', 2),
    (p_org_id, c_id, 'Drayage', 'drayage', 3);

  INSERT INTO advance_categories (organization_id, group_id, name, slug, sort_order)
  VALUES (p_org_id, g_logistics, 'Site Services', 'site-services', 3) RETURNING id INTO c_id;
  INSERT INTO advance_subcategories (organization_id, category_id, name, slug, sort_order) VALUES
    (p_org_id, c_id, 'Waste Management', 'waste-management', 1),
    (p_org_id, c_id, 'Cleaning', 'cleaning', 2),
    (p_org_id, c_id, 'Security', 'security', 3);

END;
$$ LANGUAGE plpgsql;
