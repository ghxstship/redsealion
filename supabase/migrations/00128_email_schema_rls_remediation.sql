-- ============================================================
-- STRESS TEST AUDIT REMEDIATION — Batch 2 (Email, Schema, RLS)
-- Addresses: C-04, H-09, M-12
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- H-09: Add missing columns to email_messages
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.email_messages
  ADD COLUMN IF NOT EXISTS from_name TEXT,
  ADD COLUMN IF NOT EXISTS from_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS to_emails TEXT[],
  ADD COLUMN IF NOT EXISTS subject TEXT;

-- M-12: Add deal_title to email_threads for denormalized display
ALTER TABLE public.email_threads
  ADD COLUMN IF NOT EXISTS deal_title TEXT;

-- ────────────────────────────────────────────────────────────
-- C-04: Add INSERT/UPDATE/DELETE RLS policies for email tables
-- ────────────────────────────────────────────────────────────

-- email_threads: INSERT
DO $$ BEGIN
  DROP POLICY IF EXISTS "email_threads_insert" ON email_threads;
  CREATE POLICY "email_threads_insert" ON email_threads FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- email_threads: UPDATE
DO $$ BEGIN
  DROP POLICY IF EXISTS "email_threads_update" ON email_threads;
  CREATE POLICY "email_threads_update" ON email_threads FOR UPDATE
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- email_threads: DELETE (soft-delete pattern, admin only via app logic)
DO $$ BEGIN
  DROP POLICY IF EXISTS "email_threads_delete" ON email_threads;
  CREATE POLICY "email_threads_delete" ON email_threads FOR DELETE
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- email_messages: INSERT
DO $$ BEGIN
  DROP POLICY IF EXISTS "email_messages_insert" ON email_messages;
  CREATE POLICY "email_messages_insert" ON email_messages FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- email_messages: UPDATE
DO $$ BEGIN
  DROP POLICY IF EXISTS "email_messages_update" ON email_messages;
  CREATE POLICY "email_messages_update" ON email_messages FOR UPDATE
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- email_messages: DELETE
DO $$ BEGIN
  DROP POLICY IF EXISTS "email_messages_delete" ON email_messages;
  CREATE POLICY "email_messages_delete" ON email_messages FOR DELETE
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for email_messages by organization for faster org-scoped queries
CREATE INDEX IF NOT EXISTS idx_email_messages_org ON email_messages(organization_id);
