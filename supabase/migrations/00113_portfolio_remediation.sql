-- Migration: Portfolio Library Stabilization
-- Adds soft-deletes and applies strict RLS checking for them

-- 1. Add deleted_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portfolio_library' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.portfolio_library ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Drop and Recreate RLS policies to respect deleted_at
DROP POLICY IF EXISTS "portfolio_select" ON portfolio_library;
CREATE POLICY "portfolio_select" ON portfolio_library FOR SELECT
  USING (
    (is_super_admin() OR organization_id = auth_user_org_id())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "portfolio_modify" ON portfolio_library;
CREATE POLICY "portfolio_modify" ON portfolio_library FOR ALL
  USING (
    organization_id = auth_user_org_id() AND is_producer_role()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    organization_id = auth_user_org_id() AND is_producer_role()
    AND deleted_at IS NULL
  );

-- 3. Ensure FK constraints are valid and won't fail (redundant if already added, but ensure validity).
DO $$ 
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_library_project_id_fkey') THEN
        ALTER TABLE portfolio_library ADD CONSTRAINT portfolio_library_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_library_proposal_id_fkey') THEN
        ALTER TABLE portfolio_library ADD CONSTRAINT portfolio_library_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES proposals(id);
    END IF;
END $$;
