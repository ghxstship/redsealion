-- Migration: 00144_advance_catalog_item_fitment.sql

CREATE TABLE IF NOT EXISTS advance_fitment_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_type TEXT NOT NULL CHECK (dimension_type IN (
    'venue_type',
    'event_scale',
    'environment',
    'budget_tier',
    'use_case',
    'power_class',
    'control_protocol',
    'regulatory',
    'logistics'
  )),
  dimension_value TEXT NOT NULL,
  display_label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  applicable_collections TEXT[] DEFAULT '{}',

  UNIQUE(dimension_type, dimension_value)
);

INSERT INTO advance_fitment_dimensions
  (dimension_type, dimension_value, display_label, sort_order, description, applicable_collections)
VALUES
  ('venue_type','arena','Arena / Stadium',10,'10K+ capacity venue','{}'),
  ('venue_type','theater','Theater / Performing Arts',20,'Proscenium or thrust stage','{}'),
  ('venue_type','club','Club / Nightlife',30,'Indoor nightclub or lounge','{}'),
  ('venue_type','ballroom','Ballroom / Hotel',40,'Hotel ballroom or conference center','{}'),
  ('venue_type','outdoor_festival','Outdoor Festival',50,'Open-air festival grounds','{}'),
  ('venue_type','rooftop','Rooftop / Terrace',60,'Elevated outdoor, partial exposure','{}'),
  ('venue_type','warehouse','Warehouse / Industrial',70,'Raw industrial, high ceilings','{}'),
  ('venue_type','container','Container / Speakeasy',80,'Intimate converted container','{}'),
  ('venue_type','broadcast_studio','Broadcast / Film Studio',90,'Controlled studio, camera-critical','{}'),
  ('venue_type','corporate','Corporate / Convention',100,'Convention center or corporate space','{}'),
  ('venue_type','theme_park','Theme Park / Attraction',110,'Permanent or semi-permanent install','{}'),
  ('venue_type','cruise','Cruise / Maritime',120,'Marine environment, salt air','{}'),
  ('venue_type','private_residence','Private Residence',130,'Home or estate event','{}'),
  ('venue_type','public_park','Public Park / Municipal',140,'Permitted public space','{}'),

  ('event_scale','intimate','Intimate (<500)',10,'Private events, activations','{}'),
  ('event_scale','mid','Mid-Size (500–5K)',20,'Club shows, brand activations, galas','{}'),
  ('event_scale','large','Large (5K–25K)',30,'Arena shows, large festivals','{}'),
  ('event_scale','festival','Festival (25K+)',40,'Major festival main stages, tours','{}'),

  ('environment','indoor_controlled','Indoor Controlled',10,'Climate controlled, no weather','{}'),
  ('environment','indoor_open','Indoor Open-Air',20,'Covered but not sealed','{}'),
  ('environment','outdoor_covered','Outdoor Covered',30,'Tent, canopy, or roof','{}'),
  ('environment','outdoor_exposed','Outdoor Exposed',40,'Fully exposed to weather','{}'),

  ('budget_tier','economy','Economy',10,'Budget-conscious','{}'),
  ('budget_tier','mid_range','Mid-Range',20,'Professional quality','{}'),
  ('budget_tier','premium','Premium',30,'Top-tier, touring-grade','{}'),
  ('budget_tier','flagship','Flagship',40,'Best-in-class, no constraint','{}'),

  ('use_case','festival_main_stage','Festival Main Stage',10,'High-output, weather-rated','{}'),
  ('use_case','concert_touring','Concert Touring',20,'Road-ready, fast setup','{}'),
  ('use_case','broadcast','Broadcast / Film',30,'Flicker-free, high CRI, silent','{}'),
  ('use_case','corporate','Corporate / Brand Activation',40,'Clean, professional, versatile','{}'),
  ('use_case','edm_immersive','EDM / Immersive',50,'Pixel effects, strobes','{}'),
  ('use_case','theater','Theater / Performing Arts',60,'Precise, quiet, framing control','{}'),
  ('use_case','speakeasy','Speakeasy / Intimate',70,'Low-profile, ambient, battery','{}'),
  ('use_case','architectural','Architectural / Install',80,'Permanent, IP-rated','{}'),
  ('use_case','awards_gala','Awards / Gala',90,'Camera-ready, elegant','{}'),
  ('use_case','pop_up','Pop-Up / Activation',100,'Quick deploy, self-contained','{}'),
  ('use_case','f1_tentpole','F1 / Tentpole Event',110,'High-security, premium, branded','{}'),

  ('power_class','battery','Battery Powered',10,'No AC required','{"TECH","SITE"}'),
  ('power_class','low','Low Power (<300W)',20,'Standard circuit','{"TECH"}'),
  ('power_class','mid','Mid Power (300–700W)',30,'Dedicated circuit','{"TECH"}'),
  ('power_class','high','High Power (700W+)',40,'Distro planning required','{"TECH","SITE"}'),

  ('control_protocol','dmx_only','DMX-512 Only',10,'Standard DMX','{"TECH"}'),
  ('control_protocol','artnet_sacn','Art-Net / sACN',20,'Ethernet DMX','{"TECH"}'),
  ('control_protocol','pixel_map','Pixel-Mappable',30,'Individual pixel control','{"TECH"}'),
  ('control_protocol','p3_klingnet','P3 / KlingNet',40,'Martin/Elation ecosystem','{"TECH"}'),
  ('control_protocol','wireless_dmx','Wireless DMX / CRMX',50,'Wireless control','{"TECH"}'),
  ('control_protocol','dante','Dante / AES67',60,'Audio network protocol','{"TECH"}'),

  ('regulatory','union_required','Union Jurisdiction',10,'Union labor required','{"LABR","SITE"}'),
  ('regulatory','non_union','Non-Union',20,'Non-union market','{"LABR","SITE"}'),
  ('regulatory','health_dept','Health Dept Certified',30,'Health department compliance','{"FNBV","HOSP"}'),
  ('regulatory','fire_marshal','Fire Marshal Approved',40,'Fire marshal sign-off required','{"SITE","TECH"}'),
  ('regulatory','ada_compliant','ADA Compliant',50,'Accessibility required','{"SITE","HOSP"}'),

  ('logistics','local_pickup','Local Pickup Available',10,'Can be picked up locally','{"SITE","TECH"}'),
  ('logistics','national_ship','National Shipping',20,'Ships nationwide','{"SITE","TECH"}'),
  ('logistics','same_day','Same-Day Available',30,'Available on same-day notice','{"SITE","TECH","LABR"}'),
  ('logistics','advance_booking','Advance Booking Required',40,'Must be booked 2+ weeks out','{"SITE","TECH","TRVL"}')

ON CONFLICT (dimension_type, dimension_value) DO NOTHING;

CREATE TABLE IF NOT EXISTS advance_catalog_item_fitment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,
  fitment_dimension_id UUID NOT NULL REFERENCES advance_fitment_dimensions(id) ON DELETE CASCADE,

  fit_rating INTEGER DEFAULT 3 CHECK (fit_rating >= 1 AND fit_rating <= 5),

  fit_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(catalog_item_id, fitment_dimension_id)
);

CREATE INDEX idx_fitment_item ON advance_catalog_item_fitment(catalog_item_id);
CREATE INDEX idx_fitment_dimension ON advance_catalog_item_fitment(fitment_dimension_id);
CREATE INDEX idx_fitment_rating ON advance_catalog_item_fitment(fit_rating DESC);
CREATE INDEX idx_fitment_dim_rating ON advance_catalog_item_fitment(fitment_dimension_id, fit_rating DESC);

CREATE OR REPLACE FUNCTION get_items_by_fitment(
  p_collection TEXT DEFAULT NULL,
  p_venue_type TEXT DEFAULT NULL,
  p_event_scale TEXT DEFAULT NULL,
  p_environment TEXT DEFAULT NULL,
  p_budget_tier TEXT DEFAULT NULL,
  p_use_case TEXT DEFAULT NULL,
  p_min_rating INTEGER DEFAULT 3
)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  collection_name TEXT,
  category_name TEXT,
  avg_fit_rating NUMERIC,
  matching_dimensions INTEGER
) AS $$
  SELECT
    ci.id,
    ci.name,
    cg.name AS collection_name,
    cat.name AS category_name,
    AVG(cif.fit_rating)::NUMERIC(3,1),
    COUNT(cif.id)::INTEGER
  FROM advance_catalog_items ci
  JOIN advance_subcategories sub ON sub.id = ci.subcategory_id
  JOIN advance_categories cat ON cat.id = sub.category_id
  JOIN advance_category_groups cg ON cg.id = cat.group_id
  JOIN advance_catalog_item_fitment cif ON cif.catalog_item_id = ci.id
  JOIN advance_fitment_dimensions fd ON fd.id = cif.fitment_dimension_id
  WHERE
    cif.fit_rating >= p_min_rating
    AND (p_collection IS NULL OR cg.slug = p_collection)
    AND (
      (p_venue_type IS NOT NULL AND fd.dimension_type = 'venue_type' AND fd.dimension_value = p_venue_type)
      OR (p_event_scale IS NOT NULL AND fd.dimension_type = 'event_scale' AND fd.dimension_value = p_event_scale)
      OR (p_environment IS NOT NULL AND fd.dimension_type = 'environment' AND fd.dimension_value = p_environment)
      OR (p_budget_tier IS NOT NULL AND fd.dimension_type = 'budget_tier' AND fd.dimension_value = p_budget_tier)
      OR (p_use_case IS NOT NULL AND fd.dimension_type = 'use_case' AND fd.dimension_value = p_use_case)
    )
  GROUP BY ci.id, ci.name, cg.name, cat.name
  ORDER BY 5 DESC, 6 DESC;
$$ LANGUAGE SQL STABLE;
