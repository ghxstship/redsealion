-- ============================================================
-- 00149: Project Role Permission Foundation
--
-- Closes gap-register tickets C-RBAC-01 and C-RBAC-02.
--
-- 1. Seeds 12 canonical project-role rows into public.roles
--    with UUID block 00000000-0000-0000-0000-00000000030N
--    matching the project_role enum values set in 00148.
-- 2. Creates role_permission_bundles table (DB-side SSOT for
--    project-role authorization) with RLS.
-- 3. Seeds permission bundles derived from
--    docs/audit/role-lifecycle/01-role-inventory-matrix.md.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Seed canonical project roles into public.roles
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.roles (id, name, display_name, description, scope, hierarchy_level, is_system) VALUES
  ('00000000-0000-0000-0000-000000000301', 'executive',  'Executive',  'Governance, project admin, budget approval, closeout authority.', 'project',  5, true),
  ('00000000-0000-0000-0000-000000000302', 'production', 'Production', 'Project management, event/activation control, advance approval.', 'project', 10, true),
  ('00000000-0000-0000-0000-000000000303', 'management', 'Management', 'Logistics, vendor and shift management, purchase order write.', 'project', 15, true),
  ('00000000-0000-0000-0000-000000000304', 'crew',       'Crew',       'Shift execution, task updates, timesheet submission, incident logging.', 'project', 30, true),
  ('00000000-0000-0000-0000-000000000305', 'staff',      'Staff',      'On-site staff operations, check-in, incident logging.', 'project', 35, true),
  ('00000000-0000-0000-0000-000000000306', 'talent',     'Talent',     'Performance, hospitality, advance update, rider fulfillment.', 'project', 20, true),
  ('00000000-0000-0000-0000-000000000307', 'vendor',     'Vendor',     'External supplier; advance update, invoice write, BOL write, asset management.', 'project', 25, true),
  ('00000000-0000-0000-0000-000000000308', 'client',     'Client',     'Read + approval authority over project deliverables, invoices, settlements.', 'project', 12, true),
  ('00000000-0000-0000-0000-000000000309', 'sponsor',    'Sponsor',    'Activation read, brand guideline write, proof review.', 'project', 22, true),
  ('00000000-0000-0000-0000-000000000310', 'press',      'Press',      'Credentialed media access, zone access, asset read.', 'project', 40, true),
  ('00000000-0000-0000-0000-000000000311', 'guest',      'Guest',      'Credentialed non-performing invitee, zone access, inventory read.', 'project', 45, true),
  ('00000000-0000-0000-0000-000000000312', 'attendee',   'Attendee',   'General admission; credentialed zone access only.', 'project', 50, true)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  display_name    = EXCLUDED.display_name,
  description     = EXCLUDED.description,
  scope           = EXCLUDED.scope,
  hierarchy_level = EXCLUDED.hierarchy_level,
  is_system       = EXCLUDED.is_system,
  updated_at      = now();


-- ─────────────────────────────────────────────────────────────
-- STEP 2: role_permission_bundles table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_permission_bundles (
  role        project_role NOT NULL,
  resource    text         NOT NULL,
  action      text         NOT NULL CHECK (action IN
    ('create','read','update','delete','manage','invite',
     'approve','export','configure','bulk_invite','impersonate')),
  allow       boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (role, resource, action)
);

COMMENT ON TABLE public.role_permission_bundles IS
  'Canonical project-role permission matrix. DB SSOT consumed by src/lib/permissions.ts::DEFAULT_PROJECT_PERMISSIONS via codegen.';

CREATE INDEX IF NOT EXISTS idx_role_permission_bundles_role
  ON public.role_permission_bundles(role);

ALTER TABLE public.role_permission_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY bundles_read ON public.role_permission_bundles
  FOR SELECT USING (true);

CREATE POLICY bundles_write ON public.role_permission_bundles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships m
      JOIN public.roles r ON r.id = m.role_id
      WHERE m.user_id = auth.uid()
        AND m.status  = 'active'
        AND r.name IN ('platform_superadmin','platform_admin','owner','admin')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Seed bundles per 01-role-inventory-matrix.md
-- Resources below are a minimal bootstrap set. Full matrix
-- (every PermissionResource x every action) will be regenerated
-- from scripts/generate-rbac.ts in a follow-up.
-- ─────────────────────────────────────────────────────────────

-- Helper: wildcard expansion handled inline; keep rows explicit.

-- EXECUTIVE — full project authority
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('executive','projects','create'), ('executive','projects','read'), ('executive','projects','update'), ('executive','projects','delete'), ('executive','projects','manage'), ('executive','projects','approve'),
  ('executive','advances','read'), ('executive','advances','update'), ('executive','advances','approve'),
  ('executive','purchase_orders','read'), ('executive','purchase_orders','approve'),
  ('executive','invoices','read'), ('executive','invoices','approve'),
  ('executive','budgets','read'), ('executive','budgets','update'), ('executive','budgets','approve'),
  ('executive','settings','read'), ('executive','settings','update'),
  ('executive','reports','read'), ('executive','reports','export'),
  ('executive','finance','read'), ('executive','finance','approve'),
  ('executive','compliance','read'), ('executive','compliance','approve'),
  ('executive','crew','read'), ('executive','crew','manage'),
  ('executive','vendors','read'), ('executive','vendors','manage'),
  ('executive','clients','read'), ('executive','clients','manage'),
  ('executive','events','read'), ('executive','events','manage'),
  ('executive','activations','read'), ('executive','activations','manage')
ON CONFLICT DO NOTHING;

-- PRODUCTION — manage everything operationally; cannot approve settlement/closeout
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('production','projects','read'), ('production','projects','update'),
  ('production','events','create'), ('production','events','read'), ('production','events','update'), ('production','events','manage'),
  ('production','activations','create'), ('production','activations','read'), ('production','activations','update'),
  ('production','advances','create'), ('production','advances','read'), ('production','advances','update'), ('production','advances','approve'),
  ('production','crew','create'), ('production','crew','read'), ('production','crew','update'), ('production','crew','invite'),
  ('production','schedule','create'), ('production','schedule','read'), ('production','schedule','update'),
  ('production','tasks','create'), ('production','tasks','read'), ('production','tasks','update'),
  ('production','dispatch','read'), ('production','dispatch','update'),
  ('production','locations','read'), ('production','locations','update'),
  ('production','spaces','read'), ('production','spaces','update'),
  ('production','zones','read'), ('production','zones','update'),
  ('production','manifest','read'), ('production','manifest','update'),
  ('production','compliance','read'), ('production','compliance','update'),
  ('production','reports','read')
ON CONFLICT DO NOTHING;

-- MANAGEMENT — logistics + vendor + shift
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('management','schedule','create'), ('management','schedule','read'), ('management','schedule','update'),
  ('management','tasks','create'), ('management','tasks','read'), ('management','tasks','update'),
  ('management','crew','read'), ('management','crew','update'),
  ('management','vendors','read'), ('management','vendors','update'),
  ('management','purchase_orders','create'), ('management','purchase_orders','read'), ('management','purchase_orders','update'),
  ('management','dispatch','read'), ('management','dispatch','update'),
  ('management','work_orders','create'), ('management','work_orders','read'), ('management','work_orders','update'),
  ('management','equipment','read'), ('management','equipment','update'),
  ('management','manifest','read'), ('management','manifest','update'),
  ('management','locations','read'),
  ('management','spaces','read'),
  ('management','zones','read'),
  ('management','compliance','read'),
  ('management','time_tracking','read'), ('management','time_tracking','approve')
ON CONFLICT DO NOTHING;

-- CREW — shift + timesheet + task + incident
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('crew','schedule','read'),
  ('crew','tasks','read'), ('crew','tasks','update'),
  ('crew','time_tracking','create'), ('crew','time_tracking','read'), ('crew','time_tracking','update'),
  ('crew','manifest','read'),
  ('crew','equipment','read')
ON CONFLICT DO NOTHING;

-- STAFF — subset of crew
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('staff','schedule','read'),
  ('staff','tasks','read'),
  ('staff','time_tracking','create'), ('staff','time_tracking','read')
ON CONFLICT DO NOTHING;

-- TALENT — rider + hospitality + performance
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('talent','schedule','read'),
  ('talent','advances','read'), ('talent','advances','update'),
  ('talent','compliance','read')
ON CONFLICT DO NOTHING;

-- VENDOR — advance + invoice + BOL + asset
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('vendor','advances','read'), ('vendor','advances','update'),
  ('vendor','invoices','create'), ('vendor','invoices','read'), ('vendor','invoices','update'),
  ('vendor','purchase_orders','read'),
  ('vendor','equipment','read'), ('vendor','equipment','update'),
  ('vendor','manifest','read'), ('vendor','manifest','update'),
  ('vendor','compliance','read')
ON CONFLICT DO NOTHING;

-- CLIENT — read + approve
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('client','projects','read'),
  ('client','proposals','read'), ('client','proposals','approve'),
  ('client','invoices','read'), ('client','invoices','approve'),
  ('client','reports','read'),
  ('client','events','read')
ON CONFLICT DO NOTHING;

-- SPONSOR — activation + brand
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('sponsor','activations','read'),
  ('sponsor','events','read'),
  ('sponsor','reports','read')
ON CONFLICT DO NOTHING;

-- PRESS — credentialed access + read
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('press','events','read'),
  ('press','files','read')
ON CONFLICT DO NOTHING;

-- GUEST — minimal
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('guest','events','read')
ON CONFLICT DO NOTHING;

-- ATTENDEE — minimal
INSERT INTO public.role_permission_bundles (role, resource, action) VALUES
  ('attendee','events','read')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Permission lookup RPC (DB SSOT for guards)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_project_role_allows(
  p_role     project_role,
  p_resource text,
  p_action   text
) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT allow
       FROM public.role_permission_bundles
      WHERE role = p_role
        AND resource = p_resource
        AND action   = p_action
      LIMIT 1),
    false
  );
$$;

COMMENT ON FUNCTION public.fn_project_role_allows IS
  'Returns whether a project-role is permitted a {resource,action}. Callers should pass the RPC action vocabulary (create/read/update/delete/manage/invite/approve/export/configure).';


-- ============================================================
-- End of 00149
-- ============================================================
