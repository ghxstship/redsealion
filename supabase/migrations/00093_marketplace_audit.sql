-- Marketplace Bidding Audit Columns
-- Adds temporal tracking and user auditing for accepted/rejected bids

ALTER TABLE work_order_bids
  ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- We don't necessarily enforce accepted_by NOT NULL because a bid can be in pending state forever, or withdrawn.

-- Add index on resolved_at for timeline sorting or analytical queries
CREATE INDEX IF NOT EXISTS idx_work_order_bids_resolved ON work_order_bids(resolved_at) WHERE resolved_at IS NOT NULL;
