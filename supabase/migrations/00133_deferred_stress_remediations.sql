-- =============================================================================
-- Migration 00133: Deferred Stress Test Remediations
-- Resolves GAP-002, GAP-007, GAP-025
-- =============================================================================
-- GAP-002: Add organization_id to tables that genuinely need it
-- GAP-007: Cascade soft-delete trigger for proposals
-- GAP-025: Consolidate duplicate integration_sync_log(s) tables
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-002: Add organization_id to tables missing it
-- ─────────────────────────────────────────────────────────────────────────────

-- phases: derive org_id from parent proposal
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phases' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE phases ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    UPDATE phases SET organization_id = p.organization_id
    FROM proposals p WHERE phases.proposal_id = p.id;
    CREATE INDEX IF NOT EXISTS idx_phases_organization_id ON phases(organization_id);
  END IF;
END $$;

-- venues: derive org_id from parent proposal
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'venues' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE venues ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    UPDATE venues SET organization_id = p.organization_id
    FROM proposals p WHERE venues.proposal_id = p.id;
    CREATE INDEX IF NOT EXISTS idx_venues_organization_id ON venues(organization_id);
  END IF;
END $$;

-- schedule_blocks: derive org_id from parent production_schedule
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedule_blocks' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE schedule_blocks ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    UPDATE schedule_blocks sb SET organization_id = ps.organization_id
    FROM production_schedules ps WHERE sb.schedule_id = ps.id AND sb.organization_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_schedule_blocks_organization_id ON schedule_blocks(organization_id);
  END IF;
END $$;

-- quality_checklists: standalone lookup table, derive org_id from child quality_checks -> fabrication_orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quality_checklists' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE quality_checklists ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    UPDATE quality_checklists qc SET organization_id = sub.organization_id
    FROM (
      SELECT DISTINCT qch.checklist_id, fo.organization_id
      FROM quality_checks qch
      JOIN fabrication_orders fo ON qch.fabrication_order_id = fo.id
      WHERE fo.organization_id IS NOT NULL
    ) sub
    WHERE qc.id = sub.checklist_id AND qc.organization_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_quality_checklists_organization_id ON quality_checklists(organization_id);
  END IF;
END $$;

-- ai_messages: derive org_id from parent ai_conversations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_messages' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE ai_messages ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    UPDATE ai_messages am SET organization_id = ac.organization_id
    FROM ai_conversations ac WHERE am.conversation_id = ac.id;
    CREATE INDEX IF NOT EXISTS idx_ai_messages_organization_id ON ai_messages(organization_id);
  END IF;
END $$;

-- bluesky_accounts: derive org_id from creating user's membership
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bluesky_accounts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE bluesky_accounts ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    UPDATE bluesky_accounts ba SET organization_id = om.organization_id
    FROM organization_memberships om
    WHERE ba.user_id = om.user_id AND om.status = 'active'
    AND ba.organization_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_bluesky_accounts_organization_id ON bluesky_accounts(organization_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-007 prerequisite: Ensure deleted_at exists on child tables BEFORE triggers
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phases' AND column_name = 'deleted_at') THEN
    ALTER TABLE phases ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_phases_deleted_at ON phases(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'deleted_at') THEN
    ALTER TABLE venues ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_venues_deleted_at ON venues(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_assignments' AND column_name = 'deleted_at') THEN
    ALTER TABLE team_assignments ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_team_assignments_deleted_at ON team_assignments(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phase_deliverables' AND column_name = 'deleted_at') THEN
    ALTER TABLE phase_deliverables ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phase_addons' AND column_name = 'deleted_at') THEN
    ALTER TABLE phase_addons ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestone_gates' AND column_name = 'deleted_at') THEN
    ALTER TABLE milestone_gates ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-007: Cascade soft-delete trigger for proposals
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_cascade_proposal_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE phases SET deleted_at = NEW.deleted_at
      WHERE proposal_id = NEW.id AND deleted_at IS NULL;
    UPDATE venues SET deleted_at = NEW.deleted_at
      WHERE proposal_id = NEW.id AND deleted_at IS NULL;
    UPDATE team_assignments SET deleted_at = NEW.deleted_at
      WHERE proposal_id = NEW.id AND deleted_at IS NULL;
    BEGIN
      UPDATE proposal_comments SET deleted_at = NEW.deleted_at
        WHERE proposal_id = NEW.id AND deleted_at IS NULL;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
    BEGIN
      UPDATE proposal_scenarios SET deleted_at = NEW.deleted_at
        WHERE proposal_id = NEW.id AND deleted_at IS NULL;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
    INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.organization_id,
      NEW.updated_by,
      'cascade_soft_delete',
      'proposal',
      NEW.id,
      jsonb_build_object('cascaded_at', NEW.deleted_at)
    );
  END IF;

  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    UPDATE phases SET deleted_at = NULL
      WHERE proposal_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE venues SET deleted_at = NULL
      WHERE proposal_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE team_assignments SET deleted_at = NULL
      WHERE proposal_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_proposal_soft_delete ON proposals;
CREATE TRIGGER trg_cascade_proposal_soft_delete
  AFTER UPDATE OF deleted_at ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION fn_cascade_proposal_soft_delete();

CREATE OR REPLACE FUNCTION fn_cascade_phase_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE phase_deliverables SET deleted_at = NEW.deleted_at
      WHERE phase_id = NEW.id AND deleted_at IS NULL;
    UPDATE phase_addons SET deleted_at = NEW.deleted_at
      WHERE phase_id = NEW.id AND deleted_at IS NULL;
    UPDATE milestone_gates SET deleted_at = NEW.deleted_at
      WHERE phase_id = NEW.id AND deleted_at IS NULL;
  END IF;

  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    UPDATE phase_deliverables SET deleted_at = NULL
      WHERE phase_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE phase_addons SET deleted_at = NULL
      WHERE phase_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE milestone_gates SET deleted_at = NULL
      WHERE phase_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_phase_soft_delete ON phases;
CREATE TRIGGER trg_cascade_phase_soft_delete
  AFTER UPDATE OF deleted_at ON phases
  FOR EACH ROW
  EXECUTE FUNCTION fn_cascade_phase_soft_delete();


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-025: Consolidate duplicate integration_sync_log / integration_sync_logs
-- The SINGULAR table (integration_sync_log) has the richer schema
-- (direction, entity_type, entity_count, records_processed, etc.)
-- The PLURAL table (integration_sync_logs) is a simpler, older version.
-- Strategy: keep singular as canonical, rename to plural for convention.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'integration_sync_log'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'integration_sync_logs'
  ) THEN
    -- Drop the simpler plural table (older, less complete)
    DROP TABLE integration_sync_logs;

    -- Rename the richer singular table to the canonical plural name
    ALTER TABLE integration_sync_log RENAME TO integration_sync_logs;

    RAISE NOTICE 'Dropped old integration_sync_logs and renamed integration_sync_log to integration_sync_logs.';
  END IF;
END $$;

-- Backward-compatible view for any code still referencing the singular name
CREATE OR REPLACE VIEW integration_sync_log AS
  SELECT * FROM integration_sync_logs;

COMMIT;
