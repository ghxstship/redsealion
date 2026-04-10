-- Migration 00116: Gap Audit New Tables (April 2026)
-- Creates all missing tables identified in docs/gap-audit-2026-04.md
-- Covers: GAP-C-03, GAP-C-04, GAP-C-06, GAP-C-09, GAP-H-09, GAP-H-14,
--         GAP-H-15, GAP-H-16, GAP-H-18, GAP-L-03

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-03: project_costs — profitability cost breakdown per proposal
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_costs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id     UUID        NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  category        TEXT        NOT NULL,
  description     TEXT,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_type       TEXT        NOT NULL DEFAULT 'actual'
                  CHECK (cost_type IN ('actual', 'budgeted', 'forecasted')),
  cost_date       DATE,
  created_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_costs_select" ON public.project_costs;
CREATE POLICY "project_costs_select" ON public.project_costs FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "project_costs_insert" ON public.project_costs;
CREATE POLICY "project_costs_insert" ON public.project_costs FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "project_costs_update" ON public.project_costs;
CREATE POLICY "project_costs_update" ON public.project_costs FOR UPDATE
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "project_costs_delete" ON public.project_costs;
CREATE POLICY "project_costs_delete" ON public.project_costs FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_project_costs_proposal
  ON public.project_costs(proposal_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_org
  ON public.project_costs(organization_id);

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at_project_costs ON public.project_costs;
  CREATE TRIGGER set_updated_at_project_costs
    BEFORE UPDATE ON public.project_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-04: email_threads + email_messages — inbox schema
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_threads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject         TEXT,
  from_name       TEXT,
  from_email      TEXT        NOT NULL,
  to_email        TEXT,
  deal_id         UUID        REFERENCES public.deals(id) ON DELETE SET NULL,
  client_id       UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  message_count   INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_threads_select" ON public.email_threads;
CREATE POLICY "email_threads_select" ON public.email_threads FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "email_threads_insert" ON public.email_threads;
CREATE POLICY "email_threads_insert" ON public.email_threads FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "email_threads_update" ON public.email_threads;
CREATE POLICY "email_threads_update" ON public.email_threads FOR UPDATE
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "email_threads_delete" ON public.email_threads;
CREATE POLICY "email_threads_delete" ON public.email_threads FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_email_threads_org_date
  ON public.email_threads(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_deal
  ON public.email_threads(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_threads_client
  ON public.email_threads(client_id) WHERE client_id IS NOT NULL;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at_email_threads ON public.email_threads;
  CREATE TRIGGER set_updated_at_email_threads
    BEFORE UPDATE ON public.email_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.email_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID        NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  body_html       TEXT,
  body_text       TEXT,
  direction       TEXT        NOT NULL DEFAULT 'inbound'
                  CHECK (direction IN ('inbound', 'outbound')),
  status          TEXT        NOT NULL DEFAULT 'received',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_messages_select" ON public.email_messages;
CREATE POLICY "email_messages_select" ON public.email_messages FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "email_messages_insert" ON public.email_messages;
CREATE POLICY "email_messages_insert" ON public.email_messages FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "email_messages_delete" ON public.email_messages;
CREATE POLICY "email_messages_delete" ON public.email_messages FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_email_messages_thread
  ON public.email_messages(thread_id, sent_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-06: terms_documents — versioned T&C storage (enrich existing table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.terms_documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version         INT         NOT NULL DEFAULT 1,
  content         JSONB       NOT NULL DEFAULT '[]',
  is_published    BOOLEAN     NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns that may be missing on the pre-existing table from 00001
ALTER TABLE public.terms_documents ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.terms_documents ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.terms_documents ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.terms_documents ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.terms_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "terms_documents_select" ON public.terms_documents;
CREATE POLICY "terms_documents_select" ON public.terms_documents FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "terms_documents_insert" ON public.terms_documents;
CREATE POLICY "terms_documents_insert" ON public.terms_documents FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "terms_documents_update" ON public.terms_documents;
CREATE POLICY "terms_documents_update" ON public.terms_documents FOR UPDATE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_terms_documents_org_published
  ON public.terms_documents(organization_id, published_at DESC NULLS LAST);

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-09: automation_runs — execution history and error trail (enrich existing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id   UUID        NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'success'
                  CHECK (status IN ('success', 'failed', 'skipped')),
  trigger_payload JSONB,
  result_payload  JSONB,
  error_message   TEXT,
  ran_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns that may be missing on the pre-existing table from 00007
ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS trigger_payload JSONB;
ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS result_payload JSONB;
ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS ran_at TIMESTAMPTZ;

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_runs_select" ON public.automation_runs;
CREATE POLICY "automation_runs_select" ON public.automation_runs FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "automation_runs_insert" ON public.automation_runs;
CREATE POLICY "automation_runs_insert" ON public.automation_runs FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_ran
  ON public.automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_org_ran
  ON public.automation_runs(organization_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-09: revenue_recognition — financial recognition records (enrich existing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revenue_recognition (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id         UUID        REFERENCES public.proposals(id) ON DELETE SET NULL,
  invoice_id          UUID        REFERENCES public.invoices(id) ON DELETE SET NULL,
  recognized_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  recognition_date    DATE        NOT NULL,
  method              TEXT        NOT NULL DEFAULT 'percentage_completion',
  notes               TEXT,
  created_by          UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns that may be missing on the pre-existing table from 00011
ALTER TABLE public.revenue_recognition ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;
ALTER TABLE public.revenue_recognition ADD COLUMN IF NOT EXISTS recognition_date DATE;
ALTER TABLE public.revenue_recognition ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.revenue_recognition ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revenue_recognition_select" ON public.revenue_recognition;
CREATE POLICY "revenue_recognition_select" ON public.revenue_recognition FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "revenue_recognition_insert" ON public.revenue_recognition;
CREATE POLICY "revenue_recognition_insert" ON public.revenue_recognition FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "revenue_recognition_update" ON public.revenue_recognition;
CREATE POLICY "revenue_recognition_update" ON public.revenue_recognition FOR UPDATE
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "revenue_recognition_delete" ON public.revenue_recognition;
CREATE POLICY "revenue_recognition_delete" ON public.revenue_recognition FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_revenue_recognition_org_date
  ON public.revenue_recognition(organization_id);

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at_revenue_recognition ON public.revenue_recognition;
  CREATE TRIGGER set_updated_at_revenue_recognition
    BEFORE UPDATE ON public.revenue_recognition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-14: email_suppressions — CAN-SPAM/GDPR unsubscribe list
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  reason          TEXT        NOT NULL DEFAULT 'unsubscribed',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_suppressions_select" ON public.email_suppressions;
CREATE POLICY "email_suppressions_select" ON public.email_suppressions FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "email_suppressions_insert" ON public.email_suppressions;
CREATE POLICY "email_suppressions_insert" ON public.email_suppressions FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "email_suppressions_delete" ON public.email_suppressions;
CREATE POLICY "email_suppressions_delete" ON public.email_suppressions FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_email_suppressions_email
  ON public.email_suppressions(organization_id, email);

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-15: leads — client conversion tracking column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS converted_to_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_converted_client
  ON public.leads(converted_to_client_id) WHERE converted_to_client_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-16: integration_sync_logs — sync history and error visibility
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_sync_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id   UUID        NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'success'
                   CHECK (status IN ('success', 'failed', 'partial')),
  records_synced   INT         NOT NULL DEFAULT 0,
  error_message    TEXT,
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_sync_logs_select" ON public.integration_sync_logs;
CREATE POLICY "integration_sync_logs_select" ON public.integration_sync_logs FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "integration_sync_logs_insert" ON public.integration_sync_logs;
CREATE POLICY "integration_sync_logs_insert" ON public.integration_sync_logs FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration
  ON public.integration_sync_logs(integration_id, synced_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-18: po_receipts + po_receipt_items — goods received workflow
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.po_receipts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  purchase_order_id UUID        NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  received_by       UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.po_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "po_receipts_select" ON public.po_receipts;
CREATE POLICY "po_receipts_select" ON public.po_receipts FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "po_receipts_insert" ON public.po_receipts;
CREATE POLICY "po_receipts_insert" ON public.po_receipts FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "po_receipts_update" ON public.po_receipts;
CREATE POLICY "po_receipts_update" ON public.po_receipts FOR UPDATE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_po_receipts_po
  ON public.po_receipts(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_receipts_org
  ON public.po_receipts(organization_id);

CREATE TABLE IF NOT EXISTS public.po_receipt_items (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id      UUID    NOT NULL REFERENCES public.po_receipts(id) ON DELETE CASCADE,
  po_line_item_id UUID    REFERENCES public.purchase_order_line_items(id) ON DELETE SET NULL,
  quantity_received INT   NOT NULL DEFAULT 0,
  condition       TEXT    NOT NULL DEFAULT 'good'
                  CHECK (condition IN ('good', 'damaged', 'missing'))
);

ALTER TABLE public.po_receipt_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "po_receipt_items_select" ON public.po_receipt_items;
CREATE POLICY "po_receipt_items_select" ON public.po_receipt_items FOR SELECT
  USING (receipt_id IN (
    SELECT id FROM public.po_receipts WHERE organization_id = auth_user_org_id()
  ));
DROP POLICY IF EXISTS "po_receipt_items_insert" ON public.po_receipt_items;
CREATE POLICY "po_receipt_items_insert" ON public.po_receipt_items FOR INSERT
  WITH CHECK (receipt_id IN (
    SELECT id FROM public.po_receipts WHERE organization_id = auth_user_org_id()
  ));

CREATE INDEX IF NOT EXISTS idx_po_receipt_items_receipt
  ON public.po_receipt_items(receipt_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-03: ai_conversations + ai_messages — AI chat persistence (enrich existing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_conversations_select" ON public.ai_conversations;
CREATE POLICY "ai_conversations_select" ON public.ai_conversations FOR SELECT
  USING (user_id = auth.uid() AND organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "ai_conversations_insert" ON public.ai_conversations;
CREATE POLICY "ai_conversations_insert" ON public.ai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "ai_conversations_update" ON public.ai_conversations;
CREATE POLICY "ai_conversations_update" ON public.ai_conversations FOR UPDATE
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ai_conversations_delete" ON public.ai_conversations;
CREATE POLICY "ai_conversations_delete" ON public.ai_conversations FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
  ON public.ai_conversations(user_id, updated_at DESC);

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at_ai_conversations ON public.ai_conversations;
  CREATE TRIGGER set_updated_at_ai_conversations
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_messages_select" ON public.ai_messages;
CREATE POLICY "ai_messages_select" ON public.ai_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "ai_messages_insert" ON public.ai_messages;
CREATE POLICY "ai_messages_insert" ON public.ai_messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation
  ON public.ai_messages(conversation_id, created_at ASC);

