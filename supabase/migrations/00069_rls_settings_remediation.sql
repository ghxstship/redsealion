-- =============================================================================
-- Migration 00069: Legacy RLS Policy Remediation (Settings Tables)
-- =============================================================================
-- The following tables from 00021_settings_tables.sql have RLS policies that
-- reference users.organization_id and users.role — both columns were DROPPED
-- in migration 00033_normalize_ssot.sql. These policies are broken at runtime,
-- silently returning zero rows for all queries.
--
-- Fix: Drop broken policies and recreate using organization_memberships join.
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- api_keys
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "api_keys_select" ON api_keys;
DROP POLICY IF EXISTS "api_keys_insert" ON api_keys;
DROP POLICY IF EXISTS "api_keys_update" ON api_keys;

CREATE POLICY "api_keys_select" ON api_keys FOR SELECT USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 2
  )
);

CREATE POLICY "api_keys_update" ON api_keys FOR UPDATE USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 2
  )
);

CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 2
  )
);


-- ═══════════════════════════════════════════════════════════════════════
-- tags
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "tags_select" ON tags;
DROP POLICY IF EXISTS "tags_insert" ON tags;
DROP POLICY IF EXISTS "tags_update" ON tags;
DROP POLICY IF EXISTS "tags_delete" ON tags;

CREATE POLICY "tags_select" ON tags FOR SELECT USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 3  -- org_admin, project_manager
  )
);

CREATE POLICY "tags_update" ON tags FOR UPDATE USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 3
  )
);

CREATE POLICY "tags_delete" ON tags FOR DELETE USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 3
  )
);


-- ═══════════════════════════════════════════════════════════════════════
-- email_templates
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "email_templates_select" ON email_templates;
DROP POLICY IF EXISTS "email_templates_insert" ON email_templates;
DROP POLICY IF EXISTS "email_templates_update" ON email_templates;

CREATE POLICY "email_templates_select" ON email_templates FOR SELECT USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "email_templates_insert" ON email_templates FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 2
  )
);

CREATE POLICY "email_templates_update" ON email_templates FOR UPDATE USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 2
  )
);


-- ═══════════════════════════════════════════════════════════════════════
-- document_defaults
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "document_defaults_select" ON document_defaults;
DROP POLICY IF EXISTS "document_defaults_insert" ON document_defaults;
DROP POLICY IF EXISTS "document_defaults_update" ON document_defaults;

CREATE POLICY "document_defaults_select" ON document_defaults FOR SELECT USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "document_defaults_insert" ON document_defaults FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 2
  )
);

CREATE POLICY "document_defaults_update" ON document_defaults FOR UPDATE USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    JOIN roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid() AND om.status = 'active'
    AND r.hierarchy_level <= 2
  )
);
