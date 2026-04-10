-- ============================================================================
-- Migration 00108: Personal Workspaces Remediation
-- Fixes operational and functional gaps for My Documents, My Inbox, 
-- My Schedule, and My Tasks modules.
-- ============================================================================

-- ============================================================================
-- GAP-06: Notifications Schema Collision
-- Ensures all columns from both 00060 and 000831 migrations are present.
-- ============================================================================
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS body TEXT,
    ADD COLUMN IF NOT EXISTS source_type TEXT,
    ADD COLUMN IF NOT EXISTS source_id UUID,
    ADD COLUMN IF NOT EXISTS source_label TEXT,
    ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS actor_name TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_notifications_updated_at'
    AND tgrelid = 'public.notifications'::regclass
  ) THEN
    DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
    CREATE TRIGGER set_notifications_updated_at
      BEFORE UPDATE ON public.notifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END;
$$;

-- ============================================================================
-- GAP-02: User Documents Scope
-- Adding is_personal flag to file_attachments
-- ============================================================================
ALTER TABLE public.file_attachments
    ADD COLUMN IF NOT EXISTS is_personal BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- GAP-30: Task Time Blocking
-- Adding start_time and end_time to tasks
-- ============================================================================
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS end_time TIME;
