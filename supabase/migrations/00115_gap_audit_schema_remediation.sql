-- Migration 00115: Gap Audit Schema Remediation (April 2026)
-- Closes all schema-level gaps identified in docs/gap-audit-2026-04.md
-- Covers: GAP-C-01, GAP-C-02, GAP-H-01, GAP-H-03, GAP-H-04, GAP-H-07 (schema side),
--         GAP-H-11, GAP-H-13, GAP-M-01, GAP-M-13, GAP-H-20, GAP-L-04, GAP-L-08
-- All ALTER TABLE statements use IF NOT EXISTS / IF EXISTS guards for idempotency.

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-01: work_orders — lifecycle timestamps for SLA/audit
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS started_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_work_orders_completed
  ON public.work_orders(organization_id, completed_at)
  WHERE completed_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-02: resource_allocations — real utilization fields
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.resource_allocations
  ADD COLUMN IF NOT EXISTS allocated_hours  NUMERIC(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_hours  NUMERIC(8,2) NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-01: goals — missing columns queried by UI
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS category   TEXT NOT NULL DEFAULT 'Company',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_goals_active
  ON public.goals(organization_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-01: goal_key_results — missing columns queried by UI
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.goal_key_results
  ADD COLUMN IF NOT EXISTS start_value NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-03: favorites — missing organization_id column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_favorites_org
  ON public.favorites(organization_id, user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-04: tasks — missing time-block columns for My Schedule
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time   TIME;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-11: project_portals — soft-delete support
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_portals_active
  ON public.project_portals(organization_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-13: production_advances — soft-delete support
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.production_advances
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_production_advances_active
  ON public.production_advances(organization_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-20: expenses — approval workflow columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS reviewed_by       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;

CREATE INDEX IF NOT EXISTS idx_expenses_reviewed
  ON public.expenses(organization_id, reviewed_at) WHERE reviewed_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-01: proposals — project_end_date for roadmap timeline
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS project_end_date DATE;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-13: compliance_documents — soft-delete support
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.compliance_documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_compliance_docs_active
  ON public.compliance_documents(organization_id) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-04: deals — lost_date for win/loss time reporting
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS lost_date TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-08: portfolio_library — soft-delete support
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.portfolio_library
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_portfolio_library_active
  ON public.portfolio_library(organization_id) WHERE deleted_at IS NULL;
