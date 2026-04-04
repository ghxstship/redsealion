-- =============================================================================
-- Bluesky / AT Protocol OAuth Infrastructure
-- =============================================================================
-- Stores linked Bluesky identities and AT Protocol OAuth session state.
-- Bluesky users authenticate via DID (decentralized identifier), not email.
-- This is designed as a "link account" model — users must have a FlyteDeck
-- account first, then optionally link their Bluesky identity.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Linked Bluesky accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bluesky_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  did TEXT NOT NULL UNIQUE,
  handle TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  dpop_key JSONB,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bluesky_accounts_did ON bluesky_accounts(did);
CREATE INDEX IF NOT EXISTS idx_bluesky_accounts_user_id ON bluesky_accounts(user_id);

-- RLS
ALTER TABLE bluesky_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY bluesky_accounts_select ON bluesky_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY bluesky_accounts_insert ON bluesky_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY bluesky_accounts_update ON bluesky_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY bluesky_accounts_delete ON bluesky_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- AT Protocol OAuth state store (CSRF prevention, short-lived)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atproto_oauth_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Auto-cleanup expired state
CREATE INDEX IF NOT EXISTS idx_atproto_oauth_state_expires
  ON atproto_oauth_state(expires_at);

-- ---------------------------------------------------------------------------
-- AT Protocol OAuth session store (access/refresh tokens)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atproto_oauth_sessions (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_atproto_oauth_sessions_expires
  ON atproto_oauth_sessions(expires_at);

-- Service-role only — these tables hold sensitive token material
ALTER TABLE atproto_oauth_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE atproto_oauth_sessions ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service role can access these tables
-- (which is correct — the OAuth client runs server-side only)
