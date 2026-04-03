-- ============================================================
-- BEDROCK M-006: Custom Fields Enhancement
-- Risk: MODERATE — ALTER TABLE, backfill, new indexes
-- Rollback: DROP COLUMN, DROP INDEX for each addition
-- ============================================================

-- 1. Enhance custom_field_definitions
ALTER TABLE public.custom_field_definitions
  ADD COLUMN IF NOT EXISTS field_key TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_filterable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_visible_in_list BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS visibility_roles TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_value JSONB;

-- 2. Backfill field_key from field_name (slugified lowercase)
UPDATE public.custom_field_definitions
SET field_key = lower(regexp_replace(
  regexp_replace(trim(field_name), '[^a-zA-Z0-9]+', '_', 'g'),
  '^_|_$', '', 'g'
))
WHERE field_key IS NULL;

-- 3. Set field_key NOT NULL after backfill
DO $$ BEGIN
  ALTER TABLE public.custom_field_definitions ALTER COLUMN field_key SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 4. Add field_key format constraint
DO $$ BEGIN
  ALTER TABLE public.custom_field_definitions
    ADD CONSTRAINT chk_field_key_format CHECK (field_key ~ '^[a-z][a-z0-9_]*$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Convert field_type to ENUM (created in M-004)
DO $$ BEGIN
  ALTER TABLE public.custom_field_definitions
    ALTER COLUMN field_type TYPE custom_field_type USING field_type::custom_field_type;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 6. Add UNIQUE constraint on (org_id, entity_type, field_key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cfd_org_entity_key
  ON public.custom_field_definitions(organization_id, entity_type, field_key);

-- 7. Enhance custom_field_values
ALTER TABLE public.custom_field_values
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS value_text TEXT,
  ADD COLUMN IF NOT EXISTS value_number NUMERIC,
  ADD COLUMN IF NOT EXISTS value_date DATE,
  ADD COLUMN IF NOT EXISTS value_boolean BOOLEAN;

-- 8. Backfill entity_type on values from their definitions
UPDATE public.custom_field_values cfv
SET entity_type = cfd.entity_type
FROM public.custom_field_definitions cfd
WHERE cfv.field_definition_id = cfd.id
  AND cfv.entity_type IS NULL;

-- 9. Add indexes for value querying
CREATE INDEX IF NOT EXISTS idx_cfv_entity ON public.custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cfv_definition ON public.custom_field_values(field_definition_id);
CREATE INDEX IF NOT EXISTS idx_cfv_value_text ON public.custom_field_values(value_text) WHERE value_text IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfv_value_number ON public.custom_field_values(value_number) WHERE value_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfv_value_date ON public.custom_field_values(value_date) WHERE value_date IS NOT NULL;
