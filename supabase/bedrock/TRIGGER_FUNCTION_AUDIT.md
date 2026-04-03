# 🪨 BEDROCK — TRIGGER & FUNCTION AUDIT

**Generated:** 2026-04-03

---

## 1. FUNCTIONS INVENTORY

| Function | Type | Created In | Purpose | Security |
|----------|------|-----------|---------|----------|
| `update_updated_at()` | TRIGGER FN | 00001 | Sets `updated_at = now()` on UPDATE | ✅ |
| `auth_user_org_id()` | HELPER | 00001 | Returns caller's organization_id | SECURITY DEFINER ✅ |
| `auth_user_role()` | HELPER | 00001 | Returns caller's org role | SECURITY DEFINER ✅ |
| `is_super_admin()` | HELPER | 00001 | Returns true if super_admin | SECURITY DEFINER ✅ |
| `is_org_admin_or_above()` | HELPER | 00001 | Returns true if admin+ | SECURITY DEFINER ✅ |
| `is_producer_role()` | HELPER | 00001 | Returns true if producer-level | SECURITY DEFINER ✅ |
| `get_subscription_tier(UUID)` | HELPER | 00002 | Returns org's subscription tier | SECURITY DEFINER ✅ |
| `is_feature_available(TEXT)` | HELPER | 00002 | Checks tier feature access | SECURITY DEFINER ✅ |
| `check_permission(UUID,TEXT,TEXT,TEXT,UUID)` | HELPER | 00022 | Evaluates RBAC permission | SECURITY DEFINER STABLE ✅ |
| `evaluate_feature_flag(TEXT,UUID,UUID)` | HELPER | 00022 | Evaluates feature flag state | SECURITY DEFINER STABLE ✅ |

### Redundancy Analysis
- `is_org_admin_or_above()` and `is_producer_role()` overlap with `check_permission()` from Harbor Master
- Recommend: Keep both for backward compat; new code should use `check_permission()`

---

## 2. TRIGGER INVENTORY

### `update_updated_at` Trigger Coverage

#### ✅ Applied via Dynamic Loop (Migration 00001)
Tables covered: `organizations, phase_templates, terms_documents, portfolio_library, users, clients, client_contacts, proposals, venues, phases, phase_deliverables, phase_addons, milestone_gates, milestone_requirements, creative_references, phase_portfolio_links, team_assignments, invoices, invoice_line_items, assets, proposal_comments, file_attachments, export_configurations`

#### ✅ Applied Explicitly (Later Migrations)
| Table | Migration | Trigger Name |
|-------|-----------|-------------|
| sales_pipelines | 00003 | update_sales_pipelines_updated_at |
| deals | 00003 | update_deals_updated_at |
| saved_reports | 00005 | update_saved_reports_updated_at |
| integrations | 00006 | update_integrations_updated_at |
| webhook_endpoints | 00006 | update_webhook_endpoints_updated_at |
| automations | 00007 | update_automations_updated_at |
| change_orders | 00008 | update_change_orders_updated_at |
| recurring_invoice_schedules | 00008 | update_recurring_schedules_updated_at |
| custom_reports | 00008 | update_custom_reports_updated_at |
| time_entries | 00009 | update_time_entries_updated_at |
| timesheets | 00009 | update_timesheets_updated_at |
| time_policies | 00009 | update_time_policies_updated_at |
| resource_allocations | 00010 | update_resource_allocations_updated_at |
| project_budgets | 00010 | update_project_budgets_updated_at |
| budget_line_items | 00010 | update_budget_line_items_updated_at |
| project_costs | 00011 | update_project_costs_updated_at |
| expenses | 00011 | update_expenses_updated_at |
| purchase_orders | 00011 | update_purchase_orders_updated_at |
| revenue_recognition | 00011 | update_revenue_recognition_updated_at |
| time_off_policies | 00012 | update_time_off_policies_updated_at |
| time_off_balances | 00012 | update_time_off_balances_updated_at |
| time_off_requests | 00012 | update_time_off_requests_updated_at |
| org_chart_positions | 00012 | update_org_chart_positions_updated_at |
| tasks | 00013 | update_tasks_updated_at |
| task_comments | 00013 | update_task_comments_updated_at |
| custom_field_definitions | 00013 | update_custom_field_definitions_updated_at |
| custom_field_values | 00013 | update_custom_field_values_updated_at |
| proposal_scenarios | 00013 | update_proposal_scenarios_updated_at |
| ai_conversations | 00014 | update_ai_conversations_updated_at |
| permissions | 00014 | update_permissions_updated_at |
| sso_configurations | 00014 | update_sso_configurations_updated_at |
| HM tables (11) | 00022 | Dynamic loop — roles, teams, projects, memberships, etc. |

#### 🔴 MISSING `updated_at` TRIGGER (Tables WITH `updated_at` Column)

| Table | Has `updated_at`? | Has Trigger? | Action |
|-------|-------------------|-------------|--------|
| crew_profiles | ✅ YES | ❌ NO | Add trigger |
| crew_availability | ✅ YES | ❌ NO | Add trigger |
| crew_bookings | ✅ YES | ❌ NO | Add trigger |
| equipment_bundles | ✅ YES | ❌ NO | Add trigger |
| equipment_reservations | ✅ YES | ❌ NO | Add trigger |
| maintenance_records | ✅ YES | ❌ NO | Add trigger |
| esignature_requests | ✅ YES | ❌ NO | Add trigger |
| notification_preferences | ✅ YES | ❌ NO | Add trigger |
| shifts | ✅ YES | ❌ NO | Add trigger |
| calendar_sync_configs | ✅ YES | ❌ NO | Add trigger |
| leads | ✅ YES | ❌ NO | Add trigger |
| lead_forms | ✅ YES | ❌ NO | Add trigger |
| onboarding_documents | ✅ YES | ❌ NO | Add trigger |
| warehouse_transfers | ✅ YES | ❌ NO | Add trigger |
| user_preferences | ✅ YES | ❌ NO | Add trigger |
| email_templates | ✅ YES | ❌ NO | Add trigger |
| document_defaults | ✅ YES | ❌ NO | Add trigger |

**Total missing: 17 tables** with `updated_at` columns but no trigger.

#### Tables WITHOUT `updated_at` (No Trigger Needed)

| Table | Reason | Action |
|-------|--------|--------|
| invoice_payments | Write-once record | 🟡 Consider adding `updated_at` |
| email_notifications | Write-once record | ⚠️ Accepted |
| email_messages | Write-once record | ⚠️ Accepted |
| capacity_overrides | Write-once record | 🟡 Consider adding |
| holiday_calendars | Write-once record | 🟡 Consider adding |
| webhook_deliveries | Write-once record | ⚠️ Accepted |
| integration_sync_log | Write-once log | ⚠️ Accepted |
| budget_alerts | Write-once notification | ⚠️ Accepted |
| credit_notes | Immutable financial record | ⚠️ Accepted |
| payment_links | Write-once | ⚠️ Accepted |
| activity_log / audit_log | Immutable audit trail | ⚠️ Accepted |
| deal_activities | Write-once | ⚠️ Accepted |
| client_interactions | Write-once | ⚠️ Accepted |
| invitations | Status-only updates | 🟡 Consider adding |
| invite_code_redemptions | Write-once | ⚠️ Accepted |
| sessions | status updates via API | 🟡 Consider adding |
| subscription_plans | Platform-managed | ⚠️ Accepted |

---

## 3. MISSING DENORMALIZATION TRIGGERS

See DENORMALIZATION_REGISTER.md — **0 of 26 registered denormalizations have maintenance triggers.** All rely on application-level consistency.
