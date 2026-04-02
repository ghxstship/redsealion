-- Sprint 1: Subscription tier helpers and proposal pipeline columns

-- ============================================================
-- SUBSCRIPTION TIER HELPERS
-- ============================================================

-- Get current user's organization subscription tier
CREATE OR REPLACE FUNCTION auth_user_subscription_tier()
RETURNS subscription_tier AS $$
  SELECT o.subscription_tier
  FROM organizations o
  JOIN users u ON u.organization_id = o.id
  WHERE u.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Compare tiers: returns TRUE if the org's tier >= the required tier
CREATE OR REPLACE FUNCTION tier_has_access(required subscription_tier)
RETURNS BOOLEAN AS $$
  SELECT CASE auth_user_subscription_tier()
    WHEN 'enterprise' THEN true
    WHEN 'professional' THEN required IN ('free', 'starter', 'professional')
    WHEN 'starter' THEN required IN ('free', 'starter')
    WHEN 'free' THEN required = 'free'
    ELSE false
  END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROPOSAL PIPELINE COLUMNS
-- ============================================================

-- Deal stage for CRM pipeline tracking
CREATE TYPE deal_stage AS ENUM (
  'lead',
  'qualified',
  'proposal_sent',
  'negotiation',
  'verbal_yes',
  'contract_signed',
  'lost',
  'on_hold'
);

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS deal_stage deal_stage DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS expected_close_date DATE,
  ADD COLUMN IF NOT EXISTS pipeline_id UUID;
