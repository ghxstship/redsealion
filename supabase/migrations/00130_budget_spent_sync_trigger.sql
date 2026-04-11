-- #35: Ensure budget.spent stays in sync with SUM(budget_line_items.actual_amount)
-- This trigger fires on INSERT/UPDATE/DELETE of budget_line_items and recalculates
-- the parent project_budgets.spent from actual_amount.

CREATE OR REPLACE FUNCTION public.sync_budget_spent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_budget_id UUID;
  new_spent NUMERIC(14,2);
BEGIN
  -- Determine which budget_id to update
  IF TG_OP = 'DELETE' THEN
    target_budget_id := OLD.budget_id;
  ELSE
    target_budget_id := NEW.budget_id;
  END IF;

  -- Recalculate spent from line items
  SELECT COALESCE(SUM(actual_amount), 0) INTO new_spent
  FROM public.budget_line_items
  WHERE budget_id = target_budget_id;

  UPDATE public.project_budgets
  SET spent = new_spent
  WHERE id = target_budget_id;

  -- Handle budget_id change (UPDATE moved to different budget)
  IF TG_OP = 'UPDATE' AND OLD.budget_id IS DISTINCT FROM NEW.budget_id THEN
    SELECT COALESCE(SUM(actual_amount), 0) INTO new_spent
    FROM public.budget_line_items
    WHERE budget_id = OLD.budget_id;

    UPDATE public.project_budgets
    SET spent = new_spent
    WHERE id = OLD.budget_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_budget_spent ON public.budget_line_items;
CREATE TRIGGER trg_sync_budget_spent
  AFTER INSERT OR UPDATE OR DELETE
  ON public.budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_budget_spent();
