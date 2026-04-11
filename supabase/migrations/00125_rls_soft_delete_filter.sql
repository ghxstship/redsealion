-- ============================================================
-- STRESS TEST AUDIT REMEDIATION — PHASE 3
-- Addresses: CRIT-04, HIGH-09, HIGH-10
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- CRIT-04: Update RLS SELECT policies to filter soft-deleted rows
-- Tables that have deleted_at but whose RLS policies don't filter it:
--   organizations, clients, proposals, invoices, assets, tasks,
--   users, projects, events
-- ────────────────────────────────────────────────────────────

-- Organizations: users see own orgs only
DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations FOR SELECT
  USING (
    id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Clients: org-scoped
DROP POLICY IF EXISTS "clients_org" ON clients;
CREATE POLICY "clients_org" ON clients FOR SELECT
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Keep mutation policies (INSERT/UPDATE/DELETE) without deleted_at filter
-- so that admins can still update/restore soft-deleted records if needed
DROP POLICY IF EXISTS "clients_org_mut" ON clients;
CREATE POLICY "clients_org_mut" ON clients FOR ALL
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  );

-- Proposals: org-scoped
DROP POLICY IF EXISTS "proposals_org" ON proposals;
CREATE POLICY "proposals_org" ON proposals FOR SELECT
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "proposals_org_mut" ON proposals;
CREATE POLICY "proposals_org_mut" ON proposals FOR ALL
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  );

-- Invoices: org-scoped
DROP POLICY IF EXISTS "invoices_org" ON invoices;
CREATE POLICY "invoices_org" ON invoices FOR SELECT
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "invoices_org_mut" ON invoices;
CREATE POLICY "invoices_org_mut" ON invoices FOR ALL
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  );

-- Assets: org-scoped
DROP POLICY IF EXISTS "assets_org" ON assets;
CREATE POLICY "assets_org" ON assets FOR SELECT
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "assets_org_mut" ON assets;
CREATE POLICY "assets_org_mut" ON assets FOR ALL
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  );

-- Tasks: org-scoped
DROP POLICY IF EXISTS "tasks_org" ON tasks;
CREATE POLICY "tasks_org" ON tasks FOR SELECT
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "tasks_org_mut" ON tasks;
CREATE POLICY "tasks_org_mut" ON tasks FOR ALL
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  );

-- Projects: org-scoped
DROP POLICY IF EXISTS "projects_org" ON projects;
CREATE POLICY "projects_org" ON projects FOR SELECT
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "projects_org_mut" ON projects;
CREATE POLICY "projects_org_mut" ON projects FOR ALL
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  );

-- Events: org-scoped
DROP POLICY IF EXISTS "events_org" ON events;
CREATE POLICY "events_org" ON events FOR SELECT
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "events_org_mut" ON events;
CREATE POLICY "events_org_mut" ON events FOR ALL
  USING (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- HIGH-09: Add organization_id to proposal_comments
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposal_comments' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE proposal_comments ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Backfill from proposals
    UPDATE proposal_comments pc
    SET organization_id = p.organization_id
    FROM proposals p
    WHERE pc.proposal_id = p.id AND pc.organization_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_proposal_comments_org ON proposal_comments(organization_id);

-- ────────────────────────────────────────────────────────────
-- HIGH-10: Add organization_id to client_contacts
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'client_contacts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE client_contacts ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Backfill from clients
    UPDATE client_contacts cc
    SET organization_id = c.organization_id
    FROM clients c
    WHERE cc.client_id = c.id AND cc.organization_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_contacts_org ON client_contacts(organization_id);
