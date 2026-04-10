-- =============================================================================
-- Migration 00095: Emails Module Remediation
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- 1. EMAIL_THREADS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.email_threads
  ADD COLUMN IF NOT EXISTS provider_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_email_threads_provider_id ON public.email_threads(provider_thread_id) WHERE provider_thread_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 2. EMAIL_MESSAGES
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.email_messages
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS in_reply_to TEXT,
  ADD COLUMN IF NOT EXISTS "references" TEXT,
  ADD COLUMN IF NOT EXISTS bcc_emails TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_messages_provider_id ON public.email_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. EMAIL_TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS merge_fields TEXT[] NOT NULL DEFAULT '{}';

-- Retroactively set 'name' to 'event_type' for existing templates to satisfy upcoming NOT NULL
UPDATE public.email_templates SET name = event_type WHERE name IS NULL;

ALTER TABLE public.email_templates ALTER COLUMN name SET NOT NULL;
