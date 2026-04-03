# 🪨 BEDROCK — SCHEMA CATALOG

**Generated:** 2026-04-03 | **Scope:** All 23 migrations | **Tables:** 74

---

## MIGRATION 00001 — Initial Schema (Core Platform)

### organizations
| | |
|---|---|
| **Purpose** | Root tenant entity — every resource scopes to an org |
| **Class** | ENTITY | **Growth** | slow-growth |
| **PK** | `id UUID DEFAULT gen_random_uuid()` |

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| name | TEXT | NOT NULL | — | — |
| slug | TEXT | NOT NULL | — | UNIQUE |
| logo_url | TEXT | NULL | — | — |
| favicon_url | TEXT | NULL | — | — |
| brand_config | JSONB | NOT NULL | `{...}` | — |
| facilities | JSONB | NOT NULL | `[]` | — |
| default_payment_terms | JSONB | NOT NULL | `{...}` | — |
| default_phase_template_id | UUID | NULL | — | FK → phase_templates(id) ON DELETE SET NULL |
| settings | JSONB | NOT NULL | `{...}` | — |
| subscription_tier | subscription_tier | NOT NULL | 'free' | ENUM |
| stripe_customer_id | TEXT | NULL | — | — |
| billing_email | TEXT | NULL | — | Added 00004 |
| payment_instructions | TEXT | NULL | — | Added 00004 |
| require_sso | BOOLEAN | NOT NULL | false | Added 00014 |
| stripe_connect_account_id | TEXT | NULL | — | Added 00020 |
| stripe_connect_onboarding_complete | BOOLEAN | NOT NULL | false | Added 00020 |
| date_format | TEXT | NOT NULL | 'MM/DD/YYYY' | Added 00021 |
| time_format | TEXT | NOT NULL | '12h' | Added 00021 |
| first_day_of_week | INTEGER | NOT NULL | 0 | Added 00021 |
| number_format | TEXT | NOT NULL | 'en-US' | Added 00021 |
| language | TEXT | NOT NULL | 'en' | Added 00021 |
| website | TEXT | NULL | — | Added 00022 |
| industry | TEXT | NULL | — | Added 00022 |
| size_tier | TEXT | NULL | — | CHECK IN (...) Added 00022 |
| owner_id | UUID | NULL | — | FK → users(id) Added 00022 |
| status | TEXT | NOT NULL | 'active' | CHECK IN (...) Added 00022 |
| suspension_reason | TEXT | NULL | — | Added 00022 |
| suspended_at | TIMESTAMPTZ | NULL | — | Added 00022 |
| allowed_email_domains | TEXT[] | NOT NULL | '{}' | Added 00022 |
| require_domain_match | BOOLEAN | NOT NULL | false | Added 00022 |
| require_admin_approval | BOOLEAN | NOT NULL | true | Added 00022 |
| invite_code_enabled | BOOLEAN | NOT NULL | true | Added 00022 |
| invite_expiry_hours | INTEGER | NOT NULL | 168 | Added 00022 |
| max_members | INTEGER | NULL | — | Added 00022 |
| metadata | JSONB | NOT NULL | '{}' | Added 00022 |
| default_member_role_id | UUID | NULL | — | FK → roles(id) Added 00022 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | — |

**Indexes:** `idx_organizations_slug`
**Triggers:** `set_updated_at` (BEFORE UPDATE)
**RLS:** ENABLED (3 policies: org_select, org_insert, org_update)

---

### phase_templates
| | |
|---|---|
| **Purpose** | Reusable phase structure templates for proposals |
| **Class** | CONFIG | **Growth** | static |
| **PK** | `id UUID DEFAULT gen_random_uuid()` |

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| organization_id | UUID | NOT NULL | — | FK → organizations(id) CASCADE |
| name | TEXT | NOT NULL | — | — |
| description | TEXT | NULL | — | — |
| is_default | BOOLEAN | NOT NULL | false | — |
| phases | JSONB | NOT NULL | `[]` | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | — |

**Indexes:** `idx_phase_templates_org`
**RLS:** ENABLED (4 policies)

---

### terms_documents
| | |
|---|---|
| **Purpose** | Legal terms & conditions document versions |
| **Class** | ENTITY | **Growth** | slow-growth |
| **PK** | `id UUID DEFAULT gen_random_uuid()` |

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| organization_id | UUID | NOT NULL | — | FK → organizations(id) CASCADE |
| title | TEXT | NOT NULL | — | — |
| version | INT | NOT NULL | 1 | — |
| status | terms_document_status | NOT NULL | 'draft' | ENUM |
| sections | JSONB | NOT NULL | `[]` | — |
| is_active | BOOLEAN | NOT NULL | false | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | — |

**Indexes:** `idx_terms_docs_org`
**RLS:** ENABLED

---

### portfolio_library
| | |
|---|---|
| **Purpose** | Past project showcase items for proposals |
| **Class** | ENTITY | **Growth** | slow-growth |
| **PK** | `id UUID DEFAULT gen_random_uuid()` |

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| organization_id | UUID | NOT NULL | — | FK → organizations(id) CASCADE |
| project_name | TEXT | NOT NULL | — | — |
| project_year | INT | NULL | — | — |
| client_name | TEXT | NULL | — | 🔴 3NF: stores client name instead of FK |
| description | TEXT | NULL | — | — |
| category | TEXT | NOT NULL | — | 🟡 Should be ENUM |
| image_url | TEXT | NOT NULL | — | — |
| tags | TEXT[] | NOT NULL | '{}' | 🔴 1NF: multi-value array |
| created_at | TIMESTAMPTZ | NOT NULL | now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | — |

**Indexes:** `idx_portfolio_org`
**RLS:** ENABLED

---

### users
| | |
|---|---|
| **Purpose** | Application users (mirrors auth.users) |
| **Class** | ENTITY | **Growth** | slow-growth |
| **PK** | `id UUID` (matches auth.users.id — no DEFAULT) |

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | — | PK (manual, matches auth.users) |
| email | TEXT | NOT NULL | — | — |
| full_name | TEXT | NOT NULL | — | 🔴 1NF: should be first_name + last_name |
| avatar_url | TEXT | NULL | — | — |
| organization_id | UUID | NOT NULL | — | FK → organizations(id) CASCADE |
| role | org_role | NOT NULL | 'designer' | ENUM |
| title | TEXT | NULL | — | — |
| phone | TEXT | NULL | — | — |
| rate_card | TEXT | NULL | — | — |
| facility_id | TEXT | NULL | — | 🟡 No FK (string ref to JSONB facility) |
| department | TEXT | NULL | — | Added 00012 |
| employment_type | TEXT | NULL | 'full_time' | Added 00012, 🟡 should be ENUM |
| start_date | DATE | NULL | — | Added 00012 |
| hourly_cost | NUMERIC(10,2) | NULL | — | Added 00012 |
| notification_preferences | JSONB | NOT NULL | '{}' | Added 00007 + 00022 |
| last_login_at | TIMESTAMPTZ | NULL | — | Added 00014 |
| login_count | INTEGER | NOT NULL | 0 | Added 00014 |
| mfa_enabled | BOOLEAN | NOT NULL | false | Added 00014 |
| timezone | TEXT | NOT NULL | 'UTC' | Added 00022 |
| locale | TEXT | NOT NULL | 'en' | Added 00022 |
| status | TEXT | NOT NULL | 'active' | CHECK, Added 00022 |
| suspension_reason | TEXT | NULL | — | Added 00022 |
| suspended_by | UUID | NULL | — | FK → users(id), Added 00022 |
| suspended_at | TIMESTAMPTZ | NULL | — | Added 00022 |
| deactivated_at | TIMESTAMPTZ | NULL | — | Added 00022 |
| deletion_requested_at | TIMESTAMPTZ | NULL | — | Added 00022 |
| deletion_scheduled_for | TIMESTAMPTZ | NULL | — | Added 00022 |
| last_active_at | TIMESTAMPTZ | NULL | — | Added 00022 |
| onboarding_completed_at | TIMESTAMPTZ | NULL | — | Added 00022 |
| metadata | JSONB | NOT NULL | '{}' | Added 00022 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | — |

**Indexes:** `idx_users_org`, `idx_users_email`
**RLS:** ENABLED (3 policies)

---

### clients
| | |
|---|---|
| **Purpose** | Client companies (proposal recipients) |
| **Class** | ENTITY | **Growth** | slow-growth |

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| organization_id | UUID | NOT NULL | — | FK → organizations(id) CASCADE |
| company_name | TEXT | NOT NULL | — | — |
| industry | TEXT | NULL | — | — |
| billing_address | JSONB | NULL | — | — |
| tags | TEXT[] | NOT NULL | '{}' | 🔴 1NF: multi-value array |
| source | TEXT | NULL | — | — |
| _crm_external_ids | JSONB | NULL | — | — |
| website | TEXT | NULL | — | Added 00003 |
| linkedin | TEXT | NULL | — | Added 00003 |
| annual_revenue | NUMERIC(14,2) | NULL | — | Added 00003 |
| employee_count | INTEGER | NULL | — | Added 00003 |
| notes | TEXT | NULL | — | Added 00003 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | — |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | — |

**Indexes:** `idx_clients_org`
**RLS:** ENABLED

---

### REMAINING TABLES (Summary Format)

#### Migration 00001 (continued)
| Table | Class | Columns | Key Issues |
|-------|-------|---------|------------|
| client_contacts | ENTITY | 12 | ✅ Canonical |
| proposals | ENTITY | 25+ | 🟡 `probability` should be `probability_percent` |
| venues | ENTITY | 12 | 🟡 `constraints` is reserved word; `address` is JSONB |
| phases | ENTITY | 10 | 🟡 `number` is ambiguous |
| phase_deliverables | ENTITY | 16 | ✅ Well-structured |
| phase_addons | ENTITY | 18 | 🟡 Booleans: `selected`, `taxable` naming |
| milestone_gates | ENTITY | 7 | ✅ Canonical |
| milestone_requirements | ENTITY | 12 | ✅ Canonical |
| creative_references | ENTITY | 7 | ✅ Canonical |
| phase_portfolio_links | RELATIONSHIP | 5 | ✅ Canonical |
| team_assignments | RELATIONSHIP | 6 | ✅ Canonical |
| invoices | ENTITY | 19+ | 🟡 Money columns lack CHECK ≥ 0 |
| invoice_line_items | ENTITY | 12 | 🟡 Missing FK indexes on deliverable_id, addon_id |
| assets | ENTITY | 23 | 🔴 `dimensions`, `weight` are TEXT (atomic violation) |
| asset_location_history | AUDIT | 8 | 🟡 `photo_urls` TEXT[] |
| activity_log | AUDIT | 9 | 🟡 Missing index on actor_id |
| proposal_comments | ENTITY | 11 | 🟡 Booleans: `resolved` naming |
| file_attachments | ENTITY | 10 | ✅ Canonical |
| export_configurations | CONFIG | 6 | ✅ Canonical |

#### Migration 00002 — Subscription Helpers
| Table | Class | Key Issues |
|-------|-------|------------|
| *(no new tables — adds `deal_stage` ENUM + columns to proposals)* | — | ✅ |

#### Migration 00003 — CRM Pipeline
| Table | Class | Key Issues |
|-------|-------|------------|
| sales_pipelines | CONFIG | ✅ |
| deals | ENTITY | 🟡 `value` ambiguous name |
| deal_activities | AUDIT | 🟡 `org_id` denormalized (3NF) |
| client_interactions | AUDIT | 🟡 `org_id` denormalized (3NF) |

#### Migration 00004 — Invoicing
| Table | Class | Key Issues |
|-------|-------|------------|
| invoice_payments | ENTITY | 🟡 No `updated_at`, `org_id` denormalized |
| email_notifications | AUDIT | 🟡 No `updated_at`, polymorphic FK pattern |

#### Migration 00005 — Reporting
| Table | Class | Key Issues |
|-------|-------|------------|
| saved_reports | CONFIG | ✅ |

#### Migration 00006 — Integrations
| Table | Class | Key Issues |
|-------|-------|------------|
| integrations | CONFIG | 🟡 `status` is TEXT, no ENUM/CHECK |
| integration_sync_log | AUDIT | 🟡 `org_id` denormalized, no `updated_at` |
| webhook_endpoints | CONFIG | 🟡 `events` TEXT[] (1NF) |
| webhook_deliveries | AUDIT | 🟡 No `updated_at`, no `org_id` (orphan risk) |

#### Migration 00007 — Automations
| Table | Class | Key Issues |
|-------|-------|------------|
| automations | CONFIG | ✅ |
| automation_runs | AUDIT | 🟡 `org_id` denormalized |
| email_threads | ENTITY | ✅ |
| email_messages | AUDIT | 🟡 `to_emails` TEXT[] (1NF), no `updated_at` |

#### Migration 00008 — Advanced Invoicing
| Table | Class | Key Issues |
|-------|-------|------------|
| credit_notes | ENTITY | 🟡 No `updated_at`, `org_id` denormalized |
| change_orders | ENTITY | 🟡 `status` TEXT, `org_id` denormalized |
| recurring_invoice_schedules | CONFIG | ✅ |
| custom_reports | CONFIG | ✅ |

#### Migration 00009 — Time Tracking
| Table | Class | Key Issues |
|-------|-------|------------|
| time_entries | ENTITY | 🟡 Booleans: `billable`, `approved` naming |
| timesheets | ENTITY | 🟡 `status` TEXT |
| time_policies | CONFIG | ✅ |

#### Migration 00010 — Resources & Budgets
| Table | Class | Key Issues |
|-------|-------|------------|
| resource_allocations | ENTITY | 🟡 Missing CHECK end_date ≥ start_date |
| capacity_overrides | ENTITY | 🟡 No `updated_at` |
| project_budgets | ENTITY | 🟡 `org_id` denormalized, `spent` is derived |
| budget_line_items | ENTITY | ✅ |
| budget_alerts | AUDIT | 🟡 `org_id` denormalized, no `updated_at` |

#### Migration 00011 — Profitability & Expenses
| Table | Class | Key Issues |
|-------|-------|------------|
| project_costs | ENTITY | 🟡 `org_id` denormalized |
| expenses | ENTITY | 🟡 `status` TEXT |
| purchase_orders | ENTITY | 🟡 `status` TEXT |
| revenue_recognition | ENTITY | ✅ |

#### Migration 00012 — People & HR
| Table | Class | Key Issues |
|-------|-------|------------|
| time_off_policies | CONFIG | ✅ |
| time_off_balances | ENTITY | 🟡 `org_id` denormalized |
| time_off_requests | ENTITY | 🟡 `status` TEXT |
| holiday_calendars | LOOKUP | 🟡 No `updated_at` |
| org_chart_positions | ENTITY | ✅ Self-referencing FK |

#### Migration 00013 — Tasks & Custom Fields
| Table | Class | Key Issues |
|-------|-------|------------|
| tasks | ENTITY | 🔴 `status` TEXT, `priority` TEXT — need ENUMs |
| task_dependencies | RELATIONSHIP | ✅ |
| task_comments | ENTITY | ✅ |
| custom_field_definitions | CUSTOM | 🔴 Multiple gaps (see Phase 6) |
| custom_field_values | CUSTOM | 🔴 Single JSONB value column (see Phase 6) |
| proposal_scenarios | ENTITY | 🟡 `org_id` denormalized |

#### Migration 00014 — AI & Security
| Table | Class | Key Issues |
|-------|-------|------------|
| ai_conversations | ENTITY | ✅ |
| audit_log | AUDIT | ✅ Extended in 00022 |
| permissions | CONFIG | 🟡 Superseded by Harbor Master permission_catalog |
| sso_configurations | CONFIG | 🟡 Superseded by Harbor Master auth_settings |

#### Migration 00015 — Crew Management
| Table | Class | Key Issues |
|-------|-------|------------|
| crew_profiles | ENTITY | 🟡 `skills` TEXT[] (1NF), no updated_at trigger |
| crew_availability | ENTITY | 🟡 `status` CHECK not ENUM |
| crew_bookings | ENTITY | 🟡 `status`, `rate_type` CHECK not ENUM |

#### Migration 00016 — Equipment Management
| Table | Class | Key Issues |
|-------|-------|------------|
| equipment_bundles | CONFIG | 🔴 `items` JSONB — should be join table |
| equipment_reservations | ENTITY | 🟡 `status` CHECK, `condition_on_return` CHECK |
| maintenance_records | ENTITY | 🟡 `type`, `status` CHECK not ENUM |

#### Migration 00017 — E-Sign & Notifications
| Table | Class | Key Issues |
|-------|-------|------------|
| esignature_requests | ENTITY | 🟡 `ip_address` TEXT (should be INET) |
| notification_preferences | CONFIG | ✅ |

#### Migration 00018 — Calendar, Leads, Payments
| Table | Class | Key Issues |
|-------|-------|------------|
| shifts | ENTITY | ✅ |
| calendar_sync_configs | CONFIG | 🔴 DUPLICATE — also in 00021 |
| leads | ENTITY | 🟡 `status` CHECK not ENUM |
| lead_forms | CONFIG | ✅ |
| payment_links | ENTITY | 🟡 `status` CHECK not ENUM |

#### Migration 00019 — Onboarding & Warehouse
| Table | Class | Key Issues |
|-------|-------|------------|
| onboarding_documents | ENTITY | 🟡 `type`, `status` CHECK not ENUM |
| warehouse_transfers | ENTITY | 🟡 `items` JSONB (should be join table), `status` CHECK |

#### Migration 00020 — Stripe Connect
*(No new tables — extends organizations)*

#### Migration 00021 — Settings Tables
| Table | Class | Key Issues |
|-------|-------|------------|
| user_preferences | CONFIG | ✅ Well-constrained |
| api_keys | CONFIG | ✅ Extended in 00022 |
| tags | LOOKUP | ✅ |
| email_templates | CONFIG | ✅ |
| document_defaults | CONFIG | ✅ |
| calendar_sync_configs | CONFIG | 🔴 DUPLICATE of 00018 |

#### Migration 00022 — Harbor Master
| Table | Class | Key Issues |
|-------|-------|------------|
| roles | LOOKUP | ✅ Well-designed |
| permission_catalog | LOOKUP | ✅ |
| role_permissions | RELATIONSHIP | ✅ |
| teams | ENTITY | ✅ |
| projects | ENTITY | ✅ |
| organization_memberships | RELATIONSHIP | ✅ |
| team_memberships | RELATIONSHIP | ✅ |
| project_memberships | RELATIONSHIP | ✅ |
| invitations | ENTITY | ✅ |
| invite_codes | ENTITY | ✅ |
| invite_code_redemptions | AUDIT | ✅ |
| join_requests | ENTITY | ✅ |
| auth_settings | CONFIG | ✅ |
| sessions | ENTITY | ✅ |
| subscription_plans | LOOKUP | ✅ |
| seat_allocations | CONFIG | ✅ |
| feature_flags | CONFIG | ✅ |
| feature_flag_overrides | CONFIG | ✅ |

---

## TABLE COUNT SUMMARY

| Migration | Tables Created | Tables Extended |
|-----------|---------------|-----------------|
| 00001 | 19 | — |
| 00002 | 0 | 1 (proposals) |
| 00003 | 4 | 1 (clients) |
| 00004 | 2 | 2 (organizations, invoices) |
| 00005 | 1 | — |
| 00006 | 4 | — |
| 00007 | 4 | 1 (users) |
| 00008 | 4 | — |
| 00009 | 3 | — |
| 00010 | 5 | — |
| 00011 | 4 | — |
| 00012 | 5 | 1 (users) |
| 00013 | 6 | — |
| 00014 | 4 | 2 (users, organizations) |
| 00015 | 3 | 1 (assets) |
| 00016 | 3 | — |
| 00017 | 2 | — |
| 00018 | 5 | — |
| 00019 | 2 | — |
| 00020 | 0 | 1 (organizations) |
| 00021 | 6 | 1 (organizations) |
| 00022 | 18 | 3 (organizations, users, audit_log, api_keys) |
| 00023 | 0 | 0 (seed data only) |
| **TOTAL** | **74 unique tables** | — |

## CLASSIFICATION SUMMARY

| Classification | Count | Tables |
|---------------|-------|--------|
| ENTITY | 42 | proposals, clients, invoices, assets, tasks, deals, leads, etc. |
| RELATIONSHIP | 6 | phase_portfolio_links, team_assignments, role_permissions, org/team/project_memberships |
| LOOKUP | 4 | roles, permission_catalog, subscription_plans, tags |
| AUDIT | 10 | activity_log, audit_log, deal_activities, client_interactions, etc. |
| CONFIG | 11 | phase_templates, export_configurations, integrations, feature_flags, etc. |
| CUSTOM | 2 | custom_field_definitions, custom_field_values |
| ORPHAN (potential) | 1 | webhook_deliveries (no org_id, FK only to webhook_endpoints) |

## VIOLATION SUMMARY

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 8 | 1NF violations (arrays), duplicate table, custom fields gaps, atomic violations |
| 🟡 Moderate | 35+ | Missing ENUMs, missing FK indexes, boolean naming, denormalized org_id, missing triggers |
| ✅ Canonical | 30+ | Tables following all conventions |
