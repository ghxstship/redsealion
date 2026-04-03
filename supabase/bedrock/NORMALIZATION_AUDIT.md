# 🪨 BEDROCK — NORMALIZATION AUDIT (3NF Compliance)

**Generated:** 2026-04-03 | **Violations Found:** 32

---

## 1NF VIOLATIONS — Non-Atomic Values

### TEXT[] Array Columns (Multi-Value Strings)

| # | Table.Column | Current | Fix | Priority |
|---|-------------|---------|-----|----------|
| 1 | `portfolio_library.tags` | TEXT[] | Join table: `portfolio_tags(portfolio_id, tag_id)` using `tags` table | Medium |
| 2 | `clients.tags` | TEXT[] | Join table: `client_tags(client_id, tag_id)` using `tags` table | Medium |
| 3 | `proposals.tags` | TEXT[] | Join table: `proposal_tags(proposal_id, tag_id)` using `tags` table | Medium |
| 4 | `assets.photo_urls` | TEXT[] | Table: `asset_photos(asset_id, url, sort_order, is_primary)` | Low |
| 5 | `asset_location_history.photo_urls` | TEXT[] | Table: `asset_move_photos(move_id, url)` | Low |
| 6 | `webhook_endpoints.events` | TEXT[] | Table: `webhook_event_subscriptions(endpoint_id, event)` | Low |
| 7 | `crew_profiles.skills` | TEXT[] | Table: `crew_skills(crew_profile_id, skill)` or join to `tags` | Medium |
| 8 | `email_messages.to_emails` | TEXT[] | Acceptable — email recipients are a flat list, rarely queried individually | ⚠️ Accepted |
| 9 | `api_keys.scopes` | TEXT[] | Acceptable — small fixed set of permission scopes | ⚠️ Accepted |
| 10 | `organizations.allowed_email_domains` | TEXT[] | Acceptable — small domain list for auth matching | ⚠️ Accepted |

### Compound Value Columns

| # | Table.Column | Current | Fix | Priority |
|---|-------------|---------|-----|----------|
| 11 | `users.full_name` | `"Julian Smith"` | Split to `first_name VARCHAR(255)` + `last_name VARCHAR(255)` | High |
| 12 | `assets.dimensions` | TEXT `"10x20x5"` | Split to `width_cm NUMERIC`, `height_cm NUMERIC`, `depth_cm NUMERIC` | Medium |
| 13 | `assets.weight` | TEXT `"50 lbs"` | Split to `weight_value NUMERIC`, `weight_unit VARCHAR(10)` | Medium |

### JSONB Storing Relational Data

| # | Table.Column | Current | Fix | Priority |
|---|-------------|---------|-----|----------|
| 14 | `organizations.facilities` | JSONB[] of facility objects | Table: `facilities(id, org_id, name, city, state, country, type, is_hq)` | High |
| 15 | `equipment_bundles.items` | JSONB[] of item references | Table: `equipment_bundle_items(bundle_id, asset_id, quantity)` | Medium |
| 16 | `warehouse_transfers.items` | JSONB[] of transfer items | Table: `warehouse_transfer_items(transfer_id, asset_id, quantity)` | Medium |
| 17 | `phase_templates.phases` | JSONB[] of phase configs | ⚠️ Acceptable — template configuration blob, not queried relationally | Accepted |
| 18 | `organizations.brand_config` | JSONB settings object | ⚠️ Acceptable — UI configuration with documented shape | Accepted |
| 19 | `organizations.settings` | JSONB settings object | ⚠️ Acceptable — runtime configuration | Accepted |
| 20 | `organizations.default_payment_terms` | JSONB financial config | ⚠️ Acceptable — documented shape, rarely JOINed | Accepted |

---

## 2NF VIOLATIONS — Partial Dependencies

No tables use composite primary keys (all use single UUID PK). However, some join tables with composite UNIQUE constraints should be checked:

| Table | Composite Constraint | Non-Key Columns | 2NF Status |
|-------|---------------------|-----------------|------------|
| `custom_field_values` | UNIQUE(field_definition_id, entity_id) | `value` | ✅ Value depends on full composite |
| `crew_availability` | UNIQUE(user_id, date) | `status`, `note` | ✅ Status depends on full composite |
| `notification_preferences` | UNIQUE(user_id, event_type, channel) | `enabled` | ✅ |
| `time_off_balances` | No unique constraint | `year`, `entitled_days`, etc. | 🟡 Should add UNIQUE(user_id, policy_id, year) |

**Result: No 2NF violations found.**

---

## 3NF VIOLATIONS — Transitive Dependencies

### Redundant `organization_id` (Denormalized for RLS)

| # | Table | org_id Source | Derivable Via | Justified? |
|---|-------|-------------|---------------|-----------|
| 1 | `deal_activities` | Direct column | `deal_id → deals.organization_id` | ✅ RLS perf |
| 2 | `client_interactions` | Direct column | `client_id → clients.organization_id` | ✅ RLS perf |
| 3 | `invoice_payments` | Direct column | `invoice_id → invoices.organization_id` | ✅ RLS perf |
| 4 | `email_notifications` | Direct column | Could be orphaned | ✅ RLS perf |
| 5 | `integration_sync_log` | Direct column | `integration_id → integrations.organization_id` | ✅ RLS perf |
| 6 | `automation_runs` | Direct column | `automation_id → automations.organization_id` | ✅ RLS perf |
| 7 | `credit_notes` | Direct column | `invoice_id → invoices.organization_id` | ✅ RLS perf |
| 8 | `change_orders` | Direct column | `proposal_id → proposals.organization_id` | ✅ RLS perf |
| 9 | `project_budgets` | Direct column | `proposal_id → proposals.organization_id` | ✅ RLS perf |
| 10 | `budget_alerts` | Direct column | `budget_id → project_budgets.organization_id` | ✅ RLS perf |
| 11 | `project_costs` | Direct column | `proposal_id → proposals.organization_id` | ✅ RLS perf |
| 12 | `proposal_scenarios` | Direct column | `proposal_id → proposals.organization_id` | ✅ RLS perf |
| 13 | `invoices` | Direct column | `proposal_id → proposals.organization_id` | ✅ RLS perf |
| 14 | `assets` | Direct column | `proposal_id → proposals.organization_id` | ✅ RLS perf |
| 15 | `activity_log` | Direct column | `proposal_id → proposals.organization_id` | ✅ RLS perf |
| 16 | `team_memberships` | Direct column | `team_id → teams.organization_id` | ✅ RLS perf |
| 17 | `project_memberships` | Direct column | `project_id → projects.organization_id` | ✅ RLS perf |
| 18 | `time_off_balances` | Direct column | `user_id → users.organization_id` | ✅ RLS perf |
| 19 | `time_off_requests` | Direct column | `user_id → users.organization_id` | ✅ RLS perf |

**Verdict:** All 19 `organization_id` denormalizations are justified for Supabase RLS policy performance. Each must be registered in `DENORMALIZATION_REGISTER.md` with maintenance triggers and reconciliation queries.

### Derived/Computed Values

| # | Table.Column | Source of Truth | Violation? |
|---|-------------|-----------------|-----------|
| 1 | `proposals.total_value` | SUM of phase investments | 🟡 Computed — needs trigger |
| 2 | `proposals.total_with_addons` | total_value + selected addons | 🟡 Computed — needs trigger |
| 3 | `project_budgets.spent` | SUM of project_costs + expenses | 🟡 Computed — needs trigger |
| 4 | `automations.run_count` | COUNT of automation_runs | 🟡 Computed — needs trigger |
| 5 | `email_threads.message_count` | COUNT of email_messages | 🟡 Computed — needs trigger |
| 6 | `assets.deployment_count` | COUNT of equipment_reservations | 🟡 Computed — needs trigger |
| 7 | `invite_codes.current_uses` | COUNT of invite_code_redemptions | 🟡 Computed — needs trigger |

---

## SSOT VIOLATION SCAN

| # | Duplicate Fact | Authoritative Source | Where Duplicated | Action |
|---|---------------|---------------------|------------------|--------|
| 1 | `billing_email` on organizations | Added in 00004 AND 00022 | Two ALTER TABLE ADD COLUMN IF NOT EXISTS | ✅ Idempotent — no conflict |
| 2 | `notification_preferences` on users | Added in 00007 AND 00022 | Two ALTER TABLE | ✅ Idempotent |
| 3 | `calendar_sync_configs` table | 00021 version (more complete) | 00018 creates initial, 00021 creates IF NOT EXISTS | 🔴 Schema mismatch — 00021 columns never added |
| 4 | `permissions` table (00014) vs `permission_catalog` (00022) | `permission_catalog` is authoritative | `permissions` is legacy | 🟡 Drop `permissions` or document as separate concern |
| 5 | `sso_configurations` (00014) vs `auth_settings` (00022) | `auth_settings` is authoritative | `sso_configurations` is legacy | 🟡 Drop or document |
