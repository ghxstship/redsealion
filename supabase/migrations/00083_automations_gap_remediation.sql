-- Automations gap remediation migration
-- Addresses gaps: #3, #4, #13, #19, #20, #22, #23, #25, #31, #32, #33, #34, #35, #37

-- -------------------------------------------------------------------------
-- 1. Add missing columns to `automations` (#4, #23, #34, #35)
-- -------------------------------------------------------------------------
ALTER TABLE automations ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS schedule_interval_minutes INTEGER DEFAULT 60;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS max_runs_per_hour INTEGER DEFAULT 100;

-- Index for scheduled automation polling (#4)
CREATE INDEX IF NOT EXISTS idx_automations_schedule_poll
  ON automations(next_run_at)
  WHERE is_active = true AND trigger_type = 'schedule' AND deleted_at IS NULL;

-- Index for soft-delete queries
CREATE INDEX IF NOT EXISTS idx_automations_deleted
  ON automations(organization_id)
  WHERE deleted_at IS NULL;

-- -------------------------------------------------------------------------
-- 2. automation_runs: missing index, updated_at, constraints, retry (#3, #13, #20, #25, #33)
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_automation_runs_org ON automation_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(automation_id, status);

ALTER TABLE automation_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE automation_runs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE automation_runs ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3;

-- updated_at trigger
CREATE TRIGGER update_automation_runs_updated_at
  BEFORE UPDATE ON automation_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Status CHECK constraint (#20)
DO $$ BEGIN
  ALTER TABLE automation_runs
    ADD CONSTRAINT chk_automation_run_status
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- 3. RLS policies for automation_runs INSERT/UPDATE (#3)
-- -------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "Org members can create runs"
    ON automation_runs FOR INSERT
    WITH CHECK (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update runs"
    ON automation_runs FOR UPDATE
    USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- 4. email_threads: add updated_at (#31)
-- -------------------------------------------------------------------------
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER update_email_threads_updated_at
  BEFORE UPDATE ON email_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------------------
-- 5. email_messages: add organization_id for faster RLS (#32)
-- -------------------------------------------------------------------------
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill existing rows from their parent thread
UPDATE email_messages em
  SET organization_id = et.organization_id
  FROM email_threads et
  WHERE em.thread_id = et.id
  AND em.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_messages_org ON email_messages(organization_id);

-- -------------------------------------------------------------------------
-- 6. email_messages.direction CHECK constraint (#37)
-- -------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE email_messages
    ADD CONSTRAINT chk_email_direction
    CHECK (direction IN ('inbound', 'outbound'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- 7. automation_steps table for multi-action workflows (#22)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  condition_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_steps_automation ON automation_steps(automation_id, step_order);

ALTER TABLE automation_steps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org members can view automation steps"
    ON automation_steps FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM automations a WHERE a.id = automation_id AND a.organization_id = auth_user_org_id()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage automation steps"
    ON automation_steps FOR ALL
    USING (EXISTS (
      SELECT 1 FROM automations a WHERE a.id = automation_id AND a.organization_id = auth_user_org_id()
    ) AND is_org_admin_or_above());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TRIGGER update_automation_steps_updated_at
  BEFORE UPDATE ON automation_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
