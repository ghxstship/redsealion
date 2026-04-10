-- =============================================================================
-- Migration 00089: AI Module Remediation
--
-- Addresses gaps 06, 09, 17, 19, 20, 21, 22, 23, 25 from the AI gap audit.
-- - Enrich ai_conversations with status, model, token tracking, soft-delete
-- - Fix RLS policy overlap
-- - Add ai_usage_log table for per-request token/cost tracking
-- - Add ai_conversation_feedback table for response quality tracking
-- - Add composite index for performance
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enrich ai_conversations table (GAP-19, 20, 21, 22)
-- ---------------------------------------------------------------------------

-- GAP-22: Status column for conversation lifecycle
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'archived', 'pinned'));

-- GAP-20: Model column for tracking which AI model was used
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'claude-sonnet-4-20250514';

-- GAP-21: Token tracking at conversation level
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS total_input_tokens INTEGER NOT NULL DEFAULT 0;

ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS total_output_tokens INTEGER NOT NULL DEFAULT 0;

ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0;

-- GAP-19: Soft-delete support
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 2. Fix RLS policies (GAP-17)
-- ---------------------------------------------------------------------------

-- Drop the redundant SELECT policy that overlaps with the FOR ALL policy
DROP POLICY IF EXISTS "Users view own conversations" ON ai_conversations;

-- Drop and recreate the FOR ALL policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Users manage own conversations" ON ai_conversations;

CREATE POLICY "Users manage own conversations"
  ON ai_conversations
  FOR ALL
  USING (
    organization_id = auth_user_org_id()
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    organization_id = auth_user_org_id()
    AND user_id = auth.uid()
  );

-- Admin policy to view all org conversations (for audit/support)
CREATE POLICY "Admins view all org conversations"
  ON ai_conversations
  FOR SELECT
  USING (
    organization_id = auth_user_org_id()
    AND is_org_admin_or_above()
  );

-- ---------------------------------------------------------------------------
-- 3. Add composite index (GAP-23)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
  ON ai_conversations(organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_status
  ON ai_conversations(organization_id, status)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 4. AI Usage Log table (GAP-09)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  tool_calls_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
  ON ai_usage_log
  FOR SELECT
  USING (organization_id = auth_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Admins view all org usage"
  ON ai_usage_log
  FOR SELECT
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "System insert usage"
  ON ai_usage_log
  FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());

CREATE INDEX idx_ai_usage_log_org ON ai_usage_log(organization_id, created_at DESC);
CREATE INDEX idx_ai_usage_log_user ON ai_usage_log(organization_id, user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. AI Conversation Feedback table (GAP-26)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_conversation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_conversation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own feedback"
  ON ai_conversation_feedback
  FOR ALL
  USING (organization_id = auth_user_org_id() AND user_id = auth.uid())
  WITH CHECK (organization_id = auth_user_org_id() AND user_id = auth.uid());

CREATE INDEX idx_ai_feedback_conversation
  ON ai_conversation_feedback(conversation_id);
