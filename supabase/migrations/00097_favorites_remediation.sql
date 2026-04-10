-- ============================================================================
-- Migration: 00094_favorites_remediation
-- Description: Alters the existing public.favorites table to enforce organization isolation
-- ============================================================================

-- Fast truncation because existing favorites without org_id are invalid
TRUNCATE TABLE public.favorites;

-- Drop old unique constraint
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_entity_type_entity_id_key;

-- Add organization_id
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add new unique constraint
ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_org_entity_unique UNIQUE (user_id, organization_id, entity_type, entity_id);

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_favorites_user;
DROP INDEX IF EXISTS idx_favorites_entity;

-- Create new robust indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_org_created
  ON public.favorites (user_id, organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_entity
  ON public.favorites (entity_type, entity_id);

-- Recreate RLS Policies to enforce organization_id
DROP POLICY IF EXISTS "favorites_select" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete" ON public.favorites;
DROP POLICY IF EXISTS "favorites_update" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites in active organizations" ON public.favorites;
DROP POLICY IF EXISTS "Users can create their own favorites in active organizations" ON public.favorites;
DROP POLICY IF EXISTS "Users can update their own favorites in active organizations" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites in active organizations" ON public.favorites;

DROP POLICY IF EXISTS "Users can view their own favorites in active organizations" ON public.favorites;
CREATE POLICY "Users can view their own favorites in active organizations"
  ON public.favorites
  FOR SELECT
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE user_id = auth.uid()
        AND organization_id = public.favorites.organization_id
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can create their own favorites in active organizations" ON public.favorites;
CREATE POLICY "Users can create their own favorites in active organizations"
  ON public.favorites
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE user_id = auth.uid()
        AND organization_id = public.favorites.organization_id
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can delete their own favorites in active organizations" ON public.favorites;
CREATE POLICY "Users can delete their own favorites in active organizations"
  ON public.favorites
  FOR DELETE
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE user_id = auth.uid()
        AND organization_id = public.favorites.organization_id
        AND status = 'active'
    )
  );
