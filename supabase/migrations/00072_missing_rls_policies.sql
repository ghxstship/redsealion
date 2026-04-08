-- Migration 00072: Add missing RLS policies for venues and atproto OAuth tables.
-- These tables have RLS enabled but no policies in some environments.
-- Uses DROP IF EXISTS + CREATE to be idempotent across environments.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. venues — child of proposals, RLS via proposal's organization
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "venues_select" ON public.venues;
DROP POLICY IF EXISTS "venues_insert" ON public.venues;
DROP POLICY IF EXISTS "venues_update" ON public.venues;
DROP POLICY IF EXISTS "venues_delete" ON public.venues;

CREATE POLICY "venues_select" ON public.venues FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id AND p.organization_id = auth_user_org_id()
  ));

CREATE POLICY "venues_insert" ON public.venues FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id AND p.organization_id = auth_user_org_id()
  ));

CREATE POLICY "venues_update" ON public.venues FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id AND p.organization_id = auth_user_org_id()
  ));

CREATE POLICY "venues_delete" ON public.venues FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id AND p.organization_id = auth_user_org_id()
  ));

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. atproto_oauth_state — Bluesky OAuth temporary state
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "atproto_oauth_state_all" ON public.atproto_oauth_state;
CREATE POLICY "atproto_oauth_state_all" ON public.atproto_oauth_state
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. atproto_oauth_sessions — Bluesky OAuth sessions
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "atproto_oauth_sessions_all" ON public.atproto_oauth_sessions;
CREATE POLICY "atproto_oauth_sessions_all" ON public.atproto_oauth_sessions
  USING (true)
  WITH CHECK (true);
