-- Migration: 00143_advance_catalog_item_supersession.sql

CREATE TABLE IF NOT EXISTS advance_catalog_item_supersession (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  predecessor_item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,
  successor_item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,

  effective_date DATE,
  change_summary TEXT,

  predecessor_status TEXT NOT NULL DEFAULT 'discontinued' CHECK (
    predecessor_status IN (
      'discontinued',       -- No longer available
      'legacy_available',   -- Still available but not recommended
      'end_of_life',        -- Available until stock depleted
      'recalled',           -- Withdrawn from service
      'reclassified'        -- Moved to different category (labor/regulatory)
    )
  ),

  -- Can successor be used in specs designed for predecessor without changes?
  backward_compatible BOOLEAN DEFAULT false,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(predecessor_item_id, successor_item_id)
);

CREATE INDEX idx_supersession_predecessor ON advance_catalog_item_supersession(predecessor_item_id);
CREATE INDEX idx_supersession_successor ON advance_catalog_item_supersession(successor_item_id);
CREATE INDEX idx_supersession_status ON advance_catalog_item_supersession(predecessor_status);

-- Recursive CTE: resolve full supersession chain in both directions
-- Split into two separate recursive CTEs because PostgreSQL does not allow
-- multiple recursive self-references in a single recursive CTE.
CREATE OR REPLACE FUNCTION resolve_supersession_chain(p_item_id UUID)
RETURNS TABLE (
  chain_position INTEGER,
  item_id UUID,
  item_name TEXT,
  status TEXT,
  effective_date DATE,
  change_summary TEXT
) AS $$
  WITH RECURSIVE
  -- Walk backwards: find all predecessors
  predecessors AS (
    SELECT
      0 AS chain_position,
      ci.id AS item_id,
      ci.name AS item_name,
      'current'::TEXT AS status,
      NULL::DATE AS effective_date,
      NULL::TEXT AS change_summary
    FROM advance_catalog_items ci
    WHERE ci.id = p_item_id

    UNION ALL

    SELECT
      p.chain_position - 1,
      cs.predecessor_item_id,
      ci.name,
      cs.predecessor_status,
      cs.effective_date,
      cs.change_summary
    FROM predecessors p
    JOIN advance_catalog_item_supersession cs ON cs.successor_item_id = p.item_id
    JOIN advance_catalog_items ci ON ci.id = cs.predecessor_item_id
    WHERE p.chain_position > -10
  ),
  -- Walk forwards: find all successors
  successors AS (
    SELECT
      0 AS chain_position,
      ci.id AS item_id,
      ci.name AS item_name,
      'current'::TEXT AS status,
      NULL::DATE AS effective_date,
      NULL::TEXT AS change_summary
    FROM advance_catalog_items ci
    WHERE ci.id = p_item_id

    UNION ALL

    SELECT
      s.chain_position + 1,
      cs.successor_item_id,
      ci.name,
      'successor'::TEXT,
      cs.effective_date,
      cs.change_summary
    FROM successors s
    JOIN advance_catalog_item_supersession cs ON cs.predecessor_item_id = s.item_id
    JOIN advance_catalog_items ci ON ci.id = cs.successor_item_id
    WHERE s.chain_position < 10
  ),
  -- Combine both directions (the anchor row at position 0 appears in both,
  -- so we deduplicate with DISTINCT ON)
  combined AS (
    SELECT * FROM predecessors
    UNION ALL
    SELECT * FROM successors WHERE chain_position <> 0
  )
  SELECT DISTINCT ON (combined.item_id) * FROM combined ORDER BY combined.item_id, combined.chain_position;
$$ LANGUAGE SQL STABLE;
