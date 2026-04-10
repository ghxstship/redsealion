-- Migration 00118: Gap Audit Portfolio FKs (April 2026)
-- GAP-H-10: Ensure portfolio_library has enforced FK constraints to proposals and projects

ALTER TABLE public.portfolio_library
  DROP CONSTRAINT IF EXISTS portfolio_library_proposal_id_fkey;

ALTER TABLE public.portfolio_library
  DROP CONSTRAINT IF EXISTS portfolio_library_project_id_fkey;

ALTER TABLE public.portfolio_library
  ADD CONSTRAINT portfolio_library_proposal_id_fkey
    FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE SET NULL;

ALTER TABLE public.portfolio_library
  ADD CONSTRAINT portfolio_library_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- GAP-C-03: Ensure project_costs proposal_id FK exists (belt-and-suspenders guard)
-- (table was created in 00116 but if it pre-existed without FK, add it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'project_costs_proposal_id_fkey'
      AND table_name = 'project_costs'
  ) THEN
    ALTER TABLE public.project_costs
      ADD CONSTRAINT project_costs_proposal_id_fkey
        FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE CASCADE;
  END IF;
END $$;
