# 🪨 BEDROCK — MIGRATION PLAN

**Generated:** 2026-04-03 | **Total Migrations:** 8 | **Risk Range:** Low–High

---

## EXECUTION ORDER

All migrations are idempotent and reversible. Execute in strict sequential order.

| ID | Name | Risk | Phase Source | Estimated Impact |
|----|------|------|-------------|-----------------|
| M-001 | Missing FK Indexes | 🟢 Low | Phase 5 | 32 CREATE INDEX — zero downtime |
| M-002 | Missing updated_at Triggers | 🟢 Low | Phase 7 | 17 triggers — zero downtime |
| M-003 | calendar_sync_configs Resolution | 🟡 Moderate | Phase 5 | ALTER TABLE, data migration |
| M-004 | ENUM Type Creation | 🟡 Moderate | Phase 4 | 21 new types, ALTER columns |
| M-005 | CHECK Constraints | 🟢 Low | Phase 4 | 11 ADD CONSTRAINT — fails if invalid data exists |
| M-006 | Custom Fields Enhancement | 🟡 Moderate | Phase 6 | ALTER TABLE, backfill, new indexes |
| M-007 | Naming Canonization | 🔴 High | Phase 2 | Column renames — requires app code changes |
| M-008 | RLS Pattern Standardization | 🟡 Moderate | Phase 8 | DROP/CREATE POLICY on 18 tables |

---

## M-001: Missing FK Indexes
**Risk:** 🟢 Low — Additive, no locks on writes
**Rollback:** `DROP INDEX` each

```sql
-- Migration 00024_bedrock_fk_indexes.sql
-- Phase 5 remediation: Add indexes for all unindexed FK columns

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_terms_doc ON proposals(terms_document_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_parent ON proposals(parent_proposal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_phase_template ON proposals(phase_template_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_pipeline ON proposals(pipeline_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_client ON deals(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_deal ON leads(converted_to_deal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_items_deliverable ON invoice_line_items(deliverable_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_items_addon ON invoice_line_items(addon_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_src_deliverable ON assets(source_deliverable_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_src_addon ON assets(source_addon_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_actor ON activity_log(actor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author ON proposal_comments(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_uploader ON file_attachments(uploaded_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_milestone_reqs_completer ON milestone_requirements(completed_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_notes_invoice ON credit_notes(invoice_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_threads_deal ON email_threads(deal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_threads_client ON email_threads(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_change_orders_proposal ON change_orders(proposal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_proposal ON time_entries(proposal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_phase ON time_entries(phase_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_proposal ON tasks(proposal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_phase ON tasks(phase_id);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_org_status ON proposals(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_org_status ON tasks(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_org_stage ON deals(organization_id, stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_user_time ON time_entries(user_id, start_time);

-- GIN indexes for JSONB
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cfv_value_gin ON custom_field_values USING GIN(value);
```

---

## M-002: Missing updated_at Triggers
**Risk:** 🟢 Low — Additive trigger functions
**Rollback:** `DROP TRIGGER` each

```sql
-- Migration 00025_bedrock_missing_triggers.sql
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'crew_profiles','crew_availability','crew_bookings',
    'equipment_bundles','equipment_reservations','maintenance_records',
    'esignature_requests','notification_preferences',
    'shifts','calendar_sync_configs','leads','lead_forms',
    'onboarding_documents','warehouse_transfers',
    'user_preferences','email_templates','document_defaults'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER IF NOT EXISTS set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
```

---

## M-003–M-008: Summary

| ID | Summary | SQL File |
|----|---------|----------|
| M-003 | Resolve calendar_sync_configs: ALTER TABLE to add missing 00021 columns, add `outlook` to CHECK | `00026_bedrock_calendar_sync_fix.sql` |
| M-004 | Create 21 ENUM types, ALTER columns from TEXT to ENUM | `00027_bedrock_enum_types.sql` |
| M-005 | Add 11 CHECK constraints (date ranges, non-negative amounts) | `00028_bedrock_check_constraints.sql` |
| M-006 | Enhance custom_field_definitions + values per CERTIFICATION | `00029_bedrock_custom_fields.sql` |
| M-007 | Column renames (full_name → first/last, boolean is_ prefix, etc.) | `00030_bedrock_naming.sql` — **Requires app code changes first** |
| M-008 | Standardize RLS patterns (Pattern B → Pattern A) | `00031_bedrock_rls_standard.sql` |

> [!CAUTION]
> **M-007 (Naming Canonization)** is the only migration that requires application code changes. All TypeScript types in `src/types/database.ts`, database queries, and component references must be updated BEFORE this migration runs. This should be the LAST migration applied and may warrant a separate sprint.
