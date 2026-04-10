-- =============================================================================
-- Migration 00094: Expenses Module Gap Remediation
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- A. Missing Table: Expense Receipts (1-to-many relationship)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_receipts_expense ON public.expense_receipts(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_receipts_org ON public.expense_receipts(organization_id);

ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org view expense receipts" ON public.expense_receipts;
CREATE POLICY "Org view expense receipts" ON public.expense_receipts
  FOR SELECT USING (organization_id = auth_user_org_id());

DROP POLICY IF EXISTS "Users manage own expense receipts" ON public.expense_receipts;
CREATE POLICY "Users manage own expense receipts" ON public.expense_receipts
  FOR ALL USING (
    organization_id = auth_user_org_id() 
    AND (
      EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_receipts.expense_id AND e.user_id = auth.uid())
      OR is_org_admin_or_above()
    )
  );

-- Migrate existing single receipt_urls to the new table if they exist
INSERT INTO public.expense_receipts (expense_id, organization_id, file_url, file_name)
SELECT id, organization_id, receipt_url, 'legacy-receipt'
FROM public.expenses
WHERE receipt_url IS NOT NULL
ON CONFLICT DO NOTHING;

-- Drop the old column to enforce the new 1-to-many design (parity requirement)
DO $$ BEGIN
  ALTER TABLE public.expenses DROP COLUMN receipt_url;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- B. Missing Data Points: Mileage Log Compliance & Billing Parity
-- ═══════════════════════════════════════════════════════════════════════

-- Soft deletes for compliance
ALTER TABLE public.mileage_entries
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Rejection traces for compliance
ALTER TABLE public.mileage_entries
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Billing parity with expenses
ALTER TABLE public.mileage_entries
  ADD COLUMN IF NOT EXISTS is_billable BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.mileage_entries
  ADD COLUMN IF NOT EXISTS billed_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Track approver like expenses
ALTER TABLE public.mileage_entries
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.mileage_entries
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Indexing for parity
CREATE INDEX IF NOT EXISTS idx_mileage_active ON public.mileage_entries(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mileage_status ON public.mileage_entries(organization_id, status);

