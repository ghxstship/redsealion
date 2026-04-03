-- ============================================================
-- BEDROCK M-003: calendar_sync_configs Duplicate Resolution
-- Risk: MODERATE — ALTER TABLE on existing table
-- Rollback: DROP COLUMN for each added column
-- ============================================================
-- The table was created in 00018 with a basic schema.
-- Migration 00021 used CREATE TABLE IF NOT EXISTS with a richer schema,
-- which silently did nothing because the table already existed.
-- This migration adds the columns that 00021 intended to create.

-- Add missing columns from the 00021 definition
ALTER TABLE public.calendar_sync_configs
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS calendar_id TEXT;

-- Rename 'enabled' → 'sync_enabled' for consistency with 00021 intent
-- (Only if 'enabled' exists and 'sync_enabled' does not)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calendar_sync_configs' AND column_name = 'enabled'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calendar_sync_configs' AND column_name = 'sync_enabled'
  ) THEN
    ALTER TABLE public.calendar_sync_configs RENAME COLUMN enabled TO sync_enabled;
  END IF;
END;
$$;

-- Widen the provider CHECK to include 'outlook' (00021 intended google/outlook/ical)
-- Drop old CHECK and add new one
DO $$
BEGIN
  -- Find and drop the existing CHECK constraint on provider
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'calendar_sync_configs'
      AND ccu.column_name = 'provider'
  ) THEN
    EXECUTE (
      SELECT format('ALTER TABLE public.calendar_sync_configs DROP CONSTRAINT %I', cc.constraint_name)
      FROM information_schema.check_constraints cc
      JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
      WHERE ccu.table_schema = 'public'
        AND ccu.table_name = 'calendar_sync_configs'
        AND ccu.column_name = 'provider'
      LIMIT 1
    );
  END IF;

  ALTER TABLE public.calendar_sync_configs
    ADD CONSTRAINT chk_calendar_provider CHECK (provider IN ('google', 'outlook', 'ical'));
END;
$$;

-- Add UNIQUE constraint from 00021 (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'calendar_sync_configs'
      AND indexdef LIKE '%user_id%organization_id%provider%'
  ) THEN
    CREATE UNIQUE INDEX idx_calendar_sync_user_org_provider
      ON public.calendar_sync_configs(user_id, organization_id, provider);
  END IF;
END;
$$;
