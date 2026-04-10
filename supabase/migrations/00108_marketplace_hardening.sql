-- Marketplace Hardening Migration
-- Addresses gaps #9, #14, #15 from the operational audit

-- ═══════════════════════════════════════════════════════
-- 1. BID STATUS ENUM TYPE (Gap #14)
-- Replace TEXT CHECK with proper enum for type safety
-- ═══════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bid_status') THEN
    CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
  END IF;
END;
$$;

-- Migrate the column from TEXT to enum safely
DROP POLICY IF EXISTS "crew_update_bids" ON work_order_bids;

-- Drop the old CHECK constraint (it's no longer needed with enum)
ALTER TABLE work_order_bids
  DROP CONSTRAINT IF EXISTS work_order_bids_status_check;

ALTER TABLE work_order_bids
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE work_order_bids
  ALTER COLUMN status TYPE bid_status USING status::bid_status;

ALTER TABLE work_order_bids
  ALTER COLUMN status SET DEFAULT 'pending';

CREATE POLICY "crew_update_bids" ON work_order_bids 
  FOR UPDATE USING (
    crew_profile_id IN (SELECT id FROM crew_profiles WHERE user_id = auth.uid())
    AND status = 'pending'
  );

-- ═══════════════════════════════════════════════════════
-- 2. BID ACTIVITY LOG TABLE (Gap #15)
-- Tracks bid status transitions for audit/dispute resolution
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS work_order_bid_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES work_order_bids(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_status bid_status,
  to_status bid_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bid_status_log_bid ON work_order_bid_status_log(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_status_log_org ON work_order_bid_status_log(organization_id);

-- RLS for bid status log
ALTER TABLE work_order_bid_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_bid_status_log" ON work_order_bid_status_log
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "org_insert_bid_status_log" ON work_order_bid_status_log
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════
-- 3. SOFT DELETE ON BIDS (Gap from initial audit)
-- Adds deleted_at for consistency with other core entities
-- ═══════════════════════════════════════════════════════

ALTER TABLE work_order_bids
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_work_order_bids_deleted ON work_order_bids(deleted_at) WHERE deleted_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- 4. CLIENT_ID ON WORK ORDERS (Gap #9)
-- Direct FK to preserve client context for marketplace/invoicing
-- ═══════════════════════════════════════════════════════

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

CREATE INDEX IF NOT EXISTS idx_work_orders_client ON work_orders(client_id) WHERE client_id IS NOT NULL;

-- Backfill: populate client_id from the linked proposal (if any)
UPDATE work_orders
SET client_id = proposals.client_id
FROM proposals
WHERE work_orders.proposal_id = proposals.id
  AND work_orders.client_id IS NULL
  AND proposals.client_id IS NOT NULL;
