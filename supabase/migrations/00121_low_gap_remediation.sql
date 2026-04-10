-- Low-severity gap remediation migration
-- Gaps: SCH-05, RPT-05

-- ═══════════════════════════════════════════════════════════════
-- SCH-05: Add notes field to schedule_blocks for block-level comments
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'schedule_blocks' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.schedule_blocks ADD COLUMN notes TEXT;
    COMMENT ON COLUMN public.schedule_blocks.notes IS 'Optional notes or description for block-level comments.';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- RPT-05: Add schedule and recipients columns to custom_reports
-- (saved_reports was merged into custom_reports in migration 00033)
-- for future automated report delivery
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_reports' AND column_name = 'schedule'
  ) THEN
    ALTER TABLE public.custom_reports ADD COLUMN schedule JSONB;
    COMMENT ON COLUMN public.custom_reports.schedule IS 'Automated delivery schedule config (e.g. {"frequency":"weekly","day":"monday","time":"09:00"}).';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_reports' AND column_name = 'recipients'
  ) THEN
    ALTER TABLE public.custom_reports ADD COLUMN recipients TEXT[];
    COMMENT ON COLUMN public.custom_reports.recipients IS 'Email addresses for scheduled report delivery.';
  END IF;
END $$;
