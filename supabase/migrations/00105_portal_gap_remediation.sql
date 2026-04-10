-- =============================================================================
-- Migration 00105: Portal Module Gap Remediation
-- Addresses gaps from the Portal operational audit
-- =============================================================================
--
-- GAP-PTL-30: portal_type Enum Extensibility
-- -------------------------------------------
-- The `portal_type` values (production, operations, food_beverage, talent,
-- guest, temporary) are defined as a Postgres ENUM. To add new types:
--   ALTER TYPE portal_type ADD VALUE IF NOT EXISTS 'sponsor';
-- This is a DDL operation requiring a new migration.
-- Future consideration: migrate to TEXT + CHECK constraint for self-service
-- configuration via a `portal_type_definitions` admin table.
--
-- GAP-PTL-32: project_portals RLS Dual Policy Design Intent
-- ----------------------------------------------------------
-- Two SELECT policies exist on project_portals:
--   1. "project_portals_published_select" (FOR SELECT, WHERE is_published=true)
--      → Grants public read to published portals. Used by the V1 API
--        (which uses serviceClient anyway, so this is a safety net).
--   2. "project_portals_org_select" (FOR SELECT, WHERE org match)
--      → Grants org members full read access to all portals (draft+published).
-- Both are PERMISSIVE, so either can grant access. This is intentional:
-- the service client bypasses RLS for the V1 public API, and the org policy
-- ensures members can manage drafts. The published policy provides
-- a defense-in-depth layer if direct client queries ever bypass the API.
--

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-16: Soft-delete columns for project_portals
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id);

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-23 / GAP-PTL-24: Missing indexes on project_portals
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_project_portals_project ON public.project_portals(project_id);
CREATE INDEX IF NOT EXISTS idx_project_portals_org ON public.project_portals(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_portals_published ON public.project_portals(organization_id, is_published)
  WHERE is_published = true AND deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-26 / GAP-PTL-27: Analytics columns
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-19: Per-portal branding
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS brand_config JSONB DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-28: Custom fields
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-33: Description column
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-34: Cover image URL
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-36: Schedule JSONB
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-38: Emergency contacts
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;


-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-11: Portal access log table
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.portal_access_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  client_contact_id UUID       REFERENCES public.client_contacts(id) ON DELETE SET NULL,
  proposal_id      UUID        REFERENCES public.proposals(id) ON DELETE SET NULL,
  portal_id        UUID        REFERENCES public.project_portals(id) ON DELETE SET NULL,
  page_path        TEXT        NOT NULL DEFAULT '',
  ip_address       TEXT,
  user_agent       TEXT,
  accessed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_access_log_org ON public.portal_access_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_portal_access_log_user ON public.portal_access_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_access_log_proposal ON public.portal_access_log(proposal_id) WHERE proposal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_access_log_portal ON public.portal_access_log(portal_id) WHERE portal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_access_log_accessed ON public.portal_access_log(organization_id, accessed_at DESC);

ALTER TABLE public.portal_access_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_access_log_select" ON public.portal_access_log;
  CREATE POLICY "portal_access_log_select" ON public.portal_access_log
    FOR SELECT USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_access_log_insert" ON public.portal_access_log;
  CREATE POLICY "portal_access_log_insert" ON public.portal_access_log
    FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-12: Portal invitations table
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.portal_invitations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_contact_id UUID        REFERENCES public.client_contacts(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL,
  token             TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by        UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  invited_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at       TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_invitations_org ON public.portal_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_portal_invitations_email ON public.portal_invitations(email);
CREATE INDEX IF NOT EXISTS idx_portal_invitations_token ON public.portal_invitations(token);
CREATE INDEX IF NOT EXISTS idx_portal_invitations_status ON public.portal_invitations(organization_id, status)
  WHERE status = 'pending';

ALTER TABLE public.portal_invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_invitations_select" ON public.portal_invitations;
  CREATE POLICY "portal_invitations_select" ON public.portal_invitations
    FOR SELECT USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_invitations_insert" ON public.portal_invitations;
  CREATE POLICY "portal_invitations_insert" ON public.portal_invitations
    FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_invitations_update" ON public.portal_invitations;
  CREATE POLICY "portal_invitations_update" ON public.portal_invitations
    FOR UPDATE USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_invitations_delete" ON public.portal_invitations;
  CREATE POLICY "portal_invitations_delete" ON public.portal_invitations
    FOR DELETE USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at_portal_invitations ON public.portal_invitations;
  CREATE TRIGGER set_updated_at_portal_invitations
    BEFORE UPDATE ON public.portal_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- GAP-PTL-35: Portal contacts junction table
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.portal_contacts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id         UUID        NOT NULL REFERENCES public.project_portals(id) ON DELETE CASCADE,
  client_contact_id UUID        REFERENCES public.client_contacts(id) ON DELETE CASCADE,
  user_id           UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  access_level      TEXT        NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit')),
  invited_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- At least one of client_contact_id or user_id must be set
  CONSTRAINT portal_contacts_has_identity CHECK (client_contact_id IS NOT NULL OR user_id IS NOT NULL),
  -- Unique per portal + contact/user
  UNIQUE (portal_id, client_contact_id),
  UNIQUE (portal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_portal_contacts_portal ON public.portal_contacts(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_contacts_contact ON public.portal_contacts(client_contact_id) WHERE client_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_contacts_user ON public.portal_contacts(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.portal_contacts ENABLE ROW LEVEL SECURITY;

-- RLS: inherit access from the portal's organization
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_contacts_select" ON public.portal_contacts;
  CREATE POLICY "portal_contacts_select" ON public.portal_contacts
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.project_portals pp
        JOIN public.organization_memberships om ON om.organization_id = pp.organization_id
        WHERE pp.id = portal_contacts.portal_id
        AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_contacts_insert" ON public.portal_contacts;
  CREATE POLICY "portal_contacts_insert" ON public.portal_contacts
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.project_portals pp
        JOIN public.organization_memberships om ON om.organization_id = pp.organization_id
        WHERE pp.id = portal_contacts.portal_id
        AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "portal_contacts_delete" ON public.portal_contacts;
  CREATE POLICY "portal_contacts_delete" ON public.portal_contacts
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.project_portals pp
        JOIN public.organization_memberships om ON om.organization_id = pp.organization_id
        WHERE pp.id = portal_contacts.portal_id
        AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
