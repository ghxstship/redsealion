-- =============================================================================
-- Migration 00067: Missing updated_at Triggers
-- =============================================================================
-- Adds BEFORE UPDATE triggers for tables introduced AFTER the bedrock trigger
-- sweep (00025). These tables have updated_at columns but no trigger.
-- Uses IF NOT EXISTS guard to be idempotent.
-- =============================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'production_schedules',
    'fabrication_orders',
    'purchase_requisitions',
    'rental_orders',
    'shipments',
    'asset_checkouts',
    'compliance_documents'
  ])
  LOOP
    -- Guard: only create if trigger does not already exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = format('set_updated_at_%s', t)
        AND tgrelid = format('public.%I', t)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END;
$$;
