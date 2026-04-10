-- ============================================================
-- STRESS TEST AUDIT REMEDIATION — 2026-04-10
-- Addresses: ST-C-11, ST-C-12, ST-C-13, ST-C-14, ST-C-02/ST-C-10,
--            ST-H-06, ST-H-07, ST-H-08, ST-H-13, ST-H-14, ST-H-15,
--            ST-H-25, ST-M-05, ST-M-14, ST-M-18, ST-M-23, ST-M-24,
--            ST-M-29, ST-L-04, ST-L-07, ST-L-08
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ST-C-11: Work order lifecycle timestamps
-- ────────────────────────────────────────────────────────────
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_work_orders_completed
  ON work_orders(organization_id, completed_at)
  WHERE completed_at IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- ST-C-12: Utilization columns on resource_allocations
-- ────────────────────────────────────────────────────────────
ALTER TABLE resource_allocations
  ADD COLUMN IF NOT EXISTS allocated_hours DECIMAL,
  ADD COLUMN IF NOT EXISTS available_hours DECIMAL;

-- ────────────────────────────────────────────────────────────
-- ST-C-13: project_costs table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_type TEXT NOT NULL DEFAULT 'actual' CHECK (cost_type IN ('actual','budgeted','forecasted')),
  cost_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_project_costs_org ON project_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_proposal ON project_costs(proposal_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "project_costs_select" ON project_costs;
  CREATE POLICY "project_costs_select" ON project_costs FOR SELECT
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "project_costs_modify" ON project_costs;
  CREATE POLICY "project_costs_modify" ON project_costs FOR ALL
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- ST-C-14: Email threads + messages tables
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject TEXT,
  from_name TEXT,
  from_email TEXT NOT NULL DEFAULT '',
  to_email TEXT,
  deal_id UUID,
  client_id UUID,
  last_message_at TIMESTAMPTZ,
  message_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_email_threads_org ON email_threads(organization_id);

CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  body_html TEXT,
  body_text TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound','outbound')),
  status TEXT NOT NULL DEFAULT 'received',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "email_threads_select" ON email_threads;
  CREATE POLICY "email_threads_select" ON email_threads FOR SELECT
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "email_messages_select" ON email_messages;
  CREATE POLICY "email_messages_select" ON email_messages FOR SELECT
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- ST-C-02/ST-C-10: Trigger to sync proposal totals
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_phase_investment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE phases p
  SET phase_investment = COALESCE((
    SELECT SUM(total_cost) FROM phase_deliverables pd WHERE pd.phase_id = p.id
  ), 0)
  WHERE p.id = COALESCE(NEW.phase_id, OLD.phase_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_phase_investment ON phase_deliverables;
CREATE TRIGGER trg_sync_phase_investment
  AFTER INSERT OR UPDATE OF total_cost OR DELETE ON phase_deliverables
  FOR EACH ROW EXECUTE FUNCTION sync_phase_investment();

CREATE OR REPLACE FUNCTION sync_proposal_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_proposal_id UUID;
BEGIN
  v_proposal_id := COALESCE(NEW.proposal_id, OLD.proposal_id);
  UPDATE proposals pr
  SET
    total_value = COALESCE((
      SELECT SUM(phase_investment) FROM phases ph WHERE ph.proposal_id = v_proposal_id
    ), 0),
    total_with_addons = COALESCE((
      SELECT SUM(phase_investment) FROM phases ph WHERE ph.proposal_id = v_proposal_id
    ), 0) + COALESCE((
      SELECT SUM(pa.total_cost) FROM phase_addons pa
      JOIN phases ph ON ph.id = pa.phase_id
      WHERE ph.proposal_id = v_proposal_id AND pa.is_selected = true
    ), 0)
  WHERE pr.id = v_proposal_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_proposal_totals ON phases;
CREATE TRIGGER trg_sync_proposal_totals
  AFTER INSERT OR UPDATE OF phase_investment OR DELETE ON phases
  FOR EACH ROW EXECUTE FUNCTION sync_proposal_totals();

-- Also sync when addons are selected/deselected
CREATE OR REPLACE FUNCTION sync_proposal_from_addon()
RETURNS TRIGGER AS $$
DECLARE
  v_proposal_id UUID;
BEGIN
  SELECT proposal_id INTO v_proposal_id
  FROM phases WHERE id = COALESCE(NEW.phase_id, OLD.phase_id);
  IF v_proposal_id IS NOT NULL THEN
    UPDATE proposals pr
    SET total_with_addons = COALESCE((
      SELECT SUM(phase_investment) FROM phases ph WHERE ph.proposal_id = v_proposal_id
    ), 0) + COALESCE((
      SELECT SUM(pa.total_cost) FROM phase_addons pa
      JOIN phases ph ON ph.id = pa.phase_id
      WHERE ph.proposal_id = v_proposal_id AND pa.is_selected = true
    ), 0)
    WHERE pr.id = v_proposal_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_proposal_from_addon ON phase_addons;
CREATE TRIGGER trg_sync_proposal_from_addon
  AFTER INSERT OR UPDATE OF total_cost, is_selected OR DELETE ON phase_addons
  FOR EACH ROW EXECUTE FUNCTION sync_proposal_from_addon();

-- ────────────────────────────────────────────────────────────
-- ST-H-06: Goals missing columns
-- ────────────────────────────────────────────────────────────
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Company';

-- safe: only add deleted_at if missing
DO $$ BEGIN
  ALTER TABLE goals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE goal_key_results
  ADD COLUMN IF NOT EXISTS start_value NUMERIC NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE goal_key_results ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- ST-H-07: favorites.organization_id
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE favorites ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_favorites_org ON favorites(organization_id, user_id);

-- ────────────────────────────────────────────────────────────
-- ST-H-08: tasks time columns
-- ────────────────────────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

-- ────────────────────────────────────────────────────────────
-- ST-H-13: revenue_recognition.organization_id
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE revenue_recognition ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_rev_rec_org ON revenue_recognition(organization_id);

-- ────────────────────────────────────────────────────────────
-- ST-H-14: assets.asset_class discriminator
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_class TEXT NOT NULL DEFAULT 'equipment';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- ST-H-15: Automation runs trigger for run_count sync
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_automation_run_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE automations
  SET run_count = run_count + 1,
      last_run_at = COALESCE(NEW.started_at, NEW.ran_at, now())
  WHERE id = NEW.automation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_automation_run_stats ON automation_runs;
CREATE TRIGGER trg_automation_run_stats
  AFTER INSERT ON automation_runs
  FOR EACH ROW EXECUTE FUNCTION sync_automation_run_stats();

-- ────────────────────────────────────────────────────────────
-- ST-H-25: project_portals.deleted_at
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE project_portals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_project_portals_active ON project_portals(organization_id) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────
-- ST-M-05: proposals.project_end_date
-- ────────────────────────────────────────────────────────────
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS project_end_date DATE;

-- ────────────────────────────────────────────────────────────
-- ST-M-14: projects.client_id FK
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- ────────────────────────────────────────────────────────────
-- ST-M-18: compliance_documents.deleted_at
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE compliance_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- ST-M-23: work order number sequence
-- ────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS work_order_number_seq;

-- ────────────────────────────────────────────────────────────
-- ST-M-24: goals.category CHECK constraint
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE goals ADD CONSTRAINT goals_category_check
    CHECK (category IN ('Company','Team','Personal','Financial','Product','Customer'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- ST-M-29: production_advances.deleted_at
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE production_advances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- ST-L-04: deals.lost_date
-- ────────────────────────────────────────────────────────────
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_date TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────
-- ST-L-08: portfolio_library.deleted_at
-- ────────────────────────────────────────────────────────────
ALTER TABLE portfolio_library ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────
-- Apply updated_at triggers to new tables
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['project_costs']) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
