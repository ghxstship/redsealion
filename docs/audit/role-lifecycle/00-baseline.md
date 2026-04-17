# Phase 0 — Discovery & Baseline

**Repo:** `github.com/ghxstship/redsealion` (branch `main`, clean)
**Migrations under version control:** 146 (`00001_initial_schema.sql` through `00148_project_role_remediation.sql`)
**Framework:** Next.js 16.2.2, React 19.2.4, Supabase SSR 0.10, Zod 4
**Product surfaces:** ATLVS (ops/PM), COMPVSS (crew/production), GVTEWAY (consumer)

---

## 0.1 — Role model separation

Two-tier architecture is present in the DB but only partially reflected in TypeScript.

| Layer | DB state | TS state | Drift |
|---|---|---|---|
| Platform roles (org-scoped) | `org_role_v2` enum, 10 values (migration `00135_role_optimization.sql`) | `PlatformRole` in `src/lib/permissions.ts` | None |
| Project roles (project-scoped) | `project_role` enum, **12 canonical values** after `00148_project_role_remediation.sql` | `ProjectRole` type exists in `src/lib/permissions.ts:24`; `SYSTEM_ROLE_IDS` in `src/types/rbac.ts:44-61` still enumerates only 4 legacy project roles | **P0 drift** — UUID registry stale |
| Permission matrix | RPC-backed, silent fallback | `DEFAULT_PERMISSIONS` only covers 10 platform roles (`src/lib/permissions.ts:138`); no project-role matrix | **P0 gap** — project roles are unauthorized by default at the application layer |

The `project_role` enum was upgraded from a 4-value legacy set (`creator, collaborator, viewer, vendor`) to the 12-value canonical set in migration `00148`. However:

1. `role_lifecycle_state` enum exists but transition validity is not enforced via trigger or transition table.
2. `lifecycle_state` column was added only to `advance_collaborators` and `project_collaborators`. No equivalent on `project_users`, `org_users`, or any WHAT/WHERE owning table.
3. `project_users` (the canonical project membership table) references `project_role` via `role` column — RLS still filters on legacy role comparisons in migrations `00031_bedrock_rls_standard.sql` and `00038_users_rls_remediation.sql` (needs post-00148 audit).

---

## 0.2 — APS + UAC/TPC state

**APS (migration `00136_atomic_production_system.sql`)** implements a 6-level hierarchy:
PROJECT (L1) → EVENT (L2) → ZONE (L3) → ACTIVATION (L4) → COMPONENT (L5) → ITEM (L6) (`component_items`).
Rollup function `hierarchy_budget_rollup()` computes budgeted totals with overhead/markup stacking. `hierarchy_status_log` provides an append-only audit trail for status transitions. Enum `hierarchy_status` lifecycle: `draft → advancing → confirmed → locked → complete → archived`.

**UAC (Universal Advance Catalog)** — 10 collection groups wired via migration `00137_catalog_10_collections.sql`. Collections 3 (Scenic Fabrication) and 10 (Permits/Legal/Compliance) are present with full `cat_code`/`sub_code` taxonomy. Intelligence layer added in `00145_advance_catalog_items_intelligence.sql` and RLS in `00146_advance_intelligence_rls.sql`.

**Classification codes (UNSPSC / NIGP / NAICS)** — absent. UAC uses proprietary `cat_code`/`sub_code` only. No crosswalk table to external standards.

**TPC (Template/Production Catalog)** — no canonical table named `tpc_*`. Templates are scattered in `/src/lib/documents/` (FlyteDeck). No seed data alignment audit between 397-item TPC spec and live tables.

---

## 0.3 — RBAC three-layer defense state

| Layer | Implementation | State | File |
|---|---|---|---|
| DB RLS | Org-scoped for most tables; project-scoped RLS thin | **Partial** | `00031_bedrock_rls_standard.sql`, `00125_rls_soft_delete_filter.sql` |
| API middleware | `checkPermission` + `requirePermission` | **Platform-only** | `src/lib/api/permission-guard.ts:73-179` |
| HTTP middleware | Session + status + tier, no role | **No role enforcement** | `src/middleware.ts`, `src/lib/supabase/middleware.ts:1-226` |
| Client guard | No canonical `<RoleGate>` or `useCan()` found | **Missing pattern** | — |

Action-vocabulary drift confirmed: application layer uses `view/create/edit/delete`; RPC layer uses `create/read/update/delete/manage/invite/approve/export/configure/bulk_invite/impersonate`. Manual mapping at `src/lib/api/permission-guard.ts:117-121` only covers the first four; extended actions are unreachable from application code.

---

## 0.4 — Module coverage by lifecycle stage

From E2E route registry (184 routes) and `src/app/app/`:

| Stage | Coverage | Key module(s) |
|---|---|---|
| Discovery | Complete | Leads, Campaigns, Pipeline |
| Qualification | Complete | Pipeline, Proposals, Compliance/CoIs |
| Onboarding | Partial | Compliance, People; no role-scoped onboarding pipeline |
| Contracting | Complete | Contracts, Terms (but Terms are hardcoded per gap-audit-2026-04) |
| Scheduling | Complete | Schedule, Calendar, Dispatch |
| Advancing | Partial | Advancing, Logistics (no approval state machine) |
| Deployment | Partial | Manifest, Equipment, Assets (no credential issuance module) |
| Active Operations | Partial | Tasks, Schedule, Crew, Events |
| Demobilization | Partial | Work Orders, Logistics (no dedicated module) |
| Settlement | Complete | Invoices, Expenses, Time |
| Reconciliation | Partial | Finance/Reports, Profitability (no PO/advance match automation) |
| Archival | Minimal | Files (no retention policy; no recall pool) |
| Closeout | Minimal | no formal closeout workflow or immutability enforcement |

---

## 0.5 — WHO/WHAT/WHERE canonical tables

| Class | Canonical tables | Notes |
|---|---|---|
| WHO (person) | `auth.users`, `profiles`, `org_users`, `project_users`, `project_collaborators`, `advance_collaborators`, `crew_members`, `talent_records`, `press_credentials`, `guests`, `attendees` (several TBD) | Fragmented — no single `people` canonical |
| WHO (org) | `organizations`, `clients`, `vendors`, `sponsors`, `agencies` | Most tables exist; vendor/sponsor convergence work exists in `00106_procurement_remediation.sql` |
| WHAT | `advance_catalog_items`, `component_items`, `advance_line_items`, `assets`, `equipment`, `inventory_items` | Owns/fulfills distinction handled by `fulfillment_method` enum |
| WHERE | `spaces` (19 types), `zones` (15 types), `locations`, `venues`, `dock_slots` | APS zone/space pair is canonical post-00136 |

---

## 0.6 — Existing audit artifacts (delta targets)

| Path | Lines | Status |
|---|---|---|
| `docs/role_matrix.md` | 16 | **Incomplete** — 12 roles listed but columns thin |
| `docs/lifecycle_maps.md` | 88 | **Grouped** — 5 role clusters, not 12 individual roles |
| `docs/gap_register.csv` | 7 rows | **Severely incomplete** |
| `docs/gap-audit-2026-04.md` | 1013 | **Orthogonal** — module-by-module gap audit, not role-lifecycle |
| `docs/TRANSITION_REGISTRY.md` | 152 | **Orthogonal** — UI motion registry, not state transitions |
| `docs/ARCHITECTURE.md` | 328 | Reference only |

This audit replaces `role_matrix.md`, `lifecycle_maps.md`, and `gap_register.csv` with the expanded artifacts in this directory.

---

## 0.7 — Immediately-visible critical findings

1. **P0** — `DEFAULT_PERMISSIONS` does not cover the 12 project roles (`src/lib/permissions.ts:138-290`). Every project-role permission check at the app layer silently falls back to deny.
2. **P0** — `SYSTEM_ROLE_IDS` in `src/types/rbac.ts:56-60` still enumerates only 4 legacy project role UUIDs. Post-00148 UUIDs for 12 canonical roles are not registered.
3. **P0** — No allowed-transitions table for `role_lifecycle_state`. Any trigger can be called to set any state; immutability after `closeout` is not enforced.
4. **P1** — No HTTP-boundary role enforcement in `src/middleware.ts`. Project-scoped checks happen per-route, with gaps.
5. **P1** — No canonical `people` table. WHO entities are fragmented across 10+ tables without a single ID surface.
6. **P1** — Classification codes (UNSPSC/NIGP/NAICS) absent; UAC uses proprietary codes only.
7. **P2** — No state transition triggers on `hierarchy_status` or `role_lifecycle_state` columns; transitions are free-text updates.
8. **P2** — No documented `press_credential`, `guest_ticket`, `attendee_scan` tables (GVTEWAY consumer surface underbuilt).
9. **P2** — No `recall_pool`, `performance_rating`, or `vendor_scorecard` tables for Archival stage.
10. **P2** — No central route registry file; 184 routes are asserted but no SSOT file found under `src/config/` or `src/lib/`.
