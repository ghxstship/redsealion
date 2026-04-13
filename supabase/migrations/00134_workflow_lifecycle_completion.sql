-- Migration 00134: Workflow lifecycle completion
-- Resolves Phase 3 dead-end workflow flags from the remediation inventory.
--
-- 1. goals: Add completed_at timestamp for lifecycle tracking
-- 2. portfolio_library: Add is_published + published_at for visibility control
-- 3. compliance_documents: Add renewal_reminder_sent + auto_renew flags
-- 4. goals: Add auto-complete trigger when progress hits 100%

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Goals — completed_at lifecycle timestamp
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Backfill: mark existing "completed" goals
UPDATE goals
  SET completed_at = updated_at
  WHERE status = 'completed' AND completed_at IS NULL;

-- Trigger: auto-set completed_at when status transitions to 'completed'
CREATE OR REPLACE FUNCTION fn_goals_set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at = NOW();
  END IF;
  -- Clear completed_at if reopened
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_goals_set_completed_at ON goals;
CREATE TRIGGER trg_goals_set_completed_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION fn_goals_set_completed_at();

-- Auto-complete trigger: when progress reaches 100, set status to completed
CREATE OR REPLACE FUNCTION fn_goals_auto_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progress >= 100 AND OLD.progress < 100 AND NEW.status != 'completed' THEN
    NEW.status = 'completed';
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_goals_auto_complete ON goals;
CREATE TRIGGER trg_goals_auto_complete
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION fn_goals_auto_complete();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Portfolio library — publish/unpublish visibility controls
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE portfolio_library
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS public_slug text;

-- Unique index for public slugs (per-org)
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_library_public_slug
  ON portfolio_library (organization_id, public_slug)
  WHERE public_slug IS NOT NULL AND deleted_at IS NULL;

-- Trigger: auto-set published_at when is_published transitions to true
CREATE OR REPLACE FUNCTION fn_portfolio_set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published IS DISTINCT FROM true) THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_portfolio_set_published_at ON portfolio_library;
CREATE TRIGGER trg_portfolio_set_published_at
  BEFORE UPDATE ON portfolio_library
  FOR EACH ROW
  EXECUTE FUNCTION fn_portfolio_set_published_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Compliance documents — renewal tracking enhancements
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE compliance_documents
  ADD COLUMN IF NOT EXISTS renewal_reminder_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS renewed_from_id uuid REFERENCES compliance_documents(id);

-- Index for fast expiry lookups (used by cron/edge functions)
CREATE INDEX IF NOT EXISTS idx_compliance_docs_expiry_pending
  ON compliance_documents (expiry_date, renewal_reminder_sent)
  WHERE expiry_date IS NOT NULL
    AND renewal_reminder_sent = false
    AND deleted_at IS NULL;

-- View: upcoming expirations (next 30 days) for notification queries
CREATE OR REPLACE VIEW v_compliance_expiring_soon AS
  SELECT
    cd.id,
    cd.crew_profile_id,
    cd.document_type,
    cd.document_name,
    cd.file_name,
    cd.expiry_date,
    cd.organization_id,
    cd.auto_renew,
    cd.renewal_reminder_sent,
    cd.expiry_date - CURRENT_DATE AS days_until_expiry
  FROM compliance_documents cd
  WHERE cd.expiry_date IS NOT NULL
    AND cd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND cd.deleted_at IS NULL
    AND cd.renewal_reminder_sent = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RLS policies for new columns
-- ═══════════════════════════════════════════════════════════════════════════

-- Portfolio public read (unauthenticated users can read published items)
DROP POLICY IF EXISTS "Portfolio public read" ON portfolio_library;
CREATE POLICY "Portfolio public read" ON portfolio_library
  FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

COMMIT;
