-- Marketplace & Bidding Feature Parity
-- Adds marketplace functionality to work orders and bidding engine for crew

-- ═══════════════════════════════════════════════════════
-- 1. EXTEND WORK ORDERS FOR MARKETPLACE
-- ═══════════════════════════════════════════════════════

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS is_public_board BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bidding_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS budget_range TEXT;

CREATE INDEX IF NOT EXISTS idx_work_orders_public_board ON work_orders(is_public_board) WHERE is_public_board = true;

-- ═══════════════════════════════════════════════════════
-- 2. WORK ORDER BIDS TABLE
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS work_order_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  crew_profile_id UUID NOT NULL REFERENCES crew_profiles(id) ON DELETE CASCADE,
  
  proposed_amount NUMERIC NOT NULL,
  proposed_start TIMESTAMPTZ,
  proposed_end TIMESTAMPTZ,
  notes TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'withdrawn'
  )),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(work_order_id, crew_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_work_order_bids_org ON work_order_bids(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_order_bids_wo ON work_order_bids(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_bids_crew ON work_order_bids(crew_profile_id);

-- Apply updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'work_order_bids'::regclass
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at ON work_order_bids;
    CREATE TRIGGER set_updated_at 
    BEFORE UPDATE ON work_order_bids 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════
-- 3. BIDDING RLS POLICIES
-- ═══════════════════════════════════════════════════════

ALTER TABLE work_order_bids ENABLE ROW LEVEL SECURITY;

-- Admins can read all bids in their organization
DROP POLICY IF EXISTS "org_read_bids" ON work_order_bids;
CREATE POLICY "org_read_bids" ON work_order_bids 
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

-- Admins can update bids (e.g. to accept/reject)
DROP POLICY IF EXISTS "org_update_bids" ON work_order_bids;
CREATE POLICY "org_update_bids" ON work_order_bids 
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

-- Crew profiles can insert their own bids if the work order is public and under the same org
-- (Crew can bid if they belong to the organization. This restricts external unvetted contractors per typical config).
DROP POLICY IF EXISTS "crew_insert_bids" ON work_order_bids;
CREATE POLICY "crew_insert_bids" ON work_order_bids 
  FOR INSERT WITH CHECK (
    crew_profile_id IN (SELECT id FROM crew_profiles WHERE user_id = auth.uid())
    AND organization_id IN (SELECT user_org_ids())
    AND work_order_id IN (SELECT id FROM work_orders WHERE is_public_board = true)
  );

-- Crew can update their own pending bids (e.g. to withdraw or change amount)
DROP POLICY IF EXISTS "crew_update_bids" ON work_order_bids;
CREATE POLICY "crew_update_bids" ON work_order_bids 
  FOR UPDATE USING (
    crew_profile_id IN (SELECT id FROM crew_profiles WHERE user_id = auth.uid())
    AND status = 'pending'
  );

-- Also need to allow crew to read their OWN bids, even if not admin.
DROP POLICY IF EXISTS "crew_read_own_bids" ON work_order_bids;
CREATE POLICY "crew_read_own_bids" ON work_order_bids
  FOR SELECT USING (
    crew_profile_id IN (SELECT id FROM crew_profiles WHERE user_id = auth.uid())
  );

-- Allow crew to read public work orders
DROP POLICY IF EXISTS "crew_read_public_work_orders" ON work_orders;
CREATE POLICY "crew_read_public_work_orders" ON work_orders
  FOR SELECT USING (
    is_public_board = true
    AND organization_id IN (SELECT user_org_ids())
  );
