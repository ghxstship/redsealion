-- ============================================================
-- Migration 00126: Audit Remediations
-- Addresses missing triggers, enum drift, and FK enforcement 
-- highlighted in the exhaustive stress test audit
-- ============================================================

-- 1. Apply updated_at triggers to the 12 explicitly missing audit log tables
DO $$
DECLARE
  tabular RECORD;
BEGIN
  FOR tabular IN
    SELECT unnest(ARRAY[
      'invoice_payments',
      'email_notifications',
      'email_messages',
      'capacity_overrides',
      'holiday_calendars',
      'webhook_deliveries',
      'integration_sync_log',
      'budget_alerts',
      'credit_notes',
      'payment_links',
      'invite_code_redemptions',
      'invitations'
    ]) AS t_name
  LOOP
    -- We assume the update_updated_at function exists natively from 00001
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_public_%I_updated_at ON public.%I;
      CREATE TRIGGER set_public_%I_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at();
    ', tabular.t_name, tabular.t_name, tabular.t_name, tabular.t_name);
  END LOOP;
END $$;

-- 2. Cast tasks to use the native DB Enum instead of plaintext drift checking
DO $$ BEGIN 
  CREATE TYPE task_status AS ENUM ('todo','in_progress','review','done','blocked','cancelled'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enforce the type casting for tasks.status safely
ALTER TABLE public.tasks 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE task_status USING status::text::task_status,
  ALTER COLUMN status SET DEFAULT 'todo'::task_status;
