-- ============================================================
-- BEDROCK RECONCILIATION QUERIES
-- Run periodically to detect schema drift and data integrity issues
-- ============================================================

-- ============================================================
-- 1. DENORMALIZATION DRIFT — org_id consistency
-- ============================================================

-- Invoices org_id drift
SELECT i.id AS invoice_id, i.organization_id AS invoice_org, p.organization_id AS proposal_org
FROM invoices i JOIN proposals p ON i.proposal_id = p.id
WHERE i.organization_id != p.organization_id;

-- Assets org_id drift
SELECT a.id, a.organization_id AS asset_org, p.organization_id AS proposal_org
FROM assets a JOIN proposals p ON a.proposal_id = p.id
WHERE a.organization_id != p.organization_id;

-- Deal activities org_id drift
SELECT da.id, da.organization_id AS da_org, d.organization_id AS deal_org
FROM deal_activities da JOIN deals d ON da.deal_id = d.id
WHERE da.organization_id != d.organization_id;

-- Change orders org_id drift
SELECT co.id, co.organization_id, p.organization_id
FROM change_orders co JOIN proposals p ON co.proposal_id = p.id
WHERE co.organization_id != p.organization_id;

-- Team memberships org_id drift
SELECT tm.id, tm.organization_id AS tm_org, t.organization_id AS team_org
FROM team_memberships tm JOIN teams t ON tm.team_id = t.id
WHERE tm.organization_id != t.organization_id;

-- Project memberships org_id drift
SELECT pm.id, pm.organization_id AS pm_org, p.organization_id AS proj_org
FROM project_memberships pm JOIN projects p ON pm.project_id = p.id
WHERE pm.organization_id != p.organization_id;

-- ============================================================
-- 2. COMPUTED VALUE DRIFT
-- ============================================================

-- Proposals total_value drift
SELECT p.id, p.name, p.total_value AS stored, COALESCE(SUM(ph.phase_investment), 0) AS computed
FROM proposals p LEFT JOIN phases ph ON ph.proposal_id = p.id
GROUP BY p.id, p.name, p.total_value
HAVING p.total_value != COALESCE(SUM(ph.phase_investment), 0);

-- Automation run_count drift
SELECT a.id, a.name, a.run_count AS stored, COUNT(ar.id) AS computed
FROM automations a LEFT JOIN automation_runs ar ON ar.automation_id = a.id
GROUP BY a.id, a.name, a.run_count
HAVING a.run_count != COUNT(ar.id);

-- Email thread message_count drift
SELECT et.id, et.subject, et.message_count AS stored, COUNT(em.id) AS computed
FROM email_threads et LEFT JOIN email_messages em ON em.thread_id = et.id
GROUP BY et.id, et.subject, et.message_count
HAVING et.message_count != COUNT(em.id);

-- Invite code current_uses drift
SELECT ic.id, ic.code, ic.current_uses AS stored, COUNT(icr.id) AS computed
FROM invite_codes ic LEFT JOIN invite_code_redemptions icr ON icr.invite_code_id = ic.id
GROUP BY ic.id, ic.code, ic.current_uses
HAVING ic.current_uses != COUNT(icr.id);

-- ============================================================
-- 3. ORPHAN DETECTION
-- ============================================================

-- Orphan custom_field_values (definition deleted but value remains)
SELECT cfv.id, cfv.entity_id, cfv.field_definition_id
FROM custom_field_values cfv
LEFT JOIN custom_field_definitions cfd ON cfd.id = cfv.field_definition_id
WHERE cfd.id IS NULL;

-- Orphan webhook_deliveries (endpoint deleted)
SELECT wd.id, wd.webhook_endpoint_id
FROM webhook_deliveries wd
LEFT JOIN webhook_endpoints we ON we.id = wd.webhook_endpoint_id
WHERE we.id IS NULL;

-- Orphan team_memberships (team or user deleted)
SELECT tm.id, tm.user_id, tm.team_id
FROM team_memberships tm
LEFT JOIN users u ON u.id = tm.user_id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.id IS NULL OR t.id IS NULL;

-- ============================================================
-- 4. CONSTRAINT VALIDATION
-- ============================================================

-- Date range violations (should have CHECK but may have bad data)
SELECT 'resource_allocations' AS tbl, id FROM resource_allocations WHERE end_date < start_date
UNION ALL
SELECT 'equipment_reservations', id FROM equipment_reservations WHERE reserved_until < reserved_from
UNION ALL
SELECT 'time_off_requests', id FROM time_off_requests WHERE end_date < start_date;

-- Negative money amounts
SELECT 'invoices.subtotal' AS col, id FROM invoices WHERE subtotal < 0
UNION ALL
SELECT 'invoices.total', id FROM invoices WHERE total < 0
UNION ALL
SELECT 'invoices.tax_amount', id FROM invoices WHERE tax_amount < 0;

-- ============================================================
-- 5. MISSING TRIGGER DETECTION
-- ============================================================

-- Tables with updated_at but no trigger
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
  AND a.attname = 'updated_at'
  AND c.relkind = 'r'
  AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = c.oid
      AND t.tgname LIKE '%updated_at%'
  )
ORDER BY c.relname;

-- ============================================================
-- 6. RLS COVERAGE VERIFICATION
-- ============================================================

-- Tables without RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT relname FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public'
      AND pg_class.relrowsecurity = true
  )
ORDER BY tablename;

-- ============================================================
-- 7. DUPLICATE / SUPERSEDED TABLE DETECTION
-- ============================================================

-- Check if old permissions table exists alongside permission_catalog
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='permissions') AS has_permissions,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='permission_catalog') AS has_permission_catalog;

-- Check if old sso_configurations exists alongside auth_settings
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sso_configurations') AS has_sso_configurations,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='auth_settings') AS has_auth_settings;
