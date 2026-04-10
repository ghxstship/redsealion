-- 00114_logistics_bol.sql
-- Appends standard Bill of Lading (BOL) tracking fields to the shipments table.

ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS freight_class TEXT,
ADD COLUMN IF NOT EXISTS nmfc_code TEXT,
ADD COLUMN IF NOT EXISTS declared_value_cents INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_hazardous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bol_special_instructions TEXT,
ADD COLUMN IF NOT EXISTS bol_generated_at TIMESTAMPTZ;
