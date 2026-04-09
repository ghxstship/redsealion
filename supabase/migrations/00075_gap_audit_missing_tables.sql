-- =============================================================================
-- Migration 00075: Gap Audit Remediation — Missing Tables
-- =============================================================================
-- Creates tables that app code queries but that don't exist:
--   1. project_budgets (H-11)
--   2. project_costs   (H-11)
--   3. budget_line_items (H-14)
--   4. org_chart_positions (H-12)
--   5. email_threads (H-13)
--   6. email_messages (H-13)
--   7. RLS for work_order_assignments update (H-17 — verified already exists)
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. PROJECT_BUDGETS (H-11)
-- ═══════════════════════════════════════════════════════════════════════
-- Queried by: finance/(hub)/budgets/page.tsx, budgets/[id]/page.tsx
-- Expected columns: id, proposal_id, total_budget, spent, organization_id, created_at

CREATE TABLE IF NOT EXISTS public.project_budgets (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID           NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id      UUID           NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  name             TEXT           NOT NULL DEFAULT '',
  total_budget     NUMERIC(14,2)  NOT NULL DEFAULT 0 CHECK (total_budget >= 0),
  spent            NUMERIC(14,2)  NOT NULL DEFAULT 0 CHECK (spent >= 0),
  status           TEXT           NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  notes            TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (organization_id, proposal_id)
);

CREATE INDEX idx_project_budgets_org ON public.project_budgets(organization_id);
CREATE INDEX idx_project_budgets_proposal ON public.project_budgets(proposal_id);

CREATE TRIGGER set_updated_at_project_budgets
  BEFORE UPDATE ON public.project_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_budgets_select" ON public.project_budgets
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "project_budgets_insert" ON public.project_budgets
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "project_budgets_update" ON public.project_budgets
  FOR UPDATE USING (organization_id = auth_user_org_id());
CREATE POLICY "project_budgets_delete" ON public.project_budgets
  FOR DELETE USING (organization_id = auth_user_org_id());


-- ═══════════════════════════════════════════════════════════════════════
-- 2. PROJECT_COSTS (H-11)
-- ═══════════════════════════════════════════════════════════════════════
-- Queried by: profitability/[proposalId]/page.tsx, reports/(hub)/wip/page.tsx
-- Expected columns: category, amount, proposal_id

CREATE TABLE IF NOT EXISTS public.project_costs (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID           NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id      UUID           NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  budget_id        UUID           REFERENCES public.project_budgets(id) ON DELETE SET NULL,
  category         TEXT           NOT NULL,
  description      TEXT,
  amount           NUMERIC(14,2)  NOT NULL DEFAULT 0 CHECK (amount >= 0),
  cost_date        DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_by       UUID           REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_costs_org ON public.project_costs(organization_id);
CREATE INDEX idx_project_costs_proposal ON public.project_costs(proposal_id);
CREATE INDEX idx_project_costs_budget ON public.project_costs(budget_id) WHERE budget_id IS NOT NULL;
CREATE INDEX idx_project_costs_category ON public.project_costs(organization_id, category);

CREATE TRIGGER set_updated_at_project_costs
  BEFORE UPDATE ON public.project_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_costs_select" ON public.project_costs
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "project_costs_insert" ON public.project_costs
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "project_costs_update" ON public.project_costs
  FOR UPDATE USING (organization_id = auth_user_org_id());
CREATE POLICY "project_costs_delete" ON public.project_costs
  FOR DELETE USING (organization_id = auth_user_org_id());


-- ═══════════════════════════════════════════════════════════════════════
-- 3. BUDGET_LINE_ITEMS (H-14)
-- ═══════════════════════════════════════════════════════════════════════
-- Queried by: budgets/[id]/page.tsx
-- Expected columns: id, budget_id, category, description, planned_amount, actual_amount, created_at

CREATE TABLE IF NOT EXISTS public.budget_line_items (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id        UUID           NOT NULL REFERENCES public.project_budgets(id) ON DELETE CASCADE,
  category         TEXT           NOT NULL,
  description      TEXT,
  planned_amount   NUMERIC(14,2)  NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  actual_amount    NUMERIC(14,2)  NOT NULL DEFAULT 0 CHECK (actual_amount >= 0),
  sort_order       INTEGER        NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_line_items_budget ON public.budget_line_items(budget_id);

CREATE TRIGGER set_updated_at_budget_line_items
  BEFORE UPDATE ON public.budget_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.budget_line_items ENABLE ROW LEVEL SECURITY;

-- Access via parent join on project_budgets
CREATE POLICY "budget_line_items_select" ON public.budget_line_items
  FOR SELECT USING (
    budget_id IN (SELECT id FROM public.project_budgets WHERE organization_id = auth_user_org_id())
  );
CREATE POLICY "budget_line_items_insert" ON public.budget_line_items
  FOR INSERT WITH CHECK (
    budget_id IN (SELECT id FROM public.project_budgets WHERE organization_id = auth_user_org_id())
  );
CREATE POLICY "budget_line_items_update" ON public.budget_line_items
  FOR UPDATE USING (
    budget_id IN (SELECT id FROM public.project_budgets WHERE organization_id = auth_user_org_id())
  );
CREATE POLICY "budget_line_items_delete" ON public.budget_line_items
  FOR DELETE USING (
    budget_id IN (SELECT id FROM public.project_budgets WHERE organization_id = auth_user_org_id())
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 4. ORG_CHART_POSITIONS (H-12)
-- ═══════════════════════════════════════════════════════════════════════
-- Queried by: components/admin/people/OrgChart.tsx
-- Expected columns: id, title, reports_to, user_id, organization_id, level

CREATE TABLE IF NOT EXISTS public.org_chart_positions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  title            TEXT        NOT NULL,
  department       TEXT,
  reports_to       UUID        REFERENCES public.org_chart_positions(id) ON DELETE SET NULL,
  level            INTEGER     NOT NULL DEFAULT 0,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_chart_positions_org ON public.org_chart_positions(organization_id);
CREATE INDEX idx_org_chart_positions_user ON public.org_chart_positions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_org_chart_positions_reports ON public.org_chart_positions(reports_to) WHERE reports_to IS NOT NULL;

CREATE TRIGGER set_updated_at_org_chart_positions
  BEFORE UPDATE ON public.org_chart_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.org_chart_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_chart_positions_select" ON public.org_chart_positions
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "org_chart_positions_insert" ON public.org_chart_positions
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "org_chart_positions_update" ON public.org_chart_positions
  FOR UPDATE USING (organization_id = auth_user_org_id());
CREATE POLICY "org_chart_positions_delete" ON public.org_chart_positions
  FOR DELETE USING (organization_id = auth_user_org_id());


-- ═══════════════════════════════════════════════════════════════════════
-- 5. EMAIL_THREADS (H-13)
-- ═══════════════════════════════════════════════════════════════════════
-- Queried by: emails/page.tsx
-- Expected columns: id, subject, from_name, from_email, last_message_at,
--   message_count, deal_title, organization_id

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

CREATE INDEX idx_email_threads_org ON public.email_threads(organization_id);
CREATE INDEX idx_email_threads_last ON public.email_threads(organization_id, last_message_at DESC);
CREATE INDEX idx_email_threads_deal ON public.email_threads(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_email_threads_client ON public.email_threads(client_id) WHERE client_id IS NOT NULL;

CREATE TRIGGER set_updated_at_email_threads
  BEFORE UPDATE ON public.email_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_threads_select" ON public.email_threads
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "email_threads_insert" ON public.email_threads
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "email_threads_update" ON public.email_threads
  FOR UPDATE USING (organization_id = auth_user_org_id());
CREATE POLICY "email_threads_delete" ON public.email_threads
  FOR DELETE USING (organization_id = auth_user_org_id());


-- ═══════════════════════════════════════════════════════════════════════
-- 6. EMAIL_MESSAGES (H-13)
-- ═══════════════════════════════════════════════════════════════════════
-- Queried as fallback in emails/page.tsx
-- Expected columns: id, thread_id, subject, from_name, from_email, sent_at,
--   deal_title, organization_id

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

CREATE INDEX idx_email_messages_org ON public.email_messages(organization_id);
CREATE INDEX idx_email_messages_thread ON public.email_messages(thread_id);
CREATE INDEX idx_email_messages_sent ON public.email_messages(organization_id, sent_at DESC);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_messages_select" ON public.email_messages
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "email_messages_insert" ON public.email_messages
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "email_messages_update" ON public.email_messages
  FOR UPDATE USING (organization_id = auth_user_org_id());
CREATE POLICY "email_messages_delete" ON public.email_messages
  FOR DELETE USING (organization_id = auth_user_org_id());
