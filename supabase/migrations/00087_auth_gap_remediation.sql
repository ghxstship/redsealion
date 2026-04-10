-- ============================================================
-- 00087: Auth Gap Remediation
-- Addresses schema gaps identified in the auth module audit.
-- ============================================================

-- C-02: Add subscription_status to organizations
-- The middleware reads this column for subscription enforcement.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'cancelled', 'paused'));

-- M-03: Add login tracking fields to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_ip INET;

-- ============================================================
-- M-04: Auth events table for security audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'signup', 'login_success', 'login_failed',
    'password_reset_requested', 'password_reset_completed',
    'mfa_enrolled', 'mfa_verified', 'mfa_disabled',
    'oauth_linked', 'oauth_unlinked',
    'session_created', 'session_revoked',
    'account_suspended', 'account_deactivated', 'account_reactivated',
    'invitation_accepted', 'org_created'
  )),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user ON public.auth_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_org ON public.auth_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON public.auth_events(event_type, created_at DESC);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Users can see their own events
CREATE POLICY "auth_events_select_own" ON public.auth_events FOR SELECT
  USING (user_id = auth.uid());

-- Org admins can see org events
CREATE POLICY "auth_events_select_admin" ON public.auth_events FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.check_permission(auth.uid(), 'manage', 'settings', 'organization', organization_id)
  );

-- System/service role can insert
CREATE POLICY "auth_events_insert_service" ON public.auth_events FOR INSERT
  WITH CHECK (true);
