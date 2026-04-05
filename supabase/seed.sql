-- ==========================================
-- TEST USERS SEED FOR ALL ROLE TYPES
-- ==========================================
-- Automatically creates an organization, a project, a team, and seeds
-- one test user per Harbor Master role available in the system.
-- All passwords are set to 'password123'

DO $$
DECLARE
    -- Deterministic UUIDs for predictable test environment
    v_org_id UUID := '11111111-1111-1111-1111-111111111111';
    v_team_id UUID := '22222222-2222-2222-2222-222222222222';
    v_project_id UUID := '33333333-3333-3333-3333-333333333333';
    v_client_id UUID := '44444444-4444-4444-4444-444444444444';
    v_proposal_id UUID := '55555555-5555-5555-5555-555555555555';
    
    v_role RECORD;
    v_user_id UUID;
    v_base_email TEXT;
BEGIN
    -- 1. Create Organization
    INSERT INTO public.organizations (id, name, slug)
    VALUES (v_org_id, 'Red Sealion Tests', 'redsealion-tests')
    ON CONFLICT (id) DO NOTHING;
    -- Wait, what if ID conflicts but slug conflicts first?
    -- Actually organizations usually conflicts on ID if specified.
    
    -- 2. Create Client (Needed for Proposals/Projects)
    INSERT INTO public.clients (id, organization_id, company_name)
    VALUES (v_client_id, v_org_id, 'Test Client')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Create Project
    INSERT INTO public.projects (id, organization_id, name, slug)
    VALUES (v_project_id, v_org_id, 'Test Project', 'test-project')
    ON CONFLICT (id) DO NOTHING;

    -- 4. Create Team
    INSERT INTO public.teams (id, organization_id, name, slug)
    VALUES (v_team_id, v_org_id, 'Test Team', 'test-team')
    ON CONFLICT (id) DO NOTHING;

    -- 5. Loop over all system roles
    FOR v_role IN SELECT id, name, display_name, scope FROM public.roles WHERE is_system = true LOOP
        
        -- Generate deterministic UUID based on role name
        v_user_id := cast(md5(v_role.name || '_user') as uuid);
        v_base_email := v_role.name || '@redsealion.test';

        -- Insert to auth.users (GoTrue requires token columns to be '' not NULL)
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            confirmation_token, recovery_token,
            email_change_token_new, email_change_token_current, email_change,
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 
            v_base_email, crypt('password123', gen_salt('bf')), 
            now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 
            '', '', '', '', '',
            now(), now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Insert into public.users (organization_id dropped in migration 00033)
        INSERT INTO public.users (id, email, full_name, first_name, last_name)
        VALUES (v_user_id, v_base_email, 'Test ' || v_role.display_name, 'Test', v_role.display_name)
        ON CONFLICT (id) DO NOTHING;

        -- Assign memberships based on scope
        IF v_role.scope = 'organization' THEN
            INSERT INTO public.organization_memberships (organization_id, user_id, role_id, joined_via)
            VALUES (v_org_id, v_user_id, v_role.id, 'manual_add')
            ON CONFLICT DO NOTHING;

        ELSIF v_role.scope = 'team' THEN
            -- Team users also need an org membership to access the tenant (use standard member '...0040')
            INSERT INTO public.organization_memberships (organization_id, user_id, role_id, joined_via)
            VALUES (v_org_id, v_user_id, '00000000-0000-0000-0000-000000000040', 'manual_add')
            ON CONFLICT DO NOTHING;

            INSERT INTO public.team_memberships (team_id, user_id, role_id, joined_via, organization_id)
            VALUES (v_team_id, v_user_id, v_role.id, 'manual_add', v_org_id)
            ON CONFLICT DO NOTHING;

        ELSIF v_role.scope = 'project' THEN
            -- Project users also need org membership (use standard member)
            INSERT INTO public.organization_memberships (organization_id, user_id, role_id, joined_via)
            VALUES (v_org_id, v_user_id, '00000000-0000-0000-0000-000000000040', 'manual_add')
            ON CONFLICT DO NOTHING;

            INSERT INTO public.project_memberships (project_id, user_id, role_id, joined_via, organization_id)
            VALUES (v_project_id, v_user_id, v_role.id, 'manual_add', v_org_id)
            ON CONFLICT DO NOTHING;

        ELSIF v_role.scope = 'platform' THEN
            -- Platform users get org owner access just in case
             INSERT INTO public.organization_memberships (organization_id, user_id, role_id, joined_via)
            VALUES (v_org_id, v_user_id, '00000000-0000-0000-0000-000000000010', 'manual_add')
            ON CONFLICT DO NOTHING;
        END IF;

    END LOOP;
END;
$$;
