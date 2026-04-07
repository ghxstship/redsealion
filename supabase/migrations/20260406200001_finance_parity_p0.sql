-- ============================================================
-- Finance Feature Parity — Phase 1 (P0)
-- 1. Tax/VAT on invoice line items
-- 2. Vendor database entity
-- 3. Invoice payment history (partial payments)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Tax/VAT on Invoice Line Items
-- ────────────────────────────────────────────────────────────
-- Add tax_rate column (percentage, e.g. 8.25 for 8.25%)
ALTER TABLE public.invoice_line_items
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(6,4) NOT NULL DEFAULT 0;

-- Add tax_amount column (computed per line item)
ALTER TABLE public.invoice_line_items
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Add default_tax_rate to organization settings (stored in settings JSONB)
-- This is handled via the existing settings.currency JSONB — we add a top-level column instead
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS default_tax_rate NUMERIC(6,4) NOT NULL DEFAULT 0;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS tax_label TEXT NOT NULL DEFAULT 'Tax';

-- ────────────────────────────────────────────────────────────
-- 2. Vendor Database
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  -- Financial details
  payment_terms TEXT DEFAULT 'net_30',
  tax_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  -- Classification
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  -- W-9 and compliance
  w9_on_file BOOLEAN NOT NULL DEFAULT false,
  w9_received_date DATE,
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_org ON public.vendors(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON public.vendors(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(organization_id, status);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view vendors" ON public.vendors
  FOR SELECT USING (organization_id = auth_user_org_id());

CREATE POLICY "Producers manage vendors" ON public.vendors
  FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());

CREATE TRIGGER set_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Link purchase_orders to vendors table
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_po_vendor ON public.purchase_orders(vendor_id);

-- ────────────────────────────────────────────────────────────
-- 3. Invoice Payment History
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'other',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  stripe_payment_id TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_org ON public.invoice_payments(organization_id);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view invoice payments" ON public.invoice_payments
  FOR SELECT USING (organization_id = auth_user_org_id());

CREATE POLICY "Admins manage invoice payments" ON public.invoice_payments
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- Add billable flag to expenses (for Expense → Invoice pull)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_billable BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS billed_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;
