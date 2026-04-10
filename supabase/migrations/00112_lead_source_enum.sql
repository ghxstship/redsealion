-- =============================================================================
-- Migration 00105: Lead Source Enum
-- =============================================================================
-- Resolves L-03: Formalize source as enum in database
-- =============================================================================

CREATE TYPE public.lead_source AS ENUM (
  'website',
  'referral',
  'linkedin',
  'cold_outreach',
  'lead_form',
  'event',
  'other'
);

-- Update existing text values to map to enum (lowercasing and replacing spaces)
UPDATE public.leads 
SET source = 'linkedin' 
WHERE lower(source) = 'linkedin';

UPDATE public.leads 
SET source = 'cold_outreach' 
WHERE lower(source) = 'cold outreach' OR lower(source) = 'cold_outreach';

UPDATE public.leads 
SET source = 'lead_form' 
WHERE lower(source) = 'lead form' OR lower(source) = 'lead_form';

UPDATE public.leads 
SET source = 'event' 
WHERE lower(source) = 'event';

UPDATE public.leads 
SET source = 'website' 
WHERE lower(source) = 'website';

UPDATE public.leads 
SET source = 'referral' 
WHERE lower(source) = 'referral';

-- Any remaining values become 'other', then alter the column type
ALTER TABLE public.leads 
  ALTER COLUMN source TYPE public.lead_source 
  USING (
    CASE 
      WHEN source IN ('website', 'referral', 'linkedin', 'cold_outreach', 'lead_form', 'event', 'other') THEN source::public.lead_source
      ELSE 'other'::public.lead_source
    END
  );

ALTER TABLE public.leads ALTER COLUMN source SET DEFAULT 'other'::public.lead_source;
