-- ============================================================
-- FLYTEDECK — Comprehensive Demo Seed Data
-- ============================================================
-- Canonical test data for all 14 roles (10 platform + 4 project),
-- all 4 subscription tiers, and all 50+ application modules.
--
-- Role architecture: Two-Tier RBAC (migration 00135)
--   Platform: developer, owner, admin, controller, collaborator,
--             contractor, crew, client, viewer, community
--   Project:  project_creator, project_collaborator,
--             project_viewer, project_vendor
--
-- Password for all test users: TestPass!2026
-- Email format: {role}@redsealion.test
--
-- UUID format: deterministic, e2e-prefixed for easy cleanup
-- ============================================================

-- ─── Fail-safe: abort on any error ─────────────────────────
\set ON_ERROR_STOP on

DO $$
DECLARE
  -- ═══════════════════════════════════════════════════════════
  -- ORGANIZATIONS (one per subscription tier)
  -- ═══════════════════════════════════════════════════════════
  v_org_free         UUID := 'e2e00000-0000-4000-a000-000000000001';
  v_org_starter      UUID := 'e2e00000-0000-4000-a000-000000000002';
  v_org_pro          UUID := 'e2e00000-0000-4000-a000-000000000003';
  v_org_ent          UUID := 'e2e00000-0000-4000-a000-000000000004';

  -- Primary org for most test data (enterprise = max feature access)
  v_org              UUID := 'e2e00000-0000-4000-a000-000000000004';

  -- ═══════════════════════════════════════════════════════════
  -- USERS — 10 platform roles
  -- ═══════════════════════════════════════════════════════════
  v_u_developer      UUID := 'e2e00000-0000-4000-b000-000000000001';
  v_u_owner          UUID := 'e2e00000-0000-4000-b000-000000000002';
  v_u_admin          UUID := 'e2e00000-0000-4000-b000-000000000003';
  v_u_controller     UUID := 'e2e00000-0000-4000-b000-000000000004';
  v_u_collaborator   UUID := 'e2e00000-0000-4000-b000-000000000005';
  v_u_contractor     UUID := 'e2e00000-0000-4000-b000-000000000006';
  v_u_crew           UUID := 'e2e00000-0000-4000-b000-000000000007';
  v_u_client         UUID := 'e2e00000-0000-4000-b000-000000000008';
  v_u_viewer         UUID := 'e2e00000-0000-4000-b000-000000000009';
  v_u_community      UUID := 'e2e00000-0000-4000-b000-000000000010';

  -- USERS — 4 project roles (separate users to isolate project-scope testing)
  v_u_proj_creator      UUID := 'e2e00000-0000-4000-b000-000000000011';
  v_u_proj_collaborator UUID := 'e2e00000-0000-4000-b000-000000000012';
  v_u_proj_viewer       UUID := 'e2e00000-0000-4000-b000-000000000013';
  v_u_proj_vendor       UUID := 'e2e00000-0000-4000-b000-000000000014';

  -- ═══════════════════════════════════════════════════════════
  -- ROLE IDs — canonical post-00135 values
  -- ═══════════════════════════════════════════════════════════
  v_role_developer      UUID := '00000000-0000-0000-0000-000000000001';
  v_role_owner          UUID := '00000000-0000-0000-0000-000000000010';
  v_role_admin          UUID := '00000000-0000-0000-0000-000000000020';
  v_role_controller     UUID := '00000000-0000-0000-0000-000000000025';
  v_role_collaborator   UUID := '00000000-0000-0000-0000-000000000030';
  v_role_crew           UUID := '00000000-0000-0000-0000-000000000045';
  v_role_viewer         UUID := '00000000-0000-0000-0000-000000000050';
  v_role_client         UUID := '00000000-0000-0000-0000-000000000055';
  v_role_contractor     UUID := '00000000-0000-0000-0000-000000000060';
  v_role_community      UUID := '00000000-0000-0000-0000-000000000070';
  v_role_proj_creator      UUID := '00000000-0000-0000-0000-000000000201';
  v_role_proj_collaborator UUID := '00000000-0000-0000-0000-000000000203';
  v_role_proj_viewer       UUID := '00000000-0000-0000-0000-000000000204';
  v_role_proj_vendor       UUID := '00000000-0000-0000-0000-000000000205';

  -- ═══════════════════════════════════════════════════════════
  -- ENTITY IDs — deterministic for all seeded data
  -- ═══════════════════════════════════════════════════════════
  v_team             UUID := 'e2e00000-0000-4000-c000-000000000001';
  v_project          UUID := 'e2e00000-0000-4000-c000-000000000002';
  v_project2         UUID := 'e2e00000-0000-4000-c000-000000000003';
  v_client1          UUID := 'e2e00000-0000-4000-d000-000000000001';
  v_client2          UUID := 'e2e00000-0000-4000-d000-000000000002';
  v_proposal1        UUID := 'e2e00000-0000-4000-e000-000000000001';
  v_proposal2        UUID := 'e2e00000-0000-4000-e000-000000000002';
  v_proposal3        UUID := 'e2e00000-0000-4000-e000-000000000003';
  v_deal1            UUID := 'e2e00000-0000-4000-e100-000000000001';
  v_deal2            UUID := 'e2e00000-0000-4000-e100-000000000002';
  v_invoice1         UUID := 'e2e00000-0000-4000-e200-000000000001';
  v_invoice2         UUID := 'e2e00000-0000-4000-e200-000000000002';
  v_task1            UUID := 'e2e00000-0000-4000-e300-000000000001';
  v_task2            UUID := 'e2e00000-0000-4000-e300-000000000002';
  v_task3            UUID := 'e2e00000-0000-4000-e300-000000000003';
  v_lead1            UUID := 'e2e00000-0000-4000-e400-000000000001';
  v_lead2            UUID := 'e2e00000-0000-4000-e400-000000000002';
  v_event1           UUID := 'e2e00000-0000-4000-e500-000000000001';
  v_event2           UUID := 'e2e00000-0000-4000-e500-000000000002';
  v_location1        UUID := 'e2e00000-0000-4000-e600-000000000001';
  v_location2        UUID := 'e2e00000-0000-4000-e600-000000000002';
  v_crew_profile1    UUID := 'e2e00000-0000-4000-e700-000000000001';
  v_crew_profile2    UUID := 'e2e00000-0000-4000-e700-000000000002';
  v_asset1           UUID := 'e2e00000-0000-4000-e800-000000000001';
  v_asset2           UUID := 'e2e00000-0000-4000-e800-000000000002';
  v_asset3           UUID := 'e2e00000-0000-4000-e800-000000000003';
  v_workorder1       UUID := 'e2e00000-0000-4000-e900-000000000001';
  v_workorder2       UUID := 'e2e00000-0000-4000-e900-000000000002';
  v_expense1         UUID := 'e2e00000-0000-4000-ea00-000000000001';
  v_expense2         UUID := 'e2e00000-0000-4000-ea00-000000000002';
  v_timeentry1       UUID := 'e2e00000-0000-4000-eb00-000000000001';
  v_timeentry2       UUID := 'e2e00000-0000-4000-eb00-000000000002';
  v_goal1            UUID := 'e2e00000-0000-4000-ec00-000000000001';
  v_goal2            UUID := 'e2e00000-0000-4000-ec00-000000000002';
  v_advance1         UUID := 'e2e00000-0000-4000-ed00-000000000001';
  v_advance2         UUID := 'e2e00000-0000-4000-ed00-000000000002';
  v_campaign1        UUID := 'e2e00000-0000-4000-ee00-000000000001';
  v_automation1      UUID := 'e2e00000-0000-4000-ef00-000000000001';
  v_po1              UUID := 'e2e00000-0000-4000-f000-000000000001';
  v_vendor1          UUID := 'e2e00000-0000-4000-f100-000000000001';
  v_faborder1        UUID := 'e2e00000-0000-4000-f200-000000000001';
  v_rental1          UUID := 'e2e00000-0000-4000-f300-000000000001';
  v_schedule1        UUID := 'e2e00000-0000-4000-f400-000000000001';
  v_template1        UUID := 'e2e00000-0000-4000-f500-000000000001';
  v_portal1          UUID := 'e2e00000-0000-4000-f600-000000000001';
  v_notification1    UUID := 'e2e00000-0000-4000-f700-000000000001';
  v_notification2    UUID := 'e2e00000-0000-4000-f700-000000000002';
  v_budget1          UUID := 'e2e00000-0000-4000-f800-000000000001';
  v_activation1      UUID := 'e2e00000-0000-4000-f900-000000000001';
  v_facility1        UUID := 'e2e00000-0000-4000-fa00-000000000001';
  v_pipeline1        UUID := 'e2e00000-0000-4000-fb00-000000000001';
  v_terms1           UUID := 'e2e00000-0000-4000-fc00-000000000001';
  v_booking1         UUID := 'e2e00000-0000-4000-fd00-000000000001';

  -- Utility
  v_encrypted_pw     TEXT;
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- 1. ORGANIZATIONS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.organizations (id, name, slug, subscription_tier, currency, timezone, language, invoice_prefix, proposal_prefix, date_format, time_format, first_day_of_week, number_format)
  VALUES
    (v_org_free,    'FlyteDeck Free Demo',    'fd-demo-free',    'free',         'USD', 'America/New_York', 'en-US', 'FD-F', 'FD-F', 'MM/DD/YYYY', '12h', 0, 'en-US'),
    (v_org_starter, 'FlyteDeck Starter Demo', 'fd-demo-starter', 'starter',     'USD', 'America/New_York', 'en-US', 'FD-S', 'FD-S', 'MM/DD/YYYY', '12h', 0, 'en-US'),
    (v_org_pro,     'FlyteDeck Pro Demo',     'fd-demo-pro',     'professional','USD', 'America/New_York', 'en-US', 'FD-P', 'FD-P', 'MM/DD/YYYY', '12h', 0, 'en-US'),
    (v_org_ent,     'FlyteDeck Enterprise',   'fd-demo-ent',     'enterprise',  'USD', 'America/New_York', 'en-US', 'FD-E', 'FD-E', 'MM/DD/YYYY', '12h', 0, 'en-US')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    subscription_tier = EXCLUDED.subscription_tier;

  -- ═══════════════════════════════════════════════════════════
  -- 2. AUTH USERS  (GoTrue requires token columns to be '' not NULL)
  -- ═══════════════════════════════════════════════════════════
  v_encrypted_pw := crypt('TestPass!2026', gen_salt('bf'));

  -- Platform role users
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, created_at, updated_at) VALUES
    ('00000000-0000-0000-0000-000000000000', v_u_developer,    'authenticated', 'authenticated', 'developer@redsealion.test',    v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Developer"}'::jsonb, '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_owner,        'authenticated', 'authenticated', 'owner@redsealion.test',        v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Owner"}'::jsonb,     '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_admin,        'authenticated', 'authenticated', 'admin@redsealion.test',        v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Admin"}'::jsonb,     '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_controller,   'authenticated', 'authenticated', 'controller@redsealion.test',   v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Controller"}'::jsonb,'', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_collaborator, 'authenticated', 'authenticated', 'collaborator@redsealion.test', v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Collaborator"}'::jsonb, '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_contractor,   'authenticated', 'authenticated', 'contractor@redsealion.test',   v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Contractor"}'::jsonb,'', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_crew,         'authenticated', 'authenticated', 'crew@redsealion.test',         v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Crew"}'::jsonb,      '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_client,       'authenticated', 'authenticated', 'client@redsealion.test',       v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Client"}'::jsonb,    '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_viewer,       'authenticated', 'authenticated', 'viewer@redsealion.test',       v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Viewer"}'::jsonb,    '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_community,    'authenticated', 'authenticated', 'community@redsealion.test',    v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Community"}'::jsonb, '', '', '', '', '', now(), now()),
    -- Project role users
    ('00000000-0000-0000-0000-000000000000', v_u_proj_creator,      'authenticated', 'authenticated', 'proj-creator@redsealion.test',      v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Project Creator"}'::jsonb,      '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_proj_collaborator, 'authenticated', 'authenticated', 'proj-collaborator@redsealion.test', v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Project Collaborator"}'::jsonb, '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_proj_viewer,       'authenticated', 'authenticated', 'proj-viewer@redsealion.test',       v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Project Viewer"}'::jsonb,       '', '', '', '', '', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_u_proj_vendor,       'authenticated', 'authenticated', 'proj-vendor@redsealion.test',       v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Project Vendor"}'::jsonb,       '', '', '', '', '', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 3. PUBLIC USERS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.users (id, email, full_name, first_name, last_name, status) VALUES
    (v_u_developer,         'developer@redsealion.test',         'Demo Developer',             'Demo', 'Developer',             'active'),
    (v_u_owner,             'owner@redsealion.test',             'Demo Owner',                 'Demo', 'Owner',                 'active'),
    (v_u_admin,             'admin@redsealion.test',             'Demo Admin',                 'Demo', 'Admin',                 'active'),
    (v_u_controller,        'controller@redsealion.test',        'Demo Controller',            'Demo', 'Controller',            'active'),
    (v_u_collaborator,      'collaborator@redsealion.test',      'Demo Collaborator',          'Demo', 'Collaborator',          'active'),
    (v_u_contractor,        'contractor@redsealion.test',        'Demo Contractor',            'Demo', 'Contractor',            'active'),
    (v_u_crew,              'crew@redsealion.test',              'Demo Crew',                  'Demo', 'Crew',                  'active'),
    (v_u_client,            'client@redsealion.test',            'Demo Client',                'Demo', 'Client',                'active'),
    (v_u_viewer,            'viewer@redsealion.test',            'Demo Viewer',                'Demo', 'Viewer',                'active'),
    (v_u_community,         'community@redsealion.test',         'Demo Community',             'Demo', 'Community',             'active'),
    (v_u_proj_creator,      'proj-creator@redsealion.test',      'Demo Project Creator',       'Demo', 'Project Creator',       'active'),
    (v_u_proj_collaborator, 'proj-collaborator@redsealion.test', 'Demo Project Collaborator',  'Demo', 'Project Collaborator',  'active'),
    (v_u_proj_viewer,       'proj-viewer@redsealion.test',       'Demo Project Viewer',        'Demo', 'Project Viewer',        'active'),
    (v_u_proj_vendor,       'proj-vendor@redsealion.test',       'Demo Project Vendor',        'Demo', 'Project Vendor',        'active')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status;

  -- ═══════════════════════════════════════════════════════════
  -- 4. ORGANIZATION MEMBERSHIPS
  -- ═══════════════════════════════════════════════════════════
  -- All platform role users → enterprise org (primary test env)
  INSERT INTO public.organization_memberships (organization_id, user_id, role_id, seat_type, status, joined_via) VALUES
    -- Internal roles
    (v_org, v_u_developer,    v_role_developer,    'internal', 'active', 'manual_add'),
    (v_org, v_u_owner,        v_role_owner,        'internal', 'active', 'manual_add'),
    (v_org, v_u_admin,        v_role_admin,        'internal', 'active', 'manual_add'),
    (v_org, v_u_controller,   v_role_controller,   'internal', 'active', 'manual_add'),
    (v_org, v_u_collaborator, v_role_collaborator, 'internal', 'active', 'manual_add'),
    -- External roles
    (v_org, v_u_contractor,   v_role_contractor,   'external', 'active', 'manual_add'),
    (v_org, v_u_crew,         v_role_crew,         'external', 'active', 'manual_add'),
    (v_org, v_u_client,       v_role_client,       'external', 'active', 'manual_add'),
    (v_org, v_u_viewer,       v_role_viewer,       'external', 'active', 'manual_add'),
    (v_org, v_u_community,    v_role_community,    'external', 'active', 'manual_add'),
    -- Project-scoped users need org membership too (collaborator level)
    (v_org, v_u_proj_creator,      v_role_collaborator, 'internal', 'active', 'manual_add'),
    (v_org, v_u_proj_collaborator, v_role_collaborator, 'internal', 'active', 'manual_add'),
    (v_org, v_u_proj_viewer,       v_role_collaborator, 'internal', 'active', 'manual_add'),
    (v_org, v_u_proj_vendor,       v_role_contractor,   'external', 'active', 'manual_add')
  ON CONFLICT DO NOTHING;

  -- Owner on lower-tier orgs for tier-gate testing
  INSERT INTO public.organization_memberships (organization_id, user_id, role_id, seat_type, status, joined_via) VALUES
    (v_org_free,    v_u_owner, v_role_owner, 'internal', 'active', 'manual_add'),
    (v_org_starter, v_u_owner, v_role_owner, 'internal', 'active', 'manual_add'),
    (v_org_pro,     v_u_owner, v_role_owner, 'internal', 'active', 'manual_add')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 5. TEAMS & TEAM MEMBERSHIPS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.teams (id, organization_id, name, slug) VALUES
    (v_team, v_org, 'Production Alpha', 'production-alpha')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.team_memberships (team_id, user_id, role_id, organization_id, joined_via) VALUES
    (v_team, v_u_collaborator, v_role_collaborator, v_org, 'manual_add'),
    (v_team, v_u_admin,        v_role_admin,        v_org, 'manual_add')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 6. PROJECTS & PROJECT MEMBERSHIPS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.projects (id, organization_id, name, slug, status) VALUES
    (v_project,  v_org, 'NYC Brand Activation 2026',   'nyc-activation-2026',  'active'),
    (v_project2, v_org, 'LA Festival Build Q3',        'la-festival-q3',       'in_progress')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.project_memberships (project_id, user_id, role_id, organization_id, joined_via) VALUES
    (v_project, v_u_proj_creator,      v_role_proj_creator,      v_org, 'manual_add'),
    (v_project, v_u_proj_collaborator, v_role_proj_collaborator, v_org, 'manual_add'),
    (v_project, v_u_proj_viewer,       v_role_proj_viewer,       v_org, 'manual_add'),
    (v_project, v_u_proj_vendor,       v_role_proj_vendor,       v_org, 'manual_add'),
    -- Internal roles also get project access
    (v_project, v_u_owner,        v_role_proj_creator,      v_org, 'manual_add'),
    (v_project, v_u_collaborator, v_role_proj_collaborator, v_org, 'manual_add')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 7. CLIENTS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.clients (id, organization_id, company_name, industry, source, status, tags) VALUES
    (v_client1, v_org, 'Apex Brands International',  'Brand Marketing', 'referral', 'active', ARRAY['vip', 'enterprise']),
    (v_client2, v_org, 'Horizon Live Entertainment', 'Live Events',     'inbound',  'active', ARRAY['returning'])
  ON CONFLICT (id) DO NOTHING;

  -- Link demo client user to a client record
  INSERT INTO public.client_contacts (id, client_id, organization_id, first_name, last_name, email, is_primary, user_id) VALUES
    ('e2e00000-0000-4000-d100-000000000001', v_client1, v_org, 'Demo', 'Client', 'client@redsealion.test', true, v_u_client)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 8. PROPOSALS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.proposals (id, organization_id, client_id, name, status, currency, total_value, version, created_by, event_date, project_id) VALUES
    (v_proposal1, v_org, v_client1, 'NYC Times Square Activation',      'draft',         'USD', 250000, 1, v_u_owner, '2026-07-04', v_project),
    (v_proposal2, v_org, v_client2, 'Coachella Festival Build',          'approved',      'USD', 480000, 2, v_u_owner, '2026-09-15', v_project2),
    (v_proposal3, v_org, v_client1, 'Holiday Pop-Up Experience',         'in_production', 'USD', 175000, 1, v_u_admin, '2026-12-01', v_project)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 9. DEALS (Pipeline)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.deals (id, organization_id, client_id, proposal_id, title, deal_value, stage, probability, owner_id) VALUES
    (v_deal1, v_org, v_client1, v_proposal1, 'Apex Q3 Brand Activation',  250000, 'qualified',        60, v_u_owner),
    (v_deal2, v_org, v_client2, v_proposal2, 'Horizon Festival Package',  480000, 'contract_signed',  95, v_u_admin)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 10. INVOICES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.invoices (id, organization_id, client_id, proposal_id, invoice_number, type, status, issue_date, due_date, subtotal, tax_amount, total, amount_paid, currency) VALUES
    (v_invoice1, v_org, v_client1, v_proposal1, 'FD-E-2026-001', 'deposit',  'sent',     '2026-04-01', '2026-04-15', 125000, 0, 125000, 0,      'USD'),
    (v_invoice2, v_org, v_client2, v_proposal2, 'FD-E-2026-002', 'progress', 'overdue',  '2026-03-01', '2026-03-31', 192000, 0, 192000, 96000,  'USD')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 11. TASKS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.tasks (id, organization_id, title, status, priority, assignee_id, created_by, due_date, project_id) VALUES
    (v_task1, v_org, 'Review activation mockups',       'todo',        'high',   v_u_collaborator, v_u_owner, CURRENT_DATE + 2,  v_project),
    (v_task2, v_org, 'Finalize BOM for festival build', 'in_progress', 'urgent', v_u_admin,        v_u_owner, CURRENT_DATE,      v_project2),
    (v_task3, v_org, 'Update crew call sheets',         'done',        'medium', v_u_collaborator, v_u_admin, CURRENT_DATE - 1,  v_project)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 12. LEADS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.leads (id, organization_id, source, company_name, contact_first_name, contact_last_name, contact_email, status, created_by) VALUES
    (v_lead1, v_org, 'website',  'Stellar Events Co.',  'Sarah',  'Chen',    'sarah@stellar.test',  'new',       v_u_owner),
    (v_lead2, v_org, 'referral', 'Nova Productions',    'Marcus', 'Rivera',  'marcus@nova.test',    'contacted', v_u_collaborator)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 13. LOCATIONS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.locations (id, organization_id, name, location_type, city, state, country, status) VALUES
    (v_location1, v_org, 'Times Square Plaza',     'venue',     'New York',   'NY', 'US', 'active'),
    (v_location2, v_org, 'Empire Polo Club',       'venue',     'Indio',      'CA', 'US', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 14. EVENTS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.events (id, organization_id, name, slug, status, starts_at, ends_at, location_id, created_by) VALUES
    (v_event1, v_org, 'NYC July 4th Activation',  'nyc-july-4th',   'confirmed', '2026-07-03 08:00:00+00', '2026-07-05 22:00:00+00', v_location1, v_u_owner),
    (v_event2, v_org, 'Coachella Build Week',      'coachella-build', 'planning',  '2026-09-10 06:00:00+00', '2026-09-20 23:00:00+00', v_location2, v_u_admin)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 15. CREW PROFILES & BOOKINGS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.crew_profiles (id, organization_id, user_id, status, hourly_rate, skills) VALUES
    (v_crew_profile1, v_org, v_u_crew,       'active', 45.00,  ARRAY['rigging', 'lighting']),
    (v_crew_profile2, v_org, v_u_contractor, 'active', 65.00,  ARRAY['fabrication', 'welding', 'carpentry'])
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.crew_bookings (id, organization_id, crew_profile_id, event_id, status, start_date, end_date, daily_rate, role_title) VALUES
    (v_booking1, v_org, v_crew_profile1, v_event1, 'confirmed', '2026-07-03', '2026-07-05', 360, 'Lead Rigger')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 16. ASSETS (Equipment + Warehouse)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.assets (id, organization_id, name, asset_number, category, status, current_location, acquisition_date, purchase_price, condition) VALUES
    (v_asset1, v_org, 'Truss Section 12x12',    'AST-001', 'Structural', 'available',   'Warehouse A', '2025-01-15', 8500,  'good'),
    (v_asset2, v_org, 'LED Panel Wall 4x8',     'AST-002', 'AV',         'deployed',    'Event Site',  '2025-06-01', 12000, 'good'),
    (v_asset3, v_org, 'Generator 20kW Portable', 'AST-003', 'Power',      'maintenance', 'Warehouse A', '2024-03-10', 15000, 'fair')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 17. WORK ORDERS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.work_orders (id, organization_id, title, status, priority, event_id, created_by) VALUES
    (v_workorder1, v_org, 'Stage Rigging Install',      'open',        'high',   v_event1, v_u_owner),
    (v_workorder2, v_org, 'LED Wall Setup & Calibration', 'in_progress', 'medium', v_event2, v_u_admin)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 18. EXPENSES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.expenses (id, organization_id, description, amount, status, category, submitted_by, expense_date) VALUES
    (v_expense1, v_org, 'Crew transportation — NYC event',   850.00,  'pending',  'Transportation', v_u_collaborator, CURRENT_DATE - 3),
    (v_expense2, v_org, 'Material procurement — truss bolts', 2340.00, 'approved', 'Materials',      v_u_admin,        CURRENT_DATE - 7)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 19. TIME ENTRIES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.time_entries (id, organization_id, user_id, date, hours, description, billable, approved, project_id) VALUES
    (v_timeentry1, v_org, v_u_collaborator, CURRENT_DATE - 1, 8.0,  'Site survey and measurements', true,  true,  v_project),
    (v_timeentry2, v_org, v_u_admin,        CURRENT_DATE,     6.5,  'BOM finalization and vendor calls', true, false, v_project2)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 20. GOALS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.goals (id, organization_id, title, description, status, progress, target_date, owner_id) VALUES
    (v_goal1, v_org, 'Q3 Revenue Target',            'Close $2M in new business',    'on_track',   65, '2026-09-30', v_u_owner),
    (v_goal2, v_org, 'Crew Utilization Improvement',  'Achieve 85% crew utilization', 'at_risk',    42, '2026-06-30', v_u_admin)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 21. PRODUCTION ADVANCES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.production_advances (id, organization_id, name, status, advance_type, project_id, created_by) VALUES
    (v_advance1, v_org, 'NYC Activation Advance Sheet', 'draft',     'production', v_project,  v_u_owner),
    (v_advance2, v_org, 'Festival Build Advance',       'submitted', 'production', v_project2, v_u_admin)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 22. CAMPAIGNS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.campaigns (id, organization_id, name, status, type, subject, body_html, created_by) VALUES
    (v_campaign1, v_org, 'Q3 Services Newsletter', 'draft', 'newsletter', 'FlyteDeck Q3 Services Update', '<h1>Q3 Update</h1><p>New capabilities available.</p>', v_u_owner)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 23. AUTOMATIONS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.automations (id, organization_id, name, trigger_type, trigger_config, action_type, action_config, is_active, created_by) VALUES
    (v_automation1, v_org, 'Auto-assign tasks on proposal approval', 'proposal_approved', '{"status":"approved"}'::jsonb, 'create_tasks', '{"template":"default"}'::jsonb, true, v_u_admin)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 24. VENDORS & PURCHASE ORDERS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.vendors (id, organization_id, company_name, status) VALUES
    (v_vendor1, v_org, 'TrussWorks Supply Co.', 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.purchase_orders (id, organization_id, vendor_id, po_number, status, total_amount, currency, created_by) VALUES
    (v_po1, v_org, v_vendor1, 'PO-2026-001', 'submitted', 18500, 'USD', v_u_controller)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 25. FABRICATION ORDERS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.fabrication_orders (id, organization_id, name, proposal_id, status, priority, created_by) VALUES
    (v_faborder1, v_org, 'Custom Stage Riser Set', v_proposal2, 'in_progress', 'high', v_u_admin)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 26. RENTAL ORDERS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.rental_orders (id, organization_id, client_id, status, start_date, end_date, total_amount, currency) VALUES
    (v_rental1, v_org, v_client1, 'active', '2026-07-01', '2026-07-10', 4500, 'USD')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 27. PRODUCTION SCHEDULES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.production_schedules (id, organization_id, name, proposal_id, status) VALUES
    (v_schedule1, v_org, 'NYC Activation Build Schedule', v_proposal1, 'draft')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 28. PHASE TEMPLATES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.phase_templates (id, organization_id, name, description, phases) VALUES
    (v_template1, v_org, 'Standard Build Template', 'Pre-build, Build, Strike, Wrap', '["Pre-Production","Load-In","Build","Show","Strike","Load-Out","Wrap"]'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 29. PROJECT PORTALS (for client portal testing)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.project_portals (id, organization_id, project_id, portal_type, is_published) VALUES
    (v_portal1, v_org, v_project, 'client', true)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 30. NOTIFICATIONS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.notifications (id, organization_id, user_id, title, body, type, priority, read, archived, action_url) VALUES
    (v_notification1, v_org, v_u_owner,        'New proposal comment',             'Sarah Chen commented on NYC Times Square Activation', 'comment',   'normal', false, false, '/app/proposals/' || v_proposal1),
    (v_notification2, v_org, v_u_collaborator, 'Task assigned: Review mockups',    'You have been assigned a new task',                   'task',      'high',   false, false, '/app/tasks/' || v_task1)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 31. PROJECT BUDGETS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.project_budgets (id, organization_id, project_id, name, total_amount, spent_amount, currency) VALUES
    (v_budget1, v_org, v_project, 'NYC Activation Budget', 250000, 87500, 'USD')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 32. ACTIVATIONS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.activations (id, organization_id, event_id, location_id, name, status) VALUES
    (v_activation1, v_org, v_event1, v_location1, 'Main Stage Activation', 'planning')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 33. WAREHOUSE FACILITIES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.warehouse_facilities (id, organization_id, name, location, status) VALUES
    (v_facility1, v_org, 'Brooklyn Main Warehouse', 'Brooklyn, NY', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 34. SALES PIPELINES
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.sales_pipelines (id, organization_id, name, is_default) VALUES
    (v_pipeline1, v_org, 'Default Pipeline', true)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 35. TERMS DOCUMENTS
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.terms_documents (id, organization_id, version, content, is_published, created_by) VALUES
    (v_terms1, v_org, 1, '[{"title":"Payment Terms","body":"Net 30 from invoice date."},{"title":"Cancellation","body":"14-day cancellation notice required."}]'::jsonb, true, v_u_owner)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 36. ACTIVITY LOG (for dashboard recent activity)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.activity_log (id, organization_id, actor_id, action, entity_type, entity_id) VALUES
    ('e2e00000-0000-4000-ff00-000000000001', v_org, v_u_owner, 'created',  'proposal', v_proposal1::text),
    ('e2e00000-0000-4000-ff00-000000000002', v_org, v_u_admin, 'approved', 'proposal', v_proposal2::text),
    ('e2e00000-0000-4000-ff00-000000000003', v_org, v_u_owner, 'created',  'deal',     v_deal1::text),
    ('e2e00000-0000-4000-ff00-000000000004', v_org, v_u_collaborator, 'created',  'task',     v_task1::text),
    ('e2e00000-0000-4000-ff00-000000000005', v_org, v_u_admin, 'updated',  'event',    v_event1::text)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Seed complete — 14 users, 4 orgs, 50+ entities across all modules';
END;
$$;
