# Red Sea Lion — Role Lifecycle Audit & Gap Closure Plan

Audit date: 2026-04-16
Scope: 12 project-scoped roles × 13 canonical lifecycle stages
Method: repo + schema + RBAC + module cross-reference against APS and UAC/TPC catalogs
Baseline: main @ commit `e59fa96` · 146 migrations · `project_role` enum upgraded to canonical 12 values in `supabase/migrations/00148_project_role_remediation.sql`

## Artifacts

| File | Contents |
|---|---|
| [00-baseline.md](./00-baseline.md) | Phase 0 discovery — current state of role model, RBAC layers, APS, UAC/TPC, module coverage, existing artifacts |
| [01-role-inventory-matrix.md](./01-role-inventory-matrix.md) | Canonical record for all 12 project-scoped roles with 10+ fields each |
| [02-lifecycle-maps.md](./02-lifecycle-maps.md) | Per-role × 13-stage maps — SoR, inputs, state, actors, outputs, triggers, notifications, audit |
| [03-forks-options-dependencies.md](./03-forks-options-dependencies.md) | 10 forks + 10 options + 25 dependencies + 10 exceptions |
| [04-gap-register.csv](./04-gap-register.csv) | 75-row tabular gap register with severity/effort/dependency |
| [04-gap-register.md](./04-gap-register.md) | Narrative grouping, severity totals, critical-path ordering |
| [05-closure-plan.md](./05-closure-plan.md) | One ticket per gap, grouped by epic, 8-milestone sequencing |
| [06-closure-sql-skeleton.sql](./06-closure-sql-skeleton.sql) | Reference migration skeleton (not applied — split before merging) |

## Top-level findings

- **P0 drift:** `project_role` enum is on the 12-value canon (`00148`), but `src/types/rbac.ts::SYSTEM_ROLE_IDS` and `src/lib/permissions.ts::DEFAULT_PERMISSIONS` still live in the old 4-role world. All project-role authorization at the app layer silently denies.
- **P0 state machine:** `role_lifecycle_state` enum exists but transitions are free. No immutability on `closeout`. No audit log.
- **P0 consumer surface:** `credentials`, `zone_access_grants`, `zone_access_events`, `press_credentials`, `guest_tickets`, `attendee_tickets` do not exist. GVTEWAY cannot be operated end-to-end.
- **P1 canonical SSOT:** WHO fragmented across 10+ tables (no `people` canonical). Orgs fragmented across `organizations`/`vendors`/`clients`/`sponsors` without a clean subtype split.
- **P1 classification:** UAC uses proprietary codes only; no UNSPSC/NIGP/NAICS crosswalk.
- **75 gaps** catalogued with closure tickets across 11 epics.
- **8 milestones** sequence the closure work from RBAC foundation → state machine → SSOT → credentialing → contracting → settlement → archival → UX/tests.

## Next actions

1. Review `05-closure-plan.md` with Engineering + Product leads.
2. Ratify ticket numbers; open Linear/ClickUp issues under the 11 epics.
3. Begin M1 (C-RBAC-01..04) — no DB data risk, unblocks every downstream ticket.
4. Parallel M2 (state machine) and M3 (people/orgs SSOT) — these are independent of M1 and can proceed.
5. Regenerate `scripts/generate-rbac.ts` output and replace the stale `role_matrix.md`, `lifecycle_maps.md`, `gap_register.csv` at the repo root with these artifacts.
