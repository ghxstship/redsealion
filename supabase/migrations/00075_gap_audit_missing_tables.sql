-- =============================================================================
-- Migration 00075: Gap Audit — Missing Tables + Column Additions
-- =============================================================================
-- 1. email_threads     (new table)
-- 2. email_messages    (new table)
-- 3. Additive columns to existing tables (project_budgets, org_chart_positions)
-- 4. Missing indexes on existing tables
-- 5. Portal token expiry        (M-NEW-13)
-- 6. Vendor rating columns      (L-NEW-03)
-- 7. User last_login_at         (L-NEW-04)
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. EMAIL_THREADS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.email_threads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject          TEXT        NOT NULL DEFAULT '',
  from_name        TEXT        NOT NULL DEFAULT '',
  from_email       TEXT        NOT NULL DEFAULT '',
  deal_id          UUID,
  deal_title       TEXT,
  client_id        UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  message_count    INTEGER     NOT NULL DEFAULT 0,
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status           TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'archived', 'spam')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_threads_org ON public.email_threads(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last ON public.email_threads(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_client ON public.email_threads(client_id) WHERE client_id IS NOT NULL;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_email_threads
    BEFORE UPDATE ON public.email_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "email_threads_select" ON public.email_threads
    FOR SELECT USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "email_threads_insert" ON public.email_threads
    FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "email_threads_update" ON public.email_threads
    FOR UPDATE USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "email_threads_delete" ON public.email_threads
    FOR DELETE USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 2. EMAIL_MESSAGES
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.email_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  thread_id        UUID        REFERENCES public.email_threads(id) ON DELETE CASCADE,
  subject          TEXT,
  from_name        TEXT        NOT NULL DEFAULT '',
  from_email       TEXT        NOT NULL DEFAULT '',
  to_emails        TEXT[]      NOT NULL DEFAULT '{}',
  cc_emails        TEXT[]      NOT NULL DEFAULT '{}',
  body_text        TEXT,
  body_html        TEXT,
  deal_title       TEXT,
  direction        TEXT        NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_messages_org ON public.email_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON public.email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_sent ON public.email_messages(organization_id, sent_at DESC);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "email_messages_select" ON public.email_messages
    FOR SELECT USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "email_messages_insert" ON public.email_messages
    FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "email_messages_update" ON public.email_messages
    FOR UPDATE USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "email_messages_delete" ON public.email_messages
    FOR DELETE USING (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. ADDITIVE COLUMNS TO EXISTING TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- project_budgets: add name, status (from 00010, missing these)
ALTER TABLE public.project_budgets
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
DO $$ BEGIN
  ALTER TABLE public.project_budgets ADD CONSTRAINT project_budgets_status_check
    CHECK (status IN ('active', 'closed', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- project_costs: add budget_id, created_by (from 00011, missing these)
ALTER TABLE public.project_costs
  ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES public.project_budgets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_project_costs_budget ON public.project_costs(budget_id) WHERE budget_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_costs_category ON public.project_costs(organization_id, category);

-- budget_line_items: add sort_order (from 00010, missing this)
ALTER TABLE public.budget_line_items
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- org_chart_positions: add sort_order (from 00012, missing this)
ALTER TABLE public.org_chart_positions
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Missing indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_project_budgets_org ON public.project_budgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_proposal ON public.project_budgets(proposal_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_org ON public.project_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_proposal ON public.project_costs(proposal_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_budget ON public.budget_line_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_positions_org ON public.org_chart_positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_positions_user ON public.org_chart_positions(user_id) WHERE user_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 4. PORTAL TOKEN EXPIRY (M-NEW-13)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS portal_token_expires_at TIMESTAMPTZ;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. VENDOR RATING (L-NEW-03)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. USER LAST LOGIN (L-NEW-04)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
