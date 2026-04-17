# Phase 4 — Gap Register (Narrative)

Full tabular register is in `04-gap-register.csv` (75 gaps). This file groups them for prioritization.

## Severity totals

| Severity | Count | Definition |
|---|---|---|
| P0 (blocker) | 11 | Role cannot be operated at all until fixed |
| P1 (critical) | 36 | 3NF / SSOT / RBAC violation |
| P2 (major) | 25 | Missing fork/option/dependency handling |
| P3 (polish) | 3 | UX, reporting, analytics |

## P0 blockers (fix first)

| ID | Role/Entity | Essence |
|---|---|---|
| GAP-001 | project_role | `SYSTEM_ROLE_IDS` in TS still references 4 legacy UUIDs after 00148 enum change |
| GAP-002 | project_role | No `DEFAULT_PROJECT_PERMISSIONS` matrix — all project-role permission checks silently deny |
| GAP-003 | project_role | `requirePermission()` never consults project role, only platform role |
| GAP-005 | project_role | `role_lifecycle_state` enum has no transition-validity table / trigger |
| GAP-010 | executive | No project-level closeout gate |
| GAP-012 | production | No `credentials` table |
| GAP-013 | production | No `zone_access_grants` or `zone_access_events` |
| GAP-028 | vendor | No typed `vendor_credentials` (COI/W9/W8/MSA) |
| GAP-038 | press | No `press_applications` or `press_credentials` |
| GAP-040 | guest | No `guest_invitations` or `guest_tickets` |
| GAP-046 | All | Most table RLS is org-scoped only; project-scoped enforcement in app code alone |

## P1 critical (3NF/SSOT/RBAC)

36 gaps — covers missing canonical tables (`approvals`, `approval_chains`, `change_orders`, `incidents`, `checkins`, `damage_reports`, `budget_reconciliations`, `tax_exports`, `msa_agreements`, `riders`, `rider_line_items`, `deliverable_acceptance`, `sponsors` typing, `people` canonical, `orgs` canonical, `project_role_events`, `role_stage_preconditions`, `role_lifecycle_exceptions`, `contract_templates`, `contract_instances`) plus RBAC unification (GAP-004, GAP-039, GAP-071, role-aware UI/client guards GAP-043/044/045).

## P2 major (forks/options/deps)

25 gaps — covers fork/option columns (employment_class, jurisdiction, union_local, signatory_type, billing_terms, lodging_mode, transport_mode, pay_cadence, meal_mode, delivery_method, data_rights), per-role archival tables (`recall_pool`, `vendor_scorecards`, `retention_policies`), and per-role operational tables (`call_sheets`, `egress_logs`, `green_room_assignments`, `pool_slots`, `activation_metrics`).

## P3 polish

- GAP-057 — seed coverage (currently 24 entities)
- GAP-058 — per-role landing routes
- GAP-059 — e-sign adapter abstraction

## Gap distribution by category

| Category | Count | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| Schema | 30 | 6 | 17 | 7 | 0 |
| RBAC | 7 | 3 | 4 | 0 | 0 |
| Workflow | 15 | 1 | 8 | 6 | 0 |
| Document | 9 | 1 | 5 | 3 | 0 |
| Data | 9 | 0 | 4 | 4 | 1 |
| UI | 4 | 0 | 2 | 1 | 1 |
| Integration | 4 | 0 | 2 | 1 | 1 |
| Audit | 3 | 0 | 2 | 1 | 0 |
| RLS | 2 | 1 | 1 | 0 | 0 |

## Gap distribution by role

| Role | Gap count | P0 |
|---|---|---|
| project_role (all) | 6 | 4 |
| All (cross-cutting) | 18 | 1 |
| executive | 3 | 1 |
| production | 3 | 2 |
| management | 2 | 0 |
| crew | 7 | 0 |
| staff | 2 | 0 |
| talent | 5 | 0 |
| vendor | 7 | 1 |
| client | 2 | 0 |
| sponsor | 3 | 0 |
| press | 3 | 1 |
| guest | 1 | 1 |
| attendee | 2 | 0 |

## Critical path ordering

1. **GAP-001 → GAP-002 → GAP-003** (RBAC foundation): register UUIDs, build matrix, wire guards. Without these, no further RBAC work is meaningful.
2. **GAP-005 → GAP-008 → GAP-050 → GAP-006** (state machine): transitions table, events log, preconditions, immutability trigger.
3. **GAP-048 → GAP-049** (WHO canonical): `people` and `orgs` SSOT tables before WHAT/WHERE cross-FKs.
4. **GAP-012 → GAP-013 → GAP-018 → GAP-039 → GAP-042 → GAP-064** (credential + zone chain): the consumer-facing Deployment/Active-Ops/Demob stages all block on this.
5. **GAP-028 → GAP-015 → GAP-030 → GAP-031 → GAP-032** (vendor chain): qualification → settlement → reconciliation → archival.
6. **GAP-038 → GAP-040 → GAP-041** (consumer chain): press, guest, attendee — these are where GVTEWAY becomes real.
7. **GAP-010 → GAP-055** (closeout): only fire after all above complete.
