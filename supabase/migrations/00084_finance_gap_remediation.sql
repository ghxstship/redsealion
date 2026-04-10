-- =============================================================================
-- Migration 00081: Finance Hub Gap Remediation
-- =============================================================================
-- Addresses all 52 findings from the Finance Hub Operational Gap Audit.
-- Groups:
--   A. Soft-delete columns for finance tables
--   B. Missing data-point columns
--   C. Missing indexes
--   D. CHECK constraints for status fields
--   E. New tables (mileage_entries, purchase_order_line_items)
--   F. RLS policy fixes
--   G. Constraint fixes (invoices.proposal_id nullable)
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- A. SOFT-DELETE COLUMNS
-- ═══════════════════════════════════════════════════════════════════════

-- A-1: expenses.deleted_at (CRITICAL — DELETE API already references this)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_expenses_active
  ON public.expenses(id) WHERE deleted_at IS NULL;

-- A-2: purchase_orders.deleted_at
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_active
  ON public.purchase_orders(id) WHERE deleted_at IS NULL;

-- A-3: vendors.deleted_at
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_vendors_active
  ON public.vendors(id) WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- B. MISSING DATA-POINT COLUMNS
-- ═══════════════════════════════════════════════════════════════════════

-- B-1: expenses.rejection_reason
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- B-2: purchase_orders audit columns
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS received_date DATE;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- B-3: credit_notes.status
ALTER TABLE public.credit_notes
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'issued';

-- B-4: revenue_recognition.created_by
ALTER TABLE public.revenue_recognition
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- B-5: project_budgets.currency
ALTER TABLE public.project_budgets
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- B-6: invoices.overdue_at
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS overdue_at TIMESTAMPTZ;

-- B-7: invoice_payments lifecycle columns
ALTER TABLE public.invoice_payments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.invoice_payments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.invoice_payments
  ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.invoice_payments
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

-- Add updated_at trigger for invoice_payments
DROP TRIGGER IF EXISTS set_invoice_payments_updated_at ON public.invoice_payments;
CREATE TRIGGER set_invoice_payments_updated_at
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B-8: organizations.mileage_rate
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mileage_rate NUMERIC(6,4) NOT NULL DEFAULT 0.70;

-- B-9: recurring_invoice_schedules — add columns cron expects
-- (base_amount for UI display, description for listing)
ALTER TABLE public.recurring_invoice_schedules
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE public.recurring_invoice_schedules
  ADD COLUMN IF NOT EXISTS description TEXT;


-- ═══════════════════════════════════════════════════════════════════════
-- C. MISSING INDEXES
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_po_proposal
  ON public.purchase_orders(proposal_id);

CREATE INDEX IF NOT EXISTS idx_expenses_proposal
  ON public.expenses(proposal_id);

CREATE INDEX IF NOT EXISTS idx_project_costs_proposal
  ON public.project_costs(proposal_id);

CREATE INDEX IF NOT EXISTS idx_expenses_org_status
  ON public.expenses(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_expenses_user
  ON public.expenses(user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- D. CHECK CONSTRAINTS FOR STATUS FIELDS
-- ═══════════════════════════════════════════════════════════════════════

-- D-1: purchase_orders.status
DO $$ BEGIN
  ALTER TABLE public.purchase_orders
    ADD CONSTRAINT purchase_orders_status_check
    CHECK (status IN ('draft', 'sent', 'acknowledged', 'approved', 'received', 'closed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- D-2: expenses.status
DO $$ BEGIN
  ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- D-3: vendors.status
DO $$ BEGIN
  ALTER TABLE public.vendors
    ADD CONSTRAINT vendors_status_check
    CHECK (status IN ('active', 'inactive', 'blacklisted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- D-4: credit_notes.status
DO $$ BEGIN
  ALTER TABLE public.credit_notes
    ADD CONSTRAINT credit_notes_status_check
    CHECK (status IN ('draft', 'issued', 'applied', 'void'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- E. NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- E-1: mileage_entries
CREATE TABLE IF NOT EXISTS public.mileage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_miles NUMERIC(10,2) NOT NULL,
  rate_per_mile NUMERIC(6,4) NOT NULL DEFAULT 0.70,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mileage_org ON public.mileage_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_mileage_user ON public.mileage_entries(user_id);

ALTER TABLE public.mileage_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own mileage" ON public.mileage_entries;
CREATE POLICY "Users view own mileage" ON public.mileage_entries
  FOR SELECT USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));

DROP POLICY IF EXISTS "Users manage own mileage" ON public.mileage_entries;
CREATE POLICY "Users manage own mileage" ON public.mileage_entries
  FOR ALL USING (organization_id = auth_user_org_id() AND user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all mileage" ON public.mileage_entries;
CREATE POLICY "Admins manage all mileage" ON public.mileage_entries
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

DROP TRIGGER IF EXISTS set_mileage_entries_updated_at ON public.mileage_entries;
CREATE TRIGGER set_mileage_entries_updated_at
  BEFORE UPDATE ON public.mileage_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DO $$ BEGIN
  ALTER TABLE public.mileage_entries
    ADD CONSTRAINT mileage_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- E-2: purchase_order_line_items
CREATE TABLE IF NOT EXISTS public.purchase_order_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(14,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  received_quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_line_items_po ON public.purchase_order_line_items(po_id);

ALTER TABLE public.purchase_order_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org view PO line items" ON public.purchase_order_line_items;
CREATE POLICY "Org view PO line items" ON public.purchase_order_line_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id AND po.organization_id = auth_user_org_id())
  );

DROP POLICY IF EXISTS "Admins manage PO line items" ON public.purchase_order_line_items;
CREATE POLICY "Admins manage PO line items" ON public.purchase_order_line_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id AND po.organization_id = auth_user_org_id())
    AND is_org_admin_or_above()
  );

DROP TRIGGER IF EXISTS set_po_line_items_updated_at ON public.purchase_order_line_items;
CREATE TRIGGER set_po_line_items_updated_at
  BEFORE UPDATE ON public.purchase_order_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- F. RLS POLICY FIXES
-- ═══════════════════════════════════════════════════════════════════════

-- F-1: budget_line_items write policy (CRITICAL — only SELECT exists)
DROP POLICY IF EXISTS "Admins manage budget line items" ON public.budget_line_items;
CREATE POLICY "Admins manage budget line items" ON public.budget_line_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_budgets pb
      WHERE pb.id = budget_line_items.budget_id
      AND pb.organization_id = auth_user_org_id()
    )
    AND is_org_admin_or_above()
  );

-- F-2: budget_alerts write policies
DROP POLICY IF EXISTS "Admins manage alerts" ON public.budget_alerts;
CREATE POLICY "Admins manage alerts" ON public.budget_alerts
  FOR ALL USING (
    organization_id = auth_user_org_id()
    AND is_org_admin_or_above()
  );

-- F-3: expense admin approval policy — admins can update any org expense
DROP POLICY IF EXISTS "Admins manage org expenses" ON public.expenses;
CREATE POLICY "Admins manage org expenses" ON public.expenses
  FOR ALL USING (
    organization_id = auth_user_org_id()
    AND is_org_admin_or_above()
  );


-- ═══════════════════════════════════════════════════════════════════════
-- G. CONSTRAINT FIXES
-- ═══════════════════════════════════════════════════════════════════════

-- G-1: invoices.proposal_id — DROP NOT NULL (CRITICAL — standalone invoices fail)
ALTER TABLE public.invoices ALTER COLUMN proposal_id DROP NOT NULL;
