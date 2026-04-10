-- Migration: 00100_integrations_gap_remediation.sql
-- Resolves gaps in the integrations schema.

-- 1. Update `integration_sync_log` schema mismatch and add granular metrics
ALTER TABLE integration_sync_log RENAME COLUMN error TO error_message;
ALTER TABLE integration_sync_log ADD COLUMN records_processed INTEGER DEFAULT 0;
ALTER TABLE integration_sync_log ADD COLUMN records_filtered INTEGER DEFAULT 0;
ALTER TABLE integration_sync_log ADD COLUMN records_failed INTEGER DEFAULT 0;
ALTER TABLE integration_sync_log ADD COLUMN details JSONB;

-- Add soft-delete
ALTER TABLE integration_sync_log ADD COLUMN deleted_at TIMESTAMPTZ;

-- 2. Update `integrations` table with missing tracking/audit fields
ALTER TABLE integrations ADD COLUMN connected_by_user_id UUID REFERENCES users(id);
ALTER TABLE integrations ADD COLUMN external_tenant_id TEXT;
ALTER TABLE integrations ADD COLUMN sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations ADD COLUMN deleted_at TIMESTAMPTZ;

-- 3. Update `webhook_endpoints` table
ALTER TABLE webhook_endpoints ADD COLUMN name VARCHAR(255);
ALTER TABLE webhook_endpoints ADD COLUMN description TEXT;
ALTER TABLE webhook_endpoints ADD COLUMN deleted_at TIMESTAMPTZ;

-- 4. Create missing `integration_field_mappings` table
CREATE TABLE integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform_logic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_field_mappings_integration ON integration_field_mappings(integration_id);

-- 5. Create missing `integration_sync_jobs` queue table
CREATE TABLE integration_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sync_type TEXT NOT NULL DEFAULT 'scheduled',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_sync_jobs_status ON integration_sync_jobs(status, next_attempt_at);

-- 6. Add RLS for new tables
ALTER TABLE integration_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage mappings" ON integration_field_mappings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM integrations i 
      WHERE i.id = integration_id 
      AND i.organization_id = auth_user_org_id()
    ) 
    AND is_org_admin_or_above()
  );

CREATE POLICY "Org admins can view sync jobs" ON integration_sync_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM integrations i 
      WHERE i.id = integration_id 
      AND i.organization_id = auth_user_org_id()
    ) 
    AND is_org_admin_or_above()
  );

-- 7. Add updated_at triggers
CREATE TRIGGER update_integration_field_mappings_updated_at 
  BEFORE UPDATE ON integration_field_mappings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_integration_sync_jobs_updated_at 
  BEFORE UPDATE ON integration_sync_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
