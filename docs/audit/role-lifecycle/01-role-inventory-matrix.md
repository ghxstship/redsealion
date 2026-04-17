# Phase 1 — Role Inventory Matrix

Canonical record for every project-scoped role. `role_id` uses deterministic UUIDs under `00000000-0000-0000-0000-000000000301..312` (reserved block; not yet populated in `SYSTEM_ROLE_IDS`). `role_slug` aligns with the `project_role` enum values per `supabase/migrations/00148_project_role_remediation.sql`.

**Tier codes:** `GOV` = Governance | `FUL` = Fulfillment | `SUP` = Supply | `KEY` = Key Figure | `CON` = Consumer

---

## Matrix

| role_id | role_slug | role_name | role_class | tier | entity_type | rbac_scope (bundle) | parent_role | classification_codes | compvss_mapping | atlvs_mapping | gvteway_mapping |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `…301` | `executive` | Executive | executive | GOV | WHO (person) | `project.admin`, `budget.approve`, `settlement.sign`, `closeout.lock` | — | NAICS 5511 (Mgmt of Companies) | Visibility, reporting | Approvals, budget, closeout | read-only dashboards |
| `…302` | `production` | Production | production | GOV | WHO (person) | `project.manage`, `event.manage`, `activation.manage`, `advance.approve`, `task.write` | `executive` | NAICS 7120 (Perf Arts Support) | Crew mgmt, call sheets, advance build | Operations, tasks, advancing | event creation, zone setup |
| `…303` | `management` | Management | management | GOV | WHO (person) | `logistics.manage`, `vendor.manage`, `shift.assign`, `purchase_order.write` | `production` | NAICS 5612 (Facilities Support) | Shift mgmt, load-in/out | Venue, logistics, procurement | — |
| `…304` | `crew` | Crew | crew | FUL | WHO (person) | `shift.read`, `task.update`, `timesheet.submit`, `incident.log` | `management` | NAICS 7115 (Indep Artists) · UNSPSC 82141500 (Event Crew) | Timesheets, shifts, incidents | Task assignment | — |
| `…305` | `staff` | Staff | staff | FUL | WHO (person) | `task.read`, `checkin.write`, `incident.log` | `management` | NAICS 5612 (Facilities) · UNSPSC 93151600 (Event Staff) | Shifts, check-in | — | event operations |
| `…306` | `talent` | Talent | talent | KEY | WHO (person) | `rider.read`, `advance.update`, `hospitality.request`, `performance.confirm` | `production` | NAICS 7115 (Indep Artists) · NAICS 7111 (Perf Arts Companies) | Advancing, hospitality, green room | — | VIP access, concierge |
| `…307` | `vendor` | Vendor | vendor | SUP | WHO (org) | `advance.update`, `invoice.write`, `bol.write`, `asset.manage`, `po.receive` | `production` | NIGP 285-00 (Event Services) · UNSPSC 93141700 (Vendor Services) | Fulfillment, deliverables, BOL | Assets, shipments, POs | — |
| `…308` | `client` | Client | client | KEY | WHO (org) | `project.read`, `deliverable.approve`, `invoice.approve`, `settlement.review` | — | NAICS 5418 (Advertising) | — | Approval portal, deliverable review | — |
| `…309` | `sponsor` | Sponsor | sponsor | KEY | WHO (org) | `activation.read`, `asset.read`, `brand_guideline.write`, `proof.review` | `client` | NAICS 5418 (Advertising) · NAICS 5191 (Other Info Svcs) | — | Activations, brand assets | brand visibility, proof gallery |
| `…310` | `press` | Press | press | CON | WHO (person) | `credential.hold`, `media.access`, `zone.access`, `asset.read` | `client` | NAICS 5111 (Publishing) · NAICS 5151 (Broadcasting) | Credentialing | — | Media portal, pool access |
| `…311` | `guest` | Guest | guest | CON | WHO (person) | `credential.hold`, `zone.access`, `inventory.read` | `talent` | — | Ticketing, check-in | — | concierge, VIP access |
| `…312` | `attendee` | Attendee | attendee | CON | WHO (person) | `credential.hold`, `zone.access.general` | — | — | Crowd control | — | general admission, scan |

---

## Field specifications

### `role_id` (UUID)

Reserved block `00000000-0000-0000-0000-00000000030N` where `N = 1..12` matches slug order above. Must be registered in `src/types/rbac.ts::SYSTEM_ROLE_IDS` to replace the 4 stale legacy entries. Closure ticket: `C-RBAC-01`.

### `role_slug` (enum value)

Canonical value of `project_role` enum (migration `00148`). Must be the only accepted string in all code paths; drop all string-literal comparisons against legacy slugs (`creator`, `collaborator`, `viewer` when used as a project role).

### `role_class`

Same as `role_slug`; kept as distinct field to allow future sub-classification (e.g., `crew.stagehand` vs `crew.lighting`) without breaking enum.

### `tier`

Five-tier classification — governance, fulfillment, supply, key, consumer — used for RLS grouping, UI tree organization, and permission-bundle inheritance. `GOV > FUL > SUP` per production hierarchy; `KEY` and `CON` are orthogonal surfaces (client/sponsor vs. press/guest/attendee).

### `entity_type`

`WHO (person)` — human identity, backed by `auth.users` + `profiles` with join to `project_users`.
`WHO (org)` — corporate entity, backed by `organizations` or a typed child table (`vendors`, `clients`, `sponsors`).
WHAT/WHERE are not roles but entity classes touched by roles.

### `rbac_scope` (permission bundle)

Reference to a permission-bundle slug that must be defined in the new `DEFAULT_PROJECT_PERMISSIONS` matrix (to be added to `src/lib/permissions.ts`). Each bundle is a set of `{resource, action}` tuples inheriting from `parent_role`.

Inheritance chain (required closure ticket `C-RBAC-02`):
- `executive → *`
- `production → executive` (minus `closeout.lock`)
- `management → production` (minus `advance.approve`, `settlement.sign`)
- `crew → management` (minus `*.manage`, `*.approve`)
- `staff → crew` (minus `task.update`, `incident.log`)
- `talent → {hospitality, advance.update, performance.confirm}`
- `vendor → {advance.update, invoice.write, bol.write}`
- `client → {read + approve}`
- `sponsor → client` (minus `settlement.review`)
- `press → client.read` (plus `zone.access`, `media.access`)
- `guest → talent.public_subset`
- `attendee → guest.general`

### `classification_codes`

External taxonomy crosswalk for interop (government RFPs, vendor portals, tax/1099 reporting). UAC/TPC use proprietary codes only — closure ticket `C-DATA-04` introduces a `classification_crosswalks` table mapping each role/catalog item to UNSPSC / NIGP / NAICS. Populated where applicable above; empty cells indicate no mapping (internal role).

### COMPVSS / ATLVS / GVTEWAY mapping

Primary module surfaces per role, used to drive: (a) module visibility in nav; (b) E2E test assignment; (c) onboarding route selection. See `02-lifecycle-maps.md` for stage-by-stage module binding.

---

## Drift vs. current code

| Symbol | Current | Required | Action |
|---|---|---|---|
| `src/types/rbac.ts::SYSTEM_ROLE_IDS` | 4 legacy project UUIDs (`…201, …203, …204, …205`) | 12 canonical UUIDs (`…301..312`) | C-RBAC-01 |
| `src/lib/permissions.ts::DEFAULT_PERMISSIONS` | `Record<PlatformRole, …>` | add `DEFAULT_PROJECT_PERMISSIONS: Record<ProjectRole, …>` | C-RBAC-02 |
| `src/lib/permissions.ts::ProjectRole` | type exported but unused | referenced by every guard and RLS helper | C-RBAC-02, C-RBAC-03 |
| `src/lib/api/permission-guard.ts` | action-vocab mismatch (`view` vs `read`) | unify on RPC vocabulary `create/read/update/delete/approve/…` | C-RBAC-04 |
| `auth_settings` table | `require_mfa` present | add `require_mfa_for_project_roles[]` for privileged bundle | C-RBAC-05 |
