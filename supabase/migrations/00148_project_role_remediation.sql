-- ============================================================
-- 00148: Project Role Lifecycle Remediation
--
-- Replaces the legacy 4-value project_role enum with the 
-- comprehensive 12-value APS canonical role set.
--
-- Project roles (project_role_v2):
--   executive, production, management, crew, staff, talent,
--   vendor, client, sponsor, press, guest, attendee
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Create new project_role_v2 enum
-- ─────────────────────────────────────────────────────────────

CREATE TYPE project_role_v2 AS ENUM (
  'executive',
  'production',
  'management',
  'crew',
  'staff',
  'talent',
  'vendor',
  'client',
  'sponsor',
  'press',
  'guest',
  'attendee'
);

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Migrate dependent tables
-- ─────────────────────────────────────────────────────────────

-- 2.1 advance_collaborators table
ALTER TABLE public.advance_collaborators
  ADD COLUMN collaborator_role_new project_role_v2;

UPDATE public.advance_collaborators SET collaborator_role_new = CASE collaborator_role::text
  WHEN 'creator' THEN 'executive'::project_role_v2
  WHEN 'collaborator' THEN 'production'::project_role_v2
  WHEN 'viewer' THEN 'guest'::project_role_v2
  WHEN 'vendor' THEN 'vendor'::project_role_v2
  ELSE 'production'::project_role_v2
END;

ALTER TABLE public.advance_collaborators DROP COLUMN collaborator_role CASCADE;
ALTER TABLE public.advance_collaborators RENAME COLUMN collaborator_role_new TO collaborator_role;
ALTER TABLE public.advance_collaborators ALTER COLUMN collaborator_role SET NOT NULL;
ALTER TABLE public.advance_collaborators ALTER COLUMN collaborator_role SET DEFAULT 'production'::project_role_v2;


-- 2.2 Recreate advance_line_items policy that depended on project_role
CREATE POLICY line_items_collaborator_insert ON advance_line_items FOR INSERT WITH CHECK (
  advance_id IN (
    SELECT ac.advance_id FROM advance_collaborators ac
    WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted'
      AND ac.collaborator_role IN ('executive', 'production', 'management', 'vendor')
  )
);

-- 2.3 project_collaborators table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_collaborators' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.project_collaborators ADD COLUMN IF NOT EXISTS collaborator_role_new project_role_v2';
    EXECUTE 'UPDATE public.project_collaborators SET collaborator_role_new = CASE collaborator_role::text
      WHEN ''creator'' THEN ''executive''::project_role_v2
      WHEN ''collaborator'' THEN ''production''::project_role_v2
      WHEN ''viewer'' THEN ''guest''::project_role_v2
      WHEN ''vendor'' THEN ''vendor''::project_role_v2
      ELSE ''production''::project_role_v2
    END';
    EXECUTE 'ALTER TABLE public.project_collaborators DROP COLUMN collaborator_role';
    EXECUTE 'ALTER TABLE public.project_collaborators RENAME COLUMN collaborator_role_new TO collaborator_role';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Drop old project_role type and rename new one
-- ─────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS project_role CASCADE;
ALTER TYPE project_role_v2 RENAME TO project_role;

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Add role_lifecycle_states ENUM for Phase 5 enforcement
-- ─────────────────────────────────────────────────────────────

CREATE TYPE role_lifecycle_state AS ENUM (
  'discovery',
  'qualification',
  'onboarding',
  'contracting',
  'scheduling',
  'advancing',
  'deployment',
  'active_operations',
  'demobilization',
  'settlement',
  'reconciliation',
  'archival',
  'closeout'
);

-- Add tracking columns for active workflows
ALTER TABLE public.advance_collaborators 
  ADD COLUMN IF NOT EXISTS lifecycle_state role_lifecycle_state NOT NULL DEFAULT 'discovery';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_collaborators' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.project_collaborators ADD COLUMN IF NOT EXISTS lifecycle_state role_lifecycle_state NOT NULL DEFAULT ''discovery''';
  END IF;
END $$;

-- ============================================================
-- End of 00148
-- ============================================================
