-- Migration 00117: Gap Audit Triggers (April 2026)
-- Covers: GAP-M-14 (goal progress auto-calc), GAP-L-04 (deals lost_date on stage change)

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-14: Auto-compute goals.progress from key results
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.goals
  SET progress = (
    SELECT COALESCE(
      ROUND(
        AVG(
          CASE
            WHEN kr.target IS NULL OR kr.target = 0 THEN 0
            ELSE LEAST(ROUND((kr.current / kr.target) * 100), 100)
          END
        )::NUMERIC,
        0
      )::INT,
      0
    )
    FROM public.goal_key_results kr
    WHERE kr.goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
      AND kr.deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_goal_progress ON public.goal_key_results;
CREATE TRIGGER trg_update_goal_progress
  AFTER INSERT OR UPDATE OF current, target, deleted_at OR DELETE
  ON public.goal_key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_goal_progress();

-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-04: Auto-set deals.lost_date when stage transitions to 'lost'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_deal_lost_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'lost' AND (OLD.stage IS DISTINCT FROM 'lost') THEN
    NEW.lost_date = now();
  END IF;
  -- Clear lost_date if deal is re-opened from lost
  IF OLD.stage = 'lost' AND NEW.stage != 'lost' THEN
    NEW.lost_date = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_deal_lost_date ON public.deals;
CREATE TRIGGER trg_set_deal_lost_date
  BEFORE UPDATE OF stage ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_deal_lost_date();
