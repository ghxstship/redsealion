-- ============================================================
-- BEDROCK M-002: Missing updated_at Triggers
-- Risk: LOW — Additive only
-- Rollback: DROP TRIGGER for each
-- ============================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'crew_profiles',
    'crew_availability',
    'crew_bookings',
    'equipment_bundles',
    'equipment_reservations',
    'maintenance_records',
    'esignature_requests',
    'notification_preferences',
    'shifts',
    'calendar_sync_configs',
    'leads',
    'lead_forms',
    'onboarding_documents',
    'warehouse_transfers',
    'user_preferences',
    'email_templates',
    'document_defaults'
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
