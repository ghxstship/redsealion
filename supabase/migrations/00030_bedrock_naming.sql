-- ============================================================
-- BEDROCK M-007: Naming Canonization
-- Risk: HIGH — Column renames require app code changes
-- Rollback: Reverse RENAME COLUMN for each
-- ============================================================

-- 1. Split users.full_name → first_name + last_name
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill: split on last space (handles "Mary Jane Watson" → "Mary Jane" + "Watson")
UPDATE public.users
SET
  first_name = CASE
    WHEN full_name LIKE '% %'
    THEN left(full_name, length(full_name) - length(substring(full_name FROM '[^ ]+$')) - 1)
    ELSE full_name
  END,
  last_name = CASE
    WHEN full_name LIKE '% %'
    THEN substring(full_name FROM '[^ ]+$')
    ELSE ''
  END
WHERE first_name IS NULL;

ALTER TABLE public.users
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

-- Keep full_name as generated column for backward compatibility
-- (Cannot drop yet due to app references — mark for future removal)
COMMENT ON COLUMN public.users.full_name IS 'DEPRECATED: Use first_name + last_name. Retained for backward compatibility.';

-- 2. Rename reserved/ambiguous columns
ALTER TABLE public.venues RENAME COLUMN constraints TO site_constraints;
ALTER TABLE public.phases RENAME COLUMN number TO phase_number;

-- 3. Rename client CRM field (remove leading underscore)
ALTER TABLE public.clients RENAME COLUMN _crm_external_ids TO crm_external_ids;

-- 4. Boolean naming canonization (is_ prefix)
ALTER TABLE public.phase_addons RENAME COLUMN selected TO is_selected;
ALTER TABLE public.phase_addons RENAME COLUMN taxable TO is_taxable;
ALTER TABLE public.phase_deliverables RENAME COLUMN taxable TO is_taxable;
ALTER TABLE public.invoice_line_items RENAME COLUMN taxable TO is_taxable;
ALTER TABLE public.time_entries RENAME COLUMN billable TO is_billable;
ALTER TABLE public.time_entries RENAME COLUMN approved TO is_approved;
ALTER TABLE public.proposal_comments RENAME COLUMN resolved TO is_resolved;
ALTER TABLE public.assets RENAME COLUMN trackable TO is_trackable;
ALTER TABLE public.assets RENAME COLUMN reusable TO is_reusable;
ALTER TABLE public.assets RENAME COLUMN return_required TO is_return_required;
ALTER TABLE public.holiday_calendars RENAME COLUMN recurring TO is_recurring;
ALTER TABLE public.custom_field_definitions RENAME COLUMN required TO is_required;

-- 5. Disambiguate ambiguous names
ALTER TABLE public.proposals RENAME COLUMN probability TO probability_percent;
ALTER TABLE public.deals RENAME COLUMN value TO deal_value;
ALTER TABLE public.client_contacts RENAME COLUMN role TO contact_role;
