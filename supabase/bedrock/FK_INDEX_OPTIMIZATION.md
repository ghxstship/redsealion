# 🪨 BEDROCK — FK & INDEX OPTIMIZATION

**Generated:** 2026-04-03

---

## 1. MISSING FK INDEXES

PostgreSQL does NOT auto-create indexes on FK columns. These missing indexes degrade JOIN and CASCADE DELETE performance:

### High Priority (Frequently JOINed or queried via RLS)

| # | Table.Column | FK Target | Existing Index? | Action |
|---|-------------|-----------|-----------------|--------|
| 1 | `proposals.created_by` | users(id) | ❌ | `CREATE INDEX idx_proposals_created_by ON proposals(created_by)` |
| 2 | `proposals.client_id` | clients(id) | ❌ | `CREATE INDEX idx_proposals_client ON proposals(client_id)` |
| 3 | `proposals.terms_document_id` | terms_documents(id) | ❌ | `CREATE INDEX idx_proposals_terms_doc ON proposals(terms_document_id)` |
| 4 | `proposals.parent_proposal_id` | proposals(id) | ❌ | `CREATE INDEX idx_proposals_parent ON proposals(parent_proposal_id)` |
| 5 | `proposals.phase_template_id` | phase_templates(id) | ❌ | `CREATE INDEX idx_proposals_phase_template ON proposals(phase_template_id)` |
| 6 | `proposals.pipeline_id` | sales_pipelines(id) | ❌ | `CREATE INDEX idx_proposals_pipeline ON proposals(pipeline_id)` |
| 7 | `invoices.client_id` | clients(id) | ❌ | `CREATE INDEX idx_invoices_client ON invoices(client_id)` |
| 8 | `invoices.proposal_id` | proposals(id) | ✅ idx_invoices_proposal | — |
| 9 | `tasks.assignee_id` | users(id) | ✅ idx_tasks_assignee | — |
| 10 | `tasks.created_by` | users(id) | ❌ | `CREATE INDEX idx_tasks_created_by ON tasks(created_by)` |
| 11 | `deals.client_id` | clients(id) | ❌ | `CREATE INDEX idx_deals_client ON deals(client_id)` |
| 12 | `deals.owner_id` | users(id) | ❌ | `CREATE INDEX idx_deals_owner ON deals(owner_id)` |
| 13 | `deals.pipeline_id` | sales_pipelines(id) | ❌ | `CREATE INDEX idx_deals_pipeline ON deals(pipeline_id)` |
| 14 | `leads.assigned_to` | users(id) | ❌ | `CREATE INDEX idx_leads_assigned ON leads(assigned_to)` |
| 15 | `leads.converted_to_deal_id` | deals(id) | ❌ | `CREATE INDEX idx_leads_deal ON leads(converted_to_deal_id)` |
| 16 | `expenses.user_id` | users(id) | ❌ | `CREATE INDEX idx_expenses_user ON expenses(user_id)` |

### Medium Priority (Less frequently queried)

| # | Table.Column | FK Target | Action |
|---|-------------|-----------|--------|
| 17 | `invoice_line_items.deliverable_id` | phase_deliverables(id) | `CREATE INDEX idx_invoice_items_deliverable ON invoice_line_items(deliverable_id)` |
| 18 | `invoice_line_items.addon_id` | phase_addons(id) | `CREATE INDEX idx_invoice_items_addon ON invoice_line_items(addon_id)` |
| 19 | `assets.source_deliverable_id` | phase_deliverables(id) | `CREATE INDEX idx_assets_src_deliverable ON assets(source_deliverable_id)` |
| 20 | `assets.source_addon_id` | phase_addons(id) | `CREATE INDEX idx_assets_src_addon ON assets(source_addon_id)` |
| 21 | `activity_log.actor_id` | users(id) | `CREATE INDEX idx_activity_log_actor ON activity_log(actor_id)` |
| 22 | `proposal_comments.author_id` | users(id) | `CREATE INDEX idx_comments_author ON proposal_comments(author_id)` |
| 23 | `file_attachments.uploaded_by` | users(id) | `CREATE INDEX idx_attachments_uploader ON file_attachments(uploaded_by)` |
| 24 | `milestone_requirements.completed_by` | users(id) | `CREATE INDEX idx_milestone_reqs_completer ON milestone_requirements(completed_by)` |
| 25 | `credit_notes.invoice_id` | invoices(id) | `CREATE INDEX idx_credit_notes_invoice ON credit_notes(invoice_id)` |
| 26 | `email_threads.deal_id` | deals(id) | `CREATE INDEX idx_email_threads_deal ON email_threads(deal_id)` |
| 27 | `email_threads.client_id` | clients(id) | `CREATE INDEX idx_email_threads_client ON email_threads(client_id)` |
| 28 | `change_orders.proposal_id` | proposals(id) | `CREATE INDEX idx_change_orders_proposal ON change_orders(proposal_id)` |
| 29 | `time_entries.proposal_id` | proposals(id) | `CREATE INDEX idx_time_entries_proposal ON time_entries(proposal_id)` |
| 30 | `time_entries.phase_id` | phases(id) | `CREATE INDEX idx_time_entries_phase ON time_entries(phase_id)` |
| 31 | `tasks.proposal_id` | proposals(id) | `CREATE INDEX idx_tasks_proposal ON tasks(proposal_id)` |
| 32 | `tasks.phase_id` | phases(id) | `CREATE INDEX idx_tasks_phase ON tasks(phase_id)` |

### Harbor Master — Existing Indexes Verified

| Table | Required Indexes | Status |
|-------|-----------------|--------|
| invitations | token (partial), no_dup_pending | ✅ |
| sessions | user (partial), expires (partial) | ✅ |
| roles | unique_name (2 variants) | ✅ |
| permissions_unique | org+role+resource+action | ✅ (on old permissions table) |

---

## 2. EXISTING INDEX AUDIT

### Potentially Redundant Indexes

| Index | Table | Columns | Issue |
|-------|-------|---------|-------|
| None found | — | — | All existing indexes appear purposeful |

### Missing Composite Indexes (Query Performance)

| # | Table | Columns | Reason |
|---|-------|---------|--------|
| 1 | `proposals` | `(organization_id, status)` | Filter by status within org is primary query |
| 2 | `invoices` | `(organization_id, status)` | Same pattern |
| 3 | `tasks` | `(organization_id, status)` | Same pattern |
| 4 | `deals` | `(organization_id, stage)` | Pipeline view |
| 5 | `time_entries` | `(user_id, start_time)` | Timesheet construction |
| 6 | `audit_log` | `(organization_id, entity_type, created_at DESC)` | Filtered audit queries |

### GIN Indexes Needed (JSONB Columns)

| # | Table.Column | Pattern | Action |
|---|-------------|---------|--------|
| 1 | `custom_field_values.value` | JSONB queries on field values | `CREATE INDEX idx_cfv_value_gin ON custom_field_values USING GIN(value)` |
| 2 | `organizations.settings` | Config lookups | Low priority — rarely queried by key |
| 3 | `automations.trigger_config` | Rule matching | `CREATE INDEX idx_automations_trigger_gin ON automations USING GIN(trigger_config)` |

---

## 3. DUPLICATE TABLE RESOLUTION

### `calendar_sync_configs`

**Migration 00018 definition:**
```sql
CREATE TABLE public.calendar_sync_configs (
  id, user_id, organization_id, provider CHECK (IN 'google','ical'),
  external_calendar_id, sync_token, last_synced_at, enabled, timestamps
);
```

**Migration 00021 definition:**
```sql
CREATE TABLE IF NOT EXISTS public.calendar_sync_configs (
  id, user_id, organization_id, provider CHECK (IN 'google','outlook','ical'),
  access_token_encrypted, refresh_token_encrypted, calendar_id,
  sync_enabled, last_synced_at, timestamps,
  UNIQUE(user_id, organization_id, provider)
);
```

**Resolution:** Migration 00021 uses `IF NOT EXISTS` so the table from 00018 wins. The 00021 columns (`access_token_encrypted`, `refresh_token_encrypted`, `calendar_id`, `outlook` provider) are NEVER created. This is a **silent schema bug**.

**Fix:** Add `ALTER TABLE` statements to add missing columns from 00021 version.

---

## 4. MISSING FK CONSTRAINTS

| # | Table.Column | Should Reference | Action |
|---|-------------|-----------------|--------|
| 1 | `proposals.pipeline_id` | `sales_pipelines(id)` | Add FK ON DELETE SET NULL |
| 2 | `users.facility_id` | N/A (JSONB ref) | Document — cannot FK to JSONB array elem |
