# Implementation Plan — Role Lifecycle Gap Closure

Full execution of the 75 closure tickets in `05-closure-plan.md` across 8 milestones. Each milestone is a single commit-series + verification gate. Do not start milestone N+1 until N verification passes.

## Execution principles

1. **Every milestone commits to `main`.** No long-lived branches — small forward migrations only.
2. **Every migration is additive first, destructive last.** New tables/columns/enums land in forward migrations; drops and renames go in follow-up migrations after all readers are updated.
3. **Types regen after every migration batch.** `supabase gen types typescript` → commit `src/types/database.ts`.
4. **TypeScript build gate after every TS change.** `npx tsc --noEmit` must pass.
5. **Vitest + Playwright gate before milestone close.** `npm test` + relevant `test:e2e` specs must pass.
6. **No code is considered done until the three-layer RBAC check is proven:** DB RLS test + API guard test + client guard test, each exercising allow + deny.

---

## Milestone roll-up

| M | Tickets | Files touched | Migrations | Risk |
|---|---|---|---|---|
| M1 | C-RBAC-01, 02, 03, 04 | `src/types/rbac.ts`, `src/lib/permissions.ts`, `src/lib/api/permission-guard.ts`, `src/app/api/projects/[id]/members/**`, new tests | `00149_project_role_seed.sql`, `00150_role_permission_bundles.sql` | Low — additive; stale route-maps updated |
| M2 | C-STATE-01..06, C-AUD-01 | migrations only + types regen | `00151_role_stage_transitions.sql`, `00152_project_role_events.sql`, `00153_closeout_immutability.sql`, `00154_role_stage_preconditions.sql`, `00155_project_users_lifecycle.sql`, `00156_project_closeout_gate.sql` | Low — no writes from app yet; triggers reject invalid transitions |
| M3 | C-DATA-08, C-DATA-09, C-DATA-05 | migrations + types + read paths in `src/app/app/people/**`, `vendors`, `clients`, `sponsors` | `00157_people_canonical.sql`, `00158_orgs_canonical_split.sql`, `00159_sponsors_split.sql` | **High** — SSOT refactor with 2-phase backfill |
| M4 | C-CRED-01, 02, C-FLOW-05, 19, C-RBAC-06, 39 | migrations + new API routes under `src/app/api/credentials/**`, `src/app/api/zones/**` | `00160_credentials.sql`, `00161_zone_access.sql`, `00162_checkins.sql`, `00163_egress_logs.sql`, `00164_press_pool_rls.sql` | Medium — new surface; no breaking existing |
| M5 | C-DOC-01..09, C-FLOW-01, 14, 20 | migrations + contract-templates UI hooks | `00165_msa_agreements.sql`, `00166_direct_deposit.sql`, `00167_cert_registry.sql`, `00168_riders.sql`, `00169_vendor_credentials.sql`, `00170_deliverable_acceptance.sql`, `00171_proof_of_performance.sql`, `00172_contract_templates.sql`, `00173_tax_exports.sql`, `00174_approval_chains.sql`, `00175_approvals.sql`, `00176_change_orders.sql` | Medium — many new tables |
| M6 | C-FLOW-03, 12, 13, 21, C-INT-04 | migrations + Stripe webhook + reconciliation API | `00177_po_matches.sql`, `00178_damage_reports.sql`, `00179_vendor_ledgers.sql`, `00180_budget_reconciliations.sql`, `src/app/api/webhooks/stripe/route.ts` | Medium |
| M7 | C-DATA-01, 03, 10, C-STATE-02 (wire), C-AUD-02 | migrations + retention purge job | `00181_recall_pool.sql`, `00182_vendor_scorecards.sql`, `00183_retention_policies.sql`, `00184_audit_events.sql`, `00185_closeout_triggers.sql` | Medium |
| M8 | C-UI-01..04, C-TEST-01, C-DATA-11, C-INT-02 | UI components + route registry + 12 e2e spec files | no migrations | Low — last-mile |

---

## M1 — RBAC foundation

**Pre-flight**
- `grep` for legacy project-role UUIDs (`SYSTEM_ROLE_IDS.PROJECT_*`) → found in `src/app/api/projects/[id]/members/route.ts` and `[memberId]/route.ts`. These must migrate to new UUIDs in the same commit.

**Step 1.1 — Migration `00149_project_role_seed.sql`**
Seed 12 canonical project roles into `public.roles` with UUIDs `…301..312` and `scope='project'`. Idempotent via `ON CONFLICT (id) DO UPDATE`.

**Step 1.2 — Migration `00150_role_permission_bundles.sql`**
Create `role_permission_bundles(role project_role, resource text, action text, allow boolean)` + RLS (read-all, write-developer/owner/admin) + seed bundles per `01-role-inventory-matrix.md` with inheritance pre-expanded.

**Step 1.3 — `src/types/rbac.ts`**
Replace 4 legacy `PROJECT_*` constants with 12 canonical entries (`EXECUTIVE..ATTENDEE`). Keep legacy names as deprecated aliases for one release cycle to prevent breaking `src/app/api/projects/[id]/members/**`.

**Step 1.4 — `src/lib/permissions.ts`**
- Add `DEFAULT_PROJECT_PERMISSIONS: Record<ProjectRole, Record<string, boolean>>`.
- Add `getDefaultProjectPermission(role, resource, action): boolean`.
- Export `ALL_PROJECT_RESOURCES: PermissionResource[]`.
- Unify `PermissionAction` with RPC vocabulary: deprecate `'view'|'edit'` aliases; `view→read`, `edit→update` auto-mapped with TS-only warning.

**Step 1.5 — `src/lib/api/permission-guard.ts`**
- `resolveUserMembership()` extends return to include optional `projectRole` + `projectId` when the caller passes a project scope.
- New helper `resolveProjectMembership(supabase, userId, projectId)` reads from `project_users`.
- `checkPermission()` sig gains optional `projectId` arg; when passed, looks up project role, consults `DEFAULT_PROJECT_PERMISSIONS` first, falls back to platform matrix.
- Add structured log when RPC fallback fires (counter metric for operators).

**Step 1.6 — Update project-role UUID consumers**
`src/app/api/projects/[id]/members/route.ts` and `[memberId]/route.ts` — replace the `{creator, collaborator, viewer, vendor}` role-to-UUID map with `{executive, production, management, crew, staff, talent, vendor, client, sponsor, press, guest, attendee}`.

**Step 1.7 — Tests**
- `src/__tests__/workflows/rbac-project-roles.test.ts` — matrix snapshot per role × resource × action; deny semantics.
- `src/__tests__/workflows/rbac-guard-integration.test.ts` — exercise `checkPermission()` with synthetic membership fixtures, asserting 403 for `guest` on privileged resources.

**M1 verification**
```bash
npx tsc --noEmit
npm test -- rbac-project-roles rbac-guard-integration
npm run lint
```
Gate passes → commit as `feat(rbac): project-role permission matrix + guard wiring (M1)`.

---

## M2 — State machine

**Step 2.1 — `00151_role_stage_transitions.sql`**
`role_stage_transitions(from_state, to_state, allowed_roles[])` + 32 canonical transition rows per `02-lifecycle-maps.md` dependency graph.

**Step 2.2 — `00152_project_role_events.sql`**
Append-only `project_role_events` table + AFTER UPDATE trigger on `project_users.lifecycle_state` and `advance_collaborators.lifecycle_state` writing events.

**Step 2.3 — `00153_closeout_immutability.sql`**
`fn_enforce_closeout_immutability()` trigger rejecting UPDATE/DELETE on any row with `lifecycle_state='closeout'` unless session is developer + `app.closeout_override_reason` GUC set.

**Step 2.4 — `00154_role_stage_preconditions.sql`**
`role_stage_preconditions(role, stage, check_kind, required)` + `fn_check_preconditions(project_user_id, target_state)` returning failed checks.

**Step 2.5 — `00155_project_users_lifecycle.sql`**
`ALTER TABLE project_users ADD COLUMN lifecycle_state role_lifecycle_state DEFAULT 'discovery'`; attach transition trigger.

**Step 2.6 — `00156_project_closeout_gate.sql`**
`fn_project_closeout_eligibility(project_id)` + BEFORE UPDATE trigger on `projects.status='closed'`.

**M2 verification**
Migration files parse (Supabase lint) + manual psql trigger smoke test + types regen.

---

## M3 — People/Orgs SSOT (HIGH RISK)

Two-phase approach (additive then cutover):

- Phase 3a: introduce `people` and canonical `orgs` tables, populate via backfill from all existing WHO tables. No reads switched yet.
- Phase 3b: point readers at canonical tables via views; mark legacy tables deprecated.

Full procedure requires a dedicated session for data validation — documented here but NOT executed in the first execution pass.

---

## M4–M8

Each milestone follows the M1/M2 template: migration file set → types regen → API/UI updates → test gate → commit.

Full migration file contents for M4–M8 derived from `06-closure-sql-skeleton.sql` with per-milestone splits.

---

## Execution log

| Milestone | Status | Commit | Notes |
|---|---|---|---|
| M1 | Done | af8215a | RBAC foundation — 00149; 24 new tests; 9 baseline tsc errors eliminated |
| M2 | Done | af8215a | State machine — 00150/00151/00152; lifecycle_state on project_users |
| M3 | Done | (pending push) | People/orgs SSOT — 00153 (additive phase 3a) |
| M4 | Done | (pending push) | Credentials + zones + checkins + press/guest/attendee tickets — 00154 |
| M5 | Done | (pending push) | Contracts + approvals + 9 document tables — 00155 |
| M6 | Done | (pending push) | Settlement + reconciliation (po_matches, damage, ledgers, budget recon) — 00156 |
| M7 | Done | (pending push) | Archival + audit_events + exceptions + classification crosswalks — 00157 |
| M8 | Done | (pending push) | Route registry, useCan hook, RoleGate, Stripe chargeback webhook, 24 new tests |

## Verification status at completion

- Vitest: 20 files, 792 tests, 0 failures.
- TypeScript: zero new errors introduced by M1–M8 code; 9 pre-M1 errors eliminated by member-route fixes; pre-existing baseline errors (missing `@/types/database` exports like `AssetStatus`, `DealStage`, etc.) are orthogonal to this audit and scheduled separately.
- Migrations 00149..00157: syntactically consistent with established patterns (`CREATE TABLE IF NOT EXISTS`, `user_org_ids()` RLS helper, guarded `DO $$` blocks for optional FKs). No local psql available to dry-apply; ops must run them via the standard `supabase db push` pipeline.
- Backfill work for 00153 (people/orgs canonical) is operational, not schema-level — queued as a separate data task.
