-- ============================================================
-- BEDROCK M-005: CHECK Constraints
-- Risk: LOW — Will fail if invalid data already exists
-- Rollback: DROP CONSTRAINT for each
-- ============================================================

-- Date range constraints
ALTER TABLE public.resource_allocations
  ADD CONSTRAINT chk_allocation_dates CHECK (end_date >= start_date);

ALTER TABLE public.equipment_reservations
  ADD CONSTRAINT chk_reservation_dates CHECK (reserved_until >= reserved_from);

ALTER TABLE public.time_off_requests
  ADD CONSTRAINT chk_time_off_dates CHECK (end_date >= start_date);

ALTER TABLE public.crew_bookings
  ADD CONSTRAINT chk_shift_times CHECK (shift_end >= shift_start);

-- Non-negative money constraints
ALTER TABLE public.invoices
  ADD CONSTRAINT chk_invoice_subtotal_nonneg CHECK (subtotal >= 0);
ALTER TABLE public.invoices
  ADD CONSTRAINT chk_invoice_total_nonneg CHECK (total >= 0);
ALTER TABLE public.invoices
  ADD CONSTRAINT chk_invoice_tax_nonneg CHECK (tax_amount >= 0);

-- Positive quantity constraints
ALTER TABLE public.time_off_requests
  ADD CONSTRAINT chk_days_positive CHECK (days_requested > 0);

-- Unique constraint for time_off_balances
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_off_balances_unique
  ON public.time_off_balances(user_id, policy_id, year);

-- Missing FK constraint: proposals.pipeline_id → sales_pipelines(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'proposals_pipeline_id_fkey'
  ) THEN
    ALTER TABLE public.proposals
      ADD CONSTRAINT proposals_pipeline_id_fkey
      FOREIGN KEY (pipeline_id) REFERENCES public.sales_pipelines(id) ON DELETE SET NULL;
  END IF;
END $$;
