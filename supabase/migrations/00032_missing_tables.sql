-- =============================================================================
-- Migration 00032: Missing Tables
-- =============================================================================
-- Creates 4 tables referenced in application code but absent from the DB:
--   1. notifications          — In-app notification inbox
--   2. approval_requests      — General-purpose approval workflow
--   3. cost_rates             — Role-based cost/billable rates
--   4. integration_connections — Active integration links
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. notifications
-- ---------------------------------------------------------------------------
-- In-app notification inbox consumed by NotificationBell and @mention system.
-- Distinct from email_notifications (email delivery) and notification_preferences
-- (user settings).

CREATE TABLE notifications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             TEXT        NOT NULL,
  title            TEXT        NOT NULL,
  body             TEXT,
  read             BOOLEAN     NOT NULL DEFAULT false,
  entity_type      TEXT,
  entity_id        UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user     ON notifications(user_id);
CREATE INDEX idx_notifications_org      ON notifications(organization_id);
CREATE INDEX idx_notifications_unread   ON notifications(user_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. approval_requests
-- ---------------------------------------------------------------------------
-- Unified approval workflow for expenses, budgets, change orders, timesheets,
-- purchase orders, time-off requests, and invoices.

CREATE TABLE approval_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type      TEXT        NOT NULL CHECK (entity_type IN (
                      'expense', 'budget', 'change_order', 'timesheet',
                      'purchase_order', 'time_off_request', 'invoice'
                    )),
  entity_id        UUID        NOT NULL,
  entity_title     TEXT        NOT NULL DEFAULT '',
  requested_by     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approvers        UUID[]      NOT NULL DEFAULT '{}',
  approved_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  rejected_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  rejected_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_requests_org    ON approval_requests(organization_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(organization_id, status);
CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);

CREATE TRIGGER set_updated_at_approval_requests
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY approval_requests_select ON approval_requests
  FOR SELECT USING (organization_id = auth_user_org_id());

CREATE POLICY approval_requests_insert ON approval_requests
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());

CREATE POLICY approval_requests_update ON approval_requests
  FOR UPDATE USING (organization_id = auth_user_org_id());

-- ---------------------------------------------------------------------------
-- 3. cost_rates
-- ---------------------------------------------------------------------------
-- Role-based hourly cost and billable rates per organization.
-- Used for profitability, margin calculations, and blended rate analysis.

CREATE TABLE cost_rates (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role             TEXT          NOT NULL,
  hourly_cost      NUMERIC(10,2) NOT NULL CHECK (hourly_cost >= 0),
  hourly_billable  NUMERIC(10,2) NOT NULL CHECK (hourly_billable >= 0),
  effective_from   DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (organization_id, role, effective_from)
);

CREATE INDEX idx_cost_rates_org ON cost_rates(organization_id);

CREATE TRIGGER set_updated_at_cost_rates
  BEFORE UPDATE ON cost_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cost_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_rates_select ON cost_rates
  FOR SELECT USING (organization_id = auth_user_org_id());

CREATE POLICY cost_rates_insert ON cost_rates
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());

CREATE POLICY cost_rates_update ON cost_rates
  FOR UPDATE USING (organization_id = auth_user_org_id());

CREATE POLICY cost_rates_delete ON cost_rates
  FOR DELETE USING (organization_id = auth_user_org_id());

-- ---------------------------------------------------------------------------
-- 4. integration_connections
-- ---------------------------------------------------------------------------
-- Active integration connections per org.
-- Distinct from `integrations` (catalog/config of available integration types).
-- One integration type can have multiple active connections.

CREATE TABLE integration_connections (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id        UUID        NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  status                TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  credentials_encrypted JSONB,
  external_account_id   TEXT,
  last_synced_at        TIMESTAMPTZ,
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_connections_org    ON integration_connections(organization_id);
CREATE INDEX idx_integration_connections_status ON integration_connections(organization_id, status);

CREATE TRIGGER set_updated_at_integration_connections
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_connections_select ON integration_connections
  FOR SELECT USING (organization_id = auth_user_org_id());

CREATE POLICY integration_connections_insert ON integration_connections
  FOR INSERT WITH CHECK (organization_id = auth_user_org_id());

CREATE POLICY integration_connections_update ON integration_connections
  FOR UPDATE USING (organization_id = auth_user_org_id());

CREATE POLICY integration_connections_delete ON integration_connections
  FOR DELETE USING (organization_id = auth_user_org_id());
