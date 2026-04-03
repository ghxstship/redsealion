# 🪨 BEDROCK — RELATIONSHIP MAP

**Generated:** 2026-04-03 | **FK Count:** ~120+ | **Tables:** 74

---

## 1. DIRECT RELATIONSHIPS (Foreign Keys)

### Core Entity Graph
```
organizations (ROOT)
├── phase_templates (organization_id → CASCADE)
├── terms_documents (organization_id → CASCADE)
├── portfolio_library (organization_id → CASCADE)
├── users (organization_id → CASCADE)
│   ├── client_contacts.user_id → SET NULL
│   ├── proposals.created_by → NO ACTION
│   ├── team_assignments.user_id → CASCADE
│   ├── time_entries.user_id → CASCADE
│   ├── expenses.user_id → CASCADE
│   ├── crew_profiles.user_id → CASCADE
│   ├── crew_availability.user_id → CASCADE
│   ├── crew_bookings.user_id → CASCADE
│   ├── ai_conversations.user_id → CASCADE
│   ├── timesheets.user_id → CASCADE
│   ├── resource_allocations.user_id → CASCADE
│   ├── calendar_sync_configs.user_id → CASCADE
│   ├── notification_preferences.user_id → CASCADE
│   ├── onboarding_documents.user_id → CASCADE
│   ├── user_preferences.user_id → CASCADE
│   ├── sessions.user_id → CASCADE
│   ├── organization_memberships.user_id → CASCADE
│   ├── team_memberships.user_id → CASCADE
│   └── project_memberships.user_id → CASCADE
├── clients (organization_id → CASCADE)
│   ├── client_contacts (client_id → CASCADE)
│   ├── deals (client_id → CASCADE)
│   ├── client_interactions (client_id → CASCADE)
│   ├── recurring_invoice_schedules (client_id → CASCADE)
│   └── email_threads (client_id → SET NULL)
├── proposals (organization_id → CASCADE)
│   ├── venues (proposal_id → CASCADE)
│   │   ├── shifts (venue_id → CASCADE)
│   │   ├── crew_bookings (venue_id → SET NULL)
│   │   └── equipment_reservations (venue_id → SET NULL)
│   ├── phases (proposal_id → CASCADE)
│   │   ├── phase_deliverables (phase_id → CASCADE)
│   │   ├── phase_addons (phase_id → CASCADE)
│   │   ├── milestone_gates (phase_id → CASCADE)
│   │   │   └── milestone_requirements (milestone_id → CASCADE)
│   │   ├── creative_references (phase_id → CASCADE)
│   │   └── phase_portfolio_links (phase_id → CASCADE)
│   ├── invoices (proposal_id → CASCADE)
│   │   ├── invoice_line_items (invoice_id → CASCADE)
│   │   ├── invoice_payments (invoice_id → CASCADE)
│   │   ├── credit_notes (invoice_id → CASCADE)
│   │   └── payment_links (invoice_id → CASCADE)
│   ├── assets (proposal_id → CASCADE)
│   │   ├── asset_location_history (asset_id → CASCADE)
│   │   ├── equipment_reservations (asset_id → CASCADE)
│   │   └── maintenance_records (asset_id → CASCADE)
│   ├── team_assignments (proposal_id → CASCADE)
│   ├── activity_log (proposal_id → CASCADE)
│   ├── proposal_comments (proposal_id → CASCADE)
│   ├── file_attachments (proposal_id → CASCADE)
│   ├── change_orders (proposal_id → CASCADE)
│   ├── crew_bookings (proposal_id → CASCADE)
│   ├── equipment_reservations (proposal_id → CASCADE)
│   ├── shifts (proposal_id → CASCADE)
│   ├── project_budgets (proposal_id → CASCADE)
│   │   ├── budget_line_items (budget_id → CASCADE)
│   │   └── budget_alerts (budget_id → CASCADE)
│   ├── project_costs (proposal_id → CASCADE)
│   ├── proposal_scenarios (proposal_id → CASCADE)
│   └── time_entries (proposal_id → SET NULL)
├── sales_pipelines (organization_id → CASCADE)
│   └── deals (pipeline_id → SET NULL)
├── integrations (organization_id → CASCADE)
│   └── integration_sync_log (integration_id → CASCADE)
├── webhook_endpoints (organization_id → CASCADE)
│   └── webhook_deliveries (webhook_endpoint_id → CASCADE)
├── automations (organization_id → CASCADE)
│   └── automation_runs (automation_id → CASCADE)
├── email_threads (organization_id → CASCADE)
│   └── email_messages (thread_id → CASCADE)
├── roles (organization_id → CASCADE [nullable])
│   ├── role_permissions (role_id → CASCADE)
│   ├── organization_memberships (role_id → NO ACTION)
│   ├── team_memberships (role_id → NO ACTION)
│   └── project_memberships (role_id → NO ACTION)
├── teams (organization_id → CASCADE)
│   └── team_memberships (team_id → CASCADE)
├── projects (organization_id → CASCADE)
│   └── project_memberships (project_id → CASCADE)
├── invitations (organization_id → CASCADE)
├── invite_codes (organization_id → CASCADE)
│   └── invite_code_redemptions (invite_code_id → CASCADE)
├── join_requests (organization_id → CASCADE)
├── auth_settings (organization_id → CASCADE, UNIQUE)
├── seat_allocations (organization_id → CASCADE, UNIQUE)
│   └── subscription_plans (plan_id → NO ACTION)
├── feature_flags (standalone, no org FK)
│   └── feature_flag_overrides (feature_flag_id → CASCADE)
└── custom_field_definitions (organization_id → CASCADE)
    └── custom_field_values (field_definition_id → CASCADE)
```

### Circular Dependencies
| Cycle | Tables | Intentional? | Resolution |
|-------|--------|-------------|------------|
| organizations ↔ phase_templates | `organizations.default_phase_template_id → phase_templates.id`, `phase_templates.organization_id → organizations.id` | ✅ Yes | Deferred FK with ON DELETE SET NULL |
| proposals ↔ phases | `proposals.current_phase_id → phases.id`, `phases.proposal_id → proposals.id` | ✅ Yes | Deferred FK with ON DELETE SET NULL |
| users self-ref (via 00022) | `users.suspended_by → users.id` | ✅ Yes | Self-referencing, appropriate |
| org_chart_positions self-ref | `reports_to → org_chart_positions.id` | ✅ Yes | Hierarchical self-reference |
| proposals self-ref | `parent_proposal_id → proposals.id` | ✅ Yes | Version chain |

---

## 2. IMPLICIT RELATIONSHIPS (No FK Constraint)

| Table.Column | Looks Like FK To | Issue | Fix |
|-------------|------------------|-------|-----|
| `users.facility_id` (TEXT) | `organizations.facilities[].id` (JSONB) | String reference to JSONB array element | 🟡 Document — polymorphic ref to JSONB, FK not possible |
| `email_notifications.related_entity_id` | Multiple tables | Polymorphic FK pattern | 🟡 Document with `related_entity_type` mapping |
| `custom_field_values.entity_id` | Multiple entity tables | Polymorphic FK pattern | 🟡 Document — entity_type should exist on values table |
| `invitations.scope_id` | organizations/teams/projects | Polymorphic FK via `scope_type` | 🟡 Document — valid pattern with scope_type |
| `invite_codes.scope_id` | organizations/teams/projects | Same polymorphic pattern | 🟡 Document |
| `join_requests.scope_id` | organizations/teams/projects | Same polymorphic pattern | 🟡 Document |
| `invite_code_redemptions.resulted_in_membership_id` | org/team/project_memberships | Polymorphic via `membership_scope` | 🟡 Document |
| `warehouse_transfers.from_facility_id` (TEXT) | No table | String ref to JSONB facility | 🟡 Document — same issue as users.facility_id |
| `warehouse_transfers.to_facility_id` (TEXT) | No table | Same | 🟡 Document |
| `proposals.pipeline_id` (UUID) | sales_pipelines | 🔴 Missing FK constraint | Add FK |

---

## 3. ORPHAN DETECTION

| Table | Incoming FKs | Outgoing FKs | Status |
|-------|-------------|-------------|--------|
| webhook_deliveries | 0 | 1 (webhook_endpoints) | 🟡 No org_id — scoped only via parent |
| email_messages | 0 | 1 (email_threads) | 🟡 No org_id — scoped only via parent |
| permission_catalog | 1 (role_permissions) | 0 | ✅ Reference/lookup table |
| subscription_plans | 1 (seat_allocations) | 0 | ✅ Reference/lookup table |
| feature_flags | 1 (feature_flag_overrides) | 0 | ✅ Platform-level config |
| permissions (00014) | 0 | 1 (organizations) | 🟡 Superseded by permission_catalog (00022) — candidate for removal |
| sso_configurations (00014) | 0 | 1 (organizations) | 🟡 Superseded by auth_settings (00022) — candidate for removal |

---

## 4. FK ON DELETE BEHAVIOR SUMMARY

| Behavior | Count | Usage |
|----------|-------|-------|
| CASCADE | ~85 | Child meaningless without parent |
| SET NULL | ~20 | Optional relationships (assigned_to, approved_by, etc.) |
| NO ACTION (implicit) | ~15 | 🟡 Should be explicit RESTRICT or documented |

### Missing ON DELETE Specifications (defaulting to NO ACTION)
- `proposals.created_by → users(id)` — 🔴 No ON DELETE specified
- `activity_log.actor_id → users(id)` — 🔴 No ON DELETE specified  
- `proposal_comments.author_id → users(id)` — 🔴 No ON DELETE specified
- `file_attachments.uploaded_by → users(id)` — 🔴 No ON DELETE specified
- `organization_memberships.role_id → roles(id)` — 🔴 No ON DELETE specified
- `team_memberships.role_id → roles(id)` — 🔴 No ON DELETE specified
- `project_memberships.role_id → roles(id)` — 🔴 No ON DELETE specified
