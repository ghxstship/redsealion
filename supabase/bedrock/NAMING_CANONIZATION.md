# 🪨 BEDROCK — NAMING CANONIZATION

**Generated:** 2026-04-03 | **Violations Found:** 48

---

## TABLE NAMING AUDIT

| Table | Status | Issue | Recommendation |
|-------|--------|-------|----------------|
| `users` | 🟡 ACCEPTED | PostgreSQL reserved word | Document as accepted — `profiles` would require 200+ reference updates |
| `permissions` (00014) | 🟡 SUPERSEDED | Overlaps with `permission_catalog` (00022) | Drop or rename to `legacy_permissions` |
| `sso_configurations` (00014) | 🟡 SUPERSEDED | Overlaps with `auth_settings` (00022) | Drop or rename |
| `calendar_sync_configs` | 🔴 DUPLICATE | Defined in 00018 AND 00021 | Resolve: keep 00021 version (more complete) |
| All other tables | ✅ CANONICAL | snake_case, plural, no prefixes | — |

---

## COLUMN NAMING AUDIT

### 🔴 Violations — Must Fix

| Table.Column | Current Name | Canonical Name | Reason |
|-------------|-------------|----------------|--------|
| `users.full_name` | `full_name` | `first_name` + `last_name` | 1NF: non-atomic compound value |
| `venues.constraints` | `constraints` | `site_constraints` | Reserved word in SQL |
| `phases.number` | `number` | `phase_number` | Ambiguous — `number` alone is unclear |

### 🟡 Inconsistencies — Should Fix

| Table.Column | Current | Canonical | Reason |
|-------------|---------|-----------|--------|
| `proposals.probability` | `probability` | `probability_percent` | Clarify unit (0-100) |
| `deals.value` | `value` | `deal_value` | Ambiguous standalone name |
| `phase_addons.selected` | `selected` | `is_selected` | Boolean naming convention |
| `phase_addons.taxable` | `taxable` | `is_taxable` | Boolean convention |
| `phase_deliverables.taxable` | `taxable` | `is_taxable` | Boolean convention |
| `invoice_line_items.taxable` | `taxable` | `is_taxable` | Boolean convention |
| `time_entries.billable` | `billable` | `is_billable` | Boolean convention |
| `time_entries.approved` | `approved` | `is_approved` | Boolean convention |
| `proposal_comments.resolved` | `resolved` | `is_resolved` | Boolean convention |
| `assets.trackable` | `trackable` | `is_trackable` | Boolean convention |
| `assets.reusable` | `reusable` | `is_reusable` | Boolean convention |
| `assets.return_required` | `return_required` | `is_return_required` | Boolean convention |
| `holiday_calendars.recurring` | `recurring` | `is_recurring` | Boolean convention |
| `custom_field_definitions.required` | `required` | `is_required` | Boolean convention |
| `proposals.tags` | TEXT[] | — | 1NF: should be join table `proposal_tags` |
| `clients.tags` | TEXT[] | — | 1NF: should be join table using `tags` table (00021) |
| `portfolio_library.tags` | TEXT[] | — | 1NF: should be join table |
| `client_contacts.role` | `role` | `contact_role` | Disambiguation from org roles |

### ✅ Cross-Table Consistency Check

| Standard Column | Present On | Consistent Type? | Consistent Default? |
|----------------|-----------|-------------------|---------------------|
| `id` (UUID PK) | ALL 74 tables | ✅ UUID everywhere | ✅ gen_random_uuid() (except users — manual) |
| `organization_id` | 55+ tables | ✅ UUID | ✅ FK → organizations(id) |
| `created_at` | ALL 74 tables | ✅ TIMESTAMPTZ | ✅ DEFAULT now() |
| `updated_at` | 62 tables | ✅ TIMESTAMPTZ | ✅ DEFAULT now() |
| `updated_at` MISSING | 12 tables | 🔴 | invoice_payments, email_notifications, email_messages, capacity_overrides, holiday_calendars, webhook_deliveries, integration_sync_log, budget_alerts, credit_notes, payment_links, invite_code_redemptions, invitations |
| `created_by` | ~15 tables | 🟡 Inconsistent | Some use FK, some don't |

---

## FK COLUMN NAMING CONSISTENCY

| Pattern | Count | Status |
|---------|-------|--------|
| `[table_singular]_id` (e.g., `proposal_id`, `client_id`) | ~90 | ✅ Canonical |
| `[role]_id` (e.g., `created_by`, `approved_by`, `assigned_to`) | ~20 | ✅ Acceptable for role-differentiated FKs |
| `organization_id` (full name) | 55+ | ✅ Consistent (no `org_id` abbreviation) |
| `_crm_external_ids` (leading underscore) | 1 | 🟡 Non-standard prefix — rename to `crm_external_ids` |
