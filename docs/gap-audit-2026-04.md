# Operational & Functional Gap Audit
**Scope:** All `src/app/app/` folders  
**Order:** Reverse alphabetical  
**Date:** April 2026  
**Method:** Cross-referenced UI components, API calls, DB schema (all 114 migrations), and seed data  

---

## Table of Contents
1. [Critical](#critical-severity)
2. [High](#high-severity)
3. [Medium](#medium-severity)
4. [Low](#low-severity)

---

## Critical Severity

---

### GAP-C-01 — Work Orders: Missing lifecycle timestamps
- **Location:** `src/app/app/work-orders/[id]/page.tsx`, `src/app/app/dispatch/(hub)/page.tsx`, `work_orders` table
- **Gap type:** Missing data point
- **Impact:** No `started_at`, `completed_at`, or `cancelled_at` on work orders. Duration tracking, SLA reporting, and audit trails are impossible.
- **Recommended fix:**
  ```sql
  ALTER TABLE work_orders
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
  CREATE INDEX idx_work_orders_completed ON work_orders(organization_id, completed_at)
    WHERE completed_at IS NOT NULL;
  ```

---

### GAP-C-02 — Workloads: Hardcoded utilization metric
- **Location:** `src/app/app/workloads/(hub)/page.tsx` → `getResourceStats()`, `resource_allocations` table
- **Gap type:** Missing data point
- **Impact:** `avgUtilization` is hardcoded to `72` — not computed from real data. All resource planning decisions based on this value are fabricated. There is no `allocated_hours` or `available_hours` column on `resource_allocations`.
- **Recommended fix:** Add `allocated_hours DECIMAL`, `available_hours DECIMAL` to `resource_allocations`. Compute utilization via SQL: `ROUND(SUM(allocated_hours) / NULLIF(SUM(available_hours), 0) * 100, 1)`. Remove the hardcoded `72`.

---

### GAP-C-03 — Profitability: `project_costs` table missing
- **Location:** `src/app/app/profitability/[proposalId]/page.tsx`, `project_costs` table
- **Gap type:** Missing table
- **Impact:** The profitability page queries `project_costs` but no migration defines this table. All profitability views silently return zero costs, showing 100% margin on every project. Financial decisions based on this view are incorrect.
- **Recommended fix:**
  ```sql
  CREATE TABLE public.project_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    cost_type TEXT NOT NULL DEFAULT 'actual' CHECK (cost_type IN ('actual','budgeted','forecasted')),
    cost_date DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "project_costs_org" ON public.project_costs
    FOR ALL USING (organization_id IN (SELECT user_org_ids()));
  CREATE INDEX idx_project_costs_proposal ON project_costs(proposal_id);
  ```

---

### GAP-C-04 — Emails: Schema undefined for both email tables
- **Location:** `src/app/app/emails/page.tsx`, `email_threads` table, `email_messages` table
- **Gap type:** Missing table + missing workflow
- **Impact:** The page has a two-table fallback (`email_threads` → `email_messages`) with no guarantee either exists. `email_messages` references `deal_title` as a column — a denormalized value with no FK to `deals`. Email threading is completely undefined at the schema level. The entire inbox is non-functional.
- **Recommended fix:**
  ```sql
  CREATE TABLE public.email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject TEXT,
    from_name TEXT,
    from_email TEXT NOT NULL,
    to_email TEXT,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    message_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE public.email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    body_html TEXT,
    body_text TEXT,
    direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound','outbound')),
    status TEXT NOT NULL DEFAULT 'received',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
  Remove the `deal_title` column; resolve via join on `deals`.

---

### GAP-C-05 — Pipeline: Cross-org data leak in deal query
- **Location:** `src/app/app/pipeline/[id]/page.tsx` → `getDeal()`
- **Gap type:** Missing data point (missing org-scope filter)
- **Impact:** `getDeal()` fetches by `id` alone with no `organization_id` filter. A user with a valid deal UUID from another org can read that deal's full data. RLS may not close this gap.
- **Recommended fix:** Add `.eq('organization_id', ctx.organizationId)` to the `getDeal()` Supabase query. Audit and enforce org-scoped SELECT RLS policy on the `deals` table.

---

### GAP-C-06 — Terms: Content hardcoded, no persistence
- **Location:** `src/app/app/terms/page.tsx`, `/api/terms` route
- **Gap type:** Missing table + missing workflow
- **Impact:** Terms & conditions content is entirely hardcoded in a `sections` array. The "Create New Version" button calls `/api/terms` but there is no database table to store versioned terms. Any T&C update requires a code deploy. Version history is non-functional.
- **Recommended fix:**
  ```sql
  CREATE TABLE public.terms_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    content JSONB NOT NULL DEFAULT '[]',
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
  Implement `/api/terms` POST to insert a versioned record. Load latest published version on page load instead of the hardcoded array.

---

### GAP-C-07 — People: Subtitle template literal never evaluated
- **Location:** `src/app/app/people/(hub)/page.tsx` line 59
- **Gap type:** Missing data point / UI bug
- **Impact:** `subtitle` value is `"{members.length} team members · {roleCount} …"` using curly braces without `$`. JavaScript treats this as a plain string. Users always see the literal characters `{members.length}` as the subtitle. The stat is never shown.
- **Recommended fix:**
  ```tsx
  subtitle={`${members.length} team members · ${roleCount} ${roleCount === 1 ? 'role' : 'roles'}`}
  ```

---

### GAP-C-08 — Profitability: Page title renders as literal string
- **Location:** `src/app/app/profitability/[proposalId]/page.tsx` line 67
- **Gap type:** UI bug
- **Impact:** `title="{project.name}"` renders the string `{project.name}` verbatim. Every profitability detail page shows `{project.name}` as its heading rather than the actual project name.
- **Recommended fix:**
  ```tsx
  title={project.name}
  ```

---

### GAP-C-09 — Automations: No execution log table
- **Location:** `src/app/app/automations/(hub)/page.tsx`, `automations` table
- **Gap type:** Missing table + missing workflow
- **Impact:** `run_count` and `last_run_at` are displayed but there is no `automation_runs` table to track individual execution history, errors, or payloads. Debugging failed automations is impossible. There is no rollback trail.
- **Recommended fix:**
  ```sql
  CREATE TABLE public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','skipped')),
    trigger_payload JSONB,
    result_payload JSONB,
    error_message TEXT,
    ran_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_automation_runs_automation ON automation_runs(automation_id, ran_at DESC);
  ```

---

### GAP-C-10 — Compliance: No document upload workflow
- **Location:** `src/app/app/compliance/(hub)/page.tsx`, `compliance_documents` table
- **Gap type:** Missing workflow
- **Impact:** The compliance hub reads from `compliance_documents` and has an export link to `/api/compliance/export`, but there is no UI route or API route to upload/create compliance documents. The page instructs users to "Add documents from individual crew member profiles" — but no such form exists in the crew profile routes. The table will always be empty.
- **Recommended fix:** Add a `/app/compliance/new` route with a document upload form (crew member picker, document type, file upload, expiry date). Implement a corresponding `POST /api/compliance/documents` route that handles storage upload and DB insert.

---

## High Severity

---

### GAP-H-01 — Goals: Missing schema columns queried by UI
- **Location:** `src/app/app/goals/page.tsx`, `goals` table, `goal_key_results` table
- **Gap type:** Missing data point
- **Impact:** `getGoals()` references `g.start_date` and `g.category` on `goals`, and `kr.start_value` and `kr.deleted_at` on `goal_key_results`. Migration 00071 created `goals` and `goal_key_results` without `start_date`, `category`, `start_value`, or `deleted_at`. These columns will silently return `null` or cause query errors.
- **Recommended fix:**
  ```sql
  ALTER TABLE public.goals
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Company',
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE public.goal_key_results
    ADD COLUMN IF NOT EXISTS start_value NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ```

---

### GAP-H-02 — Favorites: Wrong table/field references
- **Location:** `src/app/app/favorites/page.tsx`, `ENTITY_CONFIGS`
- **Gap type:** Missing data point + missing table reference
- **Impact:** `ENTITY_CONFIGS` maps `equipment` to table `'equipment'` — but the actual table is `assets`. It maps `contacts` to table `'contacts'` — there is no `contacts` table (contacts exist as `clients` or sub-records). Both will silently return empty results and broken links. `favorites` table also queries `organization_id` but migration 00071 only scopes it by `user_id`.
- **Recommended fix:** Fix `ENTITY_CONFIGS`: `equipment → assets`, remove or fix `contacts` entry. Add `organization_id` to `favorites` table or remove the org filter from the query.

---

### GAP-H-03 — Favorites: `organization_id` column missing on `favorites`
- **Location:** `src/app/app/favorites/page.tsx` line 37, `favorites` table (migration 00071)
- **Gap type:** Missing data point
- **Impact:** `getFavoritedItems()` filters `.eq('organization_id', ctx.organizationId)` but migration 00071's `favorites` table has no `organization_id` column. This query will error at runtime.
- **Recommended fix:**
  ```sql
  ALTER TABLE public.favorites
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  CREATE INDEX idx_favorites_org ON favorites(organization_id, user_id);
  ```

---

### GAP-H-04 — My Schedule: `tasks.start_time` / `tasks.end_time` columns undefined
- **Location:** `src/app/app/my-schedule/page.tsx`, `tasks` table
- **Gap type:** Missing data point
- **Impact:** Query selects `start_time` and `end_time` from `tasks` — neither column exists in the schema. All task schedule items default to `09:00:00 UTC` as start time and have no end time, making My Schedule useless for time-blocked work.
- **Recommended fix:**
  ```sql
  ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS end_time TIME;
  ```

---

### GAP-H-05 — My Tasks: `tasks.created_by` FK references wrong table
- **Location:** `src/app/app/my-tasks/page.tsx` line 13
- **Gap type:** Missing data point
- **Impact:** Query joins `creator:users!created_by(first_name, last_name)` but the `users` table uses `full_name`, not `first_name`/`last_name` separately. The join will return `null` for all `createdBy` values. Referencing `first_name` and `last_name` on `users` will fail unless those columns exist.
- **Recommended fix:** Either add `first_name TEXT` and `last_name TEXT` to `users`, or change the select to `creator:users!created_by(full_name)` and split on space in the UI.

---

### GAP-H-06 — Rentals: `clients.name` vs `clients.company_name` mismatch
- **Location:** `src/app/app/rentals/(hub)/page.tsx` line 16
- **Gap type:** Missing data point
- **Impact:** Joins `clients(name)` but the `clients` table uses `company_name`. The join will silently return `null` for all client names on rental orders — every row shows `—`.
- **Recommended fix:** Change the select to `clients(company_name)` and update the mapping to `client_name: ... company_name`.

---

### GAP-H-07 — Equipment: `assets.reservation_count` column missing
- **Location:** `src/app/app/equipment/(hub)/page.tsx` line 43
- **Gap type:** Missing data point
- **Impact:** Maps `reservation_count: (item.reservation_count as number) ?? 0` — no such column exists on `assets`. This should be a computed count from `equipment_reservations`. Currently always shows `0`.
- **Recommended fix:** Remove the column reference; add a subquery or view: `SELECT COUNT(*) FROM equipment_reservations WHERE equipment_id = assets.id AND status = 'active'` as `reservation_count`, or add a materialized column via trigger.

---

### GAP-H-08 — Assets: `current_location` treated as object, stored as string
- **Location:** `src/app/app/assets/page.tsx` line 50
- **Gap type:** Missing data point
- **Impact:** Code casts `a.current_location` as `{ name?: string } | null` to extract `.name`, but logistics hub (`logistics/(hub)/page.tsx`) treats `current_location` as a plain `string`. The two modules are inconsistent — one will always show `null` location names.
- **Recommended fix:** Standardize `current_location` as a plain `TEXT` column (location label/name). Add a separate `facility_id UUID FK` column if structured facility reference is needed. Update both modules to use the same field type.

---

### GAP-H-09 — Finance: `revenue_recognition` table not confirmed in migrations
- **Location:** `src/app/app/finance/(hub)/page.tsx` → `getStats()`, `revenue_recognition` table
- **Gap type:** Missing table
- **Impact:** Finance hub queries `revenue_recognition` for `recognized_amount`. No migration in the codebase (reviewed 00001–00114) explicitly creates this table. If it is missing, recognized revenue always shows as `$0`.
- **Recommended fix:** Confirm or create:
  ```sql
  CREATE TABLE IF NOT EXISTS public.revenue_recognition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    recognized_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    recognition_date DATE NOT NULL,
    method TEXT NOT NULL DEFAULT 'percentage_completion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```

---

### GAP-H-10 — Portfolio: No FK linking portfolio items to proposals/projects
- **Location:** `src/app/app/portfolio/page.tsx`, `portfolio_library` table
- **Gap type:** Missing data point
- **Impact:** `portfolio_library` has `project_id` and `proposal_id` columns but there is no confirmed FK constraint on either. Orphaned portfolio items can reference deleted proposals/projects without integrity enforcement.
- **Recommended fix:** Confirm FKs exist: `proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL`, `project_id UUID REFERENCES projects(id) ON DELETE SET NULL`. Add if missing.

---

### GAP-H-11 — Portal: No `deleted_at` filter on `project_portals`
- **Location:** `src/app/app/portal/page.tsx` line 41
- **Gap type:** Missing data point
- **Impact:** Query uses `.is('deleted_at', null)` but no migration confirms `deleted_at` exists on `project_portals`. If the column is absent, the filter is silently ignored and deleted portals appear in the list.
- **Recommended fix:**
  ```sql
  ALTER TABLE public.project_portals
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  CREATE INDEX idx_project_portals_active ON project_portals(organization_id) WHERE deleted_at IS NULL;
  ```

---

### GAP-H-12 — Reports: All sub-report pages are static stubs or unimplemented
- **Location:** `src/app/app/reports/(hub)/builder/page.tsx`, `forecast/page.tsx`, `revenue/page.tsx`, `utilization/page.tsx`, `wip/page.tsx`, `win-rate/page.tsx`, `funnel/page.tsx`, `pipeline/page.tsx`
- **Gap type:** Missing workflow
- **Impact:** The reports hub links to 8 report sub-routes. All exist as files but none are connected to live aggregation queries or a reporting engine. The `custom_reports` table (queried by builder) has no confirmed migration. Reports are navigable but display no real data.
- **Recommended fix:** Create `custom_reports` table migration. Implement server-side aggregation queries per report type using existing schema (deals, proposals, invoices, time_entries). Replace stub content with data-driven charts.

---

### GAP-H-13 — Advancing: No `deleted_at` soft-delete on `production_advances`
- **Location:** `src/app/app/advancing/(hub)/page.tsx`, `production_advances` table
- **Gap type:** Missing data point
- **Impact:** Query does not filter `deleted_at IS NULL`. If advances are soft-deleted (which is the app-wide pattern), deleted advances will appear in the hub list.
- **Recommended fix:**
  ```sql
  ALTER TABLE public.production_advances
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ```
  Add `.is('deleted_at', null)` to the advancing hub query.

---

### GAP-H-14 — Campaigns: No unsubscribe/suppression workflow
- **Location:** `src/app/app/campaigns/(hub)/page.tsx`, `campaigns` table, `campaign_recipients` table
- **Gap type:** Missing workflow + missing table
- **Impact:** Campaigns can be sent to recipients with no unsubscribe tracking. There is no `suppression_list` or `unsubscribe_events` table. Sending to unsubscribed users is a CAN-SPAM/GDPR violation risk.
- **Recommended fix:** Create `email_suppressions (id, organization_id, email, reason, created_at)` table with unique constraint on `(organization_id, email)`. Check against this table before any send. Log unsubscribe events from a public `/unsubscribe?token=` route.

---

### GAP-H-15 — Leads: No lead-to-client conversion workflow
- **Location:** `src/app/app/leads/(hub)/page.tsx`, `leads` table
- **Gap type:** Missing workflow
- **Impact:** Leads have `converted_to_deal_id` but there is no `converted_to_client_id` or automated workflow to create a `clients` record when a lead is converted. The lead → deal → client pipeline has a manual gap — client records must be created separately with no linkage back to the originating lead.
- **Recommended fix:** Add `converted_to_client_id UUID REFERENCES clients(id)` to `leads`. Implement `POST /api/leads/[id]/convert` that atomically creates a `clients` record and a `deals` record, linking both back to the lead.

---

### GAP-H-16 — Integrations: No webhook or sync log table
- **Location:** `src/app/app/integrations/page.tsx`, `integrations` table
- **Gap type:** Missing table + missing workflow
- **Impact:** `integrations` stores `last_sync_at` but there is no `integration_sync_logs` table for tracking sync history, errors, or individual record sync status. Failed syncs are invisible. There are no webhook endpoint routes for any of the 11 listed platforms.
- **Recommended fix:** Create `integration_sync_logs (id, integration_id FK, status, records_synced, error_message, synced_at)`. Create `POST /api/webhooks/[platform]` routes for inbound webhook handling per integration.

---

### GAP-H-17 — Schedule: No edit/create route for production schedules
- **Location:** `src/app/app/schedule/(hub)/page.tsx`, `production_schedules` table
- **Gap type:** Missing workflow
- **Impact:** The schedule hub lists production schedules but there is no `/app/schedule/new` or `/app/schedule/[id]/edit` route. Schedules can only be read, not created or modified via the UI.
- **Recommended fix:** Add `/app/schedule/new/page.tsx` with a form for creating schedules. Add `/app/schedule/[id]/page.tsx` for editing. Implement `POST /api/schedules` and `PATCH /api/schedules/[id]`.

---

### GAP-H-18 — Procurement: Receiving workflow has no `received_items` table
- **Location:** `src/app/app/procurement/(hub)/page.tsx` → links to `/app/procurement/receiving`
- **Gap type:** Missing table + missing workflow
- **Impact:** The procurement hub links to a "Receive Goods" page at `/app/procurement/receiving`, but there is no `received_items` or `po_receipts` table in any migration. Goods-received recording is non-functional.
- **Recommended fix:**
  ```sql
  CREATE TABLE public.po_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE public.po_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES po_receipts(id) ON DELETE CASCADE,
    po_line_item_id UUID REFERENCES purchase_order_line_items(id) ON DELETE SET NULL,
    quantity_received INT NOT NULL DEFAULT 0,
    condition TEXT DEFAULT 'good'
  );
  ```

---

### GAP-H-19 — Workloads: No `[id]` detail route for individual allocations
- **Location:** `src/app/app/workloads/`
- **Gap type:** Missing workflow
- **Impact:** The workloads hub tab exists but there is no individual resource allocation detail route. Users cannot drill into who is allocated to what, at what percentage, or for which date range.
- **Recommended fix:** Add `/app/workloads/[id]/page.tsx` for allocation detail view. Add `POST /api/workloads` and `PATCH /api/workloads/[id]` routes.

---

### GAP-H-20 — Expenses: No approval workflow route
- **Location:** `src/app/app/expenses/(hub)/page.tsx`, `expenses` table
- **Gap type:** Missing workflow
- **Impact:** Expenses show `pending` and `approved` statuses but there is no `/app/expenses/[id]/approve` route or `PATCH /api/expenses/[id]` endpoint to transition status. Approvers have no UI to approve or reject expenses.
- **Recommended fix:** Add `PATCH /api/expenses/[id]` with `{ status: 'approved' | 'rejected', reviewer_id, reviewed_at }`. Add `reviewed_by UUID`, `reviewed_at TIMESTAMPTZ`, `rejection_reason TEXT` columns to `expenses`. Create an approval action in the expense detail view.

---

## Medium Severity

---

### GAP-M-01 — Roadmap: `project_end_date` not guaranteed to exist
- **Location:** `src/app/app/roadmap/page.tsx` → `getRoadmapItems()`
- **Gap type:** Missing data point
- **Impact:** Falls back to `event_date` when `project_end_date` is null, collapsing all single-date projects on the roadmap timeline. No migration confirms `project_end_date` on `proposals`.
- **Recommended fix:** `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS project_end_date DATE;` Expose a UI field on proposal creation/edit for project end date.

---

### GAP-M-02 — Templates: No template application workflow
- **Location:** `src/app/app/templates/page.tsx`, `phase_templates` table
- **Gap type:** Missing workflow
- **Impact:** Phase templates are listed but there is no UI action to apply a template to a new or existing proposal. The `phases` column is stored as `jsonb` array of strings — not FK-linked to actual `phases` records.
- **Recommended fix:** Add "Apply to Proposal" action on the templates page. Implement `POST /api/proposals/[id]/apply-template` that creates `phases` records from the template's phases array.

---

### GAP-M-03 — Time: No timer start/stop API
- **Location:** `src/app/app/time/(hub)/page.tsx`, `time_entries` table
- **Gap type:** Missing workflow
- **Impact:** `getTimeStats()` detects active timers via `end_time IS NULL` but there are no `POST /api/time/start` or `POST /api/time/stop` routes. Users cannot start or stop a timer through any implemented API endpoint.
- **Recommended fix:** Implement `POST /api/time/start` (inserts `time_entry` with `end_time = null`) and `POST /api/time/stop` (sets `end_time = now()`, computes `duration_minutes`).

---

### GAP-M-04 — Crew: Bulk delete operates client-side with no API
- **Location:** `src/app/app/crew/(hub)/page.tsx`
- **Gap type:** Missing workflow
- **Impact:** Bulk delete iterates selected crew member IDs client-side and calls Supabase directly. This bypasses any server-side business logic (e.g., checking for active bookings, compliance documents). Crew members with open assignments can be deleted silently.
- **Recommended fix:** Implement `DELETE /api/crew/[id]` with server-side guard: check for active `crew_bookings`, `work_order_assignments`, and `compliance_documents` before allowing delete. Return 409 conflict if blocked.

---

### GAP-M-05 — Dispatch: No pagination on work orders list
- **Location:** `src/app/app/dispatch/(hub)/page.tsx` → `getWorkOrders()`
- **Gap type:** Missing workflow
- **Impact:** Fetches all work orders without a `.limit()`. Organizations with large datasets will experience slow page loads and potential query timeouts.
- **Recommended fix:** Add `.range(0, 99)` or cursor-based pagination to the query. Add a "Load more" or page control to the UI.

---

### GAP-M-06 — My Documents: No upload workflow in page
- **Location:** `src/app/app/my-documents/page.tsx`, `file_attachments` table
- **Gap type:** Missing workflow
- **Impact:** The page reads `file_attachments` filtered by `is_personal = true` but there is no upload button or `POST /api/files/upload` route visible from this page. Users cannot add personal documents.
- **Recommended fix:** Add an upload button to `MyDocumentsTable`. Implement `POST /api/files/personal` that uploads to Supabase Storage and inserts a `file_attachments` record with `is_personal = true`.

---

### GAP-M-07 — My Inbox: No mark-all-read or archive workflow
- **Location:** `src/app/app/my-inbox/page.tsx`, `notifications` table
- **Gap type:** Missing workflow
- **Impact:** `MyInboxHeader` shows `unreadCount` but there is no `PATCH /api/notifications/mark-all-read` endpoint. The `archived` column is read but there is no UI to archive notifications. Inbox will grow unbounded.
- **Recommended fix:** Implement `PATCH /api/notifications` for bulk mark-as-read and archive. Add actions to `MyInboxTable`.

---

### GAP-M-08 — Clients: `last_activity` computed from `updated_at`, not actual activity
- **Location:** `src/app/app/clients/(hub)/page.tsx`
- **Gap type:** Missing data point
- **Impact:** `last_activity` maps directly to `c.updated_at` on the clients record. This reflects when the client record was last edited — not the last proposal, communication, deal, or invoice activity. Misleads account managers on client engagement.
- **Recommended fix:** Add a DB function or materialized column `last_activity_at` that takes `MAX(updated_at)` across `proposals`, `deals`, `invoices`, and `email_threads` for the client. Or compute it at query time via subquery.

---

### GAP-M-09 — Projects: No task count or progress indicator
- **Location:** `src/app/app/projects/page.tsx`, `projects` table
- **Gap type:** Missing data point
- **Impact:** The projects list shows name, status, and dates but no task count, completion percentage, or budget utilization. Users cannot assess project health at a glance.
- **Recommended fix:** Add task count subquery to `getProjects()`: join `tasks` with `COUNT` and `COUNT WHERE status = 'done'`. Pass to `ProjectsHubClient` for progress rendering.

---

### GAP-M-10 — Settings: No save confirmation or error toast
- **Location:** `src/app/app/settings/page.tsx` → `handleSave()`
- **Gap type:** Missing workflow
- **Impact:** `handleSave()` calls `PUT /api/settings/general` but has no success toast, error feedback, or optimistic state update. Users have no confirmation the save succeeded — they may submit multiple times.
- **Recommended fix:** Add `toast.success('Settings saved')` on success and `toast.error(...)` on failure using the existing toast library. Disable the save button during the request.

---

### GAP-M-11 — Marketplace: Crew profile guard blocks all non-crew users
- **Location:** `src/app/app/marketplace/page.tsx`
- **Gap type:** Missing workflow
- **Impact:** The marketplace returns an error if the current user has no crew profile — blocking admins, managers, and owners who may legitimately want to view or post work orders to the marketplace. The gate should be role-aware.
- **Recommended fix:** Check user role: allow `owner`, `admin`, `manager` to view all marketplace listings without requiring a crew profile. Only gate the "Apply to Work Order" action behind a crew profile requirement.

---

### GAP-M-12 — Fabrication: No BOM link from fabrication order list
- **Location:** `src/app/app/fabrication/(hub)/page.tsx`, `fabrication_orders` table, `bill_of_materials` table
- **Gap type:** Missing workflow
- **Impact:** Fabrication orders list does not surface BOM (bill of materials) status or link. Operators cannot see material readiness from the hub. BOM is defined in the schema (migration 00082 adds `updated_at`) but is not surfaced anywhere in the UI.
- **Recommended fix:** Add BOM item count column to the fabrication orders list. Link to `/app/fabrication/[id]/bom` from each row.

---

### GAP-M-13 — Compliance: `deleted_at` column queried but not confirmed on `compliance_documents`
- **Location:** `src/app/app/compliance/(hub)/page.tsx` line 24
- **Gap type:** Missing data point
- **Impact:** Query filters `.is('deleted_at', null)` on `compliance_documents`. If `deleted_at` does not exist on this table, the filter is ignored and soft-deleted documents appear in stats.
- **Recommended fix:** Confirm column exists and add if missing:
  ```sql
  ALTER TABLE public.compliance_documents
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ```

---

### GAP-M-14 — Goals: No progress auto-calculation from key results
- **Location:** `src/app/app/goals/GoalsPageClient.tsx`, `goals.progress`, `goal_key_results`
- **Gap type:** Missing workflow
- **Impact:** `goals.progress` is a manually-set integer. It is not automatically derived from `goal_key_results.current / goal_key_results.target`. If key results are updated, goal progress does not update unless manually adjusted.
- **Recommended fix:** Add a DB trigger on `goal_key_results` UPDATE that recomputes `goals.progress = AVG((current / NULLIF(target, 0)) * 100)` for the parent goal.

---

## Low Severity

---

### GAP-L-01 — Calendar / Locations: Redirect-only pages not documented
- **Location:** `src/app/app/calendar/page.tsx`, `src/app/app/locations/page.tsx`
- **Gap type:** Missing workflow
- **Impact:** Both pages are simple redirects. If the canonical destination routes are removed or renamed, these silently redirect to 404. No tests guard this.
- **Recommended fix:** Add route guard tests or document the canonical destinations. Consider replacing with Next.js `permanentRedirect()` for HTTP 308 semantics.

---

### GAP-L-02 — Budgets: Redirect to `/app/finance/budgets` — no role guard on destination
- **Location:** `src/app/app/budgets/page.tsx`
- **Gap type:** Missing workflow
- **Impact:** `RoleGate` correctly restricts `/app/budgets`, but if a restricted user navigates directly to `/app/finance/budgets`, the role gate on the redirect source is bypassed.
- **Recommended fix:** Add role-gate enforcement at the `/app/finance/budgets` route itself, not just the redirect stub.

---

### GAP-L-03 — AI: No conversation persistence
- **Location:** `src/app/app/ai/page.tsx`, `AiChatPanel` component
- **Gap type:** Missing table
- **Impact:** `AiChatPanel` renders a chat interface, but there is no `ai_conversations` or `ai_messages` table in any migration. Chat history is in-memory only — lost on page navigation or refresh.
- **Recommended fix:**
  ```sql
  CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```

---

### GAP-L-04 — Pipeline: `won_date` column exposed but no `lost_date`
- **Location:** `src/app/app/pipeline/[id]/page.tsx`, `deals` table
- **Gap type:** Missing data point
- **Impact:** `deals` tracks `won_date` for won deals but has no equivalent `lost_date`. Win/loss time reporting (average days to lose a deal) is asymmetric. Both transitions should be timestamped.
- **Recommended fix:** `ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_date TIMESTAMPTZ;` Set via trigger or application code when `stage = 'lost'`.

---

### GAP-L-05 — Roadmap: Progress only counts top-level tasks
- **Location:** `src/app/app/roadmap/page.tsx` → `getRoadmapItems()`
- **Gap type:** Missing data point
- **Impact:** Task progress filters `.is('parent_task_id', null)` — subtasks are excluded. A proposal where all work is in subtasks will always show 0% progress.
- **Recommended fix:** Remove the `parent_task_id` filter, or compute progress recursively counting all tasks regardless of depth.

---

### GAP-L-06 — Campaigns: `open_count` / `click_count` likely always zero
- **Location:** `src/app/app/campaigns/(hub)/page.tsx`, `campaigns` table
- **Gap type:** Missing workflow
- **Impact:** `open_count` and `click_count` are displayed but there is no tracking pixel endpoint (`GET /api/track/open/[campaignId]/[recipientId]`) or click redirect endpoint. These counters will always be `0`.
- **Recommended fix:** Implement `GET /api/track/open/[token]` (returns a 1×1 transparent GIF, increments `open_count`). Implement `GET /api/track/click/[token]` (redirects to URL, increments `click_count`). Embed tokens in outbound HTML email.

---

### GAP-L-07 — Invoices: No `partially_paid` status handling in status colors
- **Location:** `src/app/app/invoices/(hub)/page.tsx`, `STATUS_COLORS`
- **Gap type:** Missing data point
- **Impact:** Finance hub filters invoices by `['sent', 'partially_paid', 'overdue']` for outstanding balance calculation, but the invoices list `STATUS_COLORS` map has no entry for `partially_paid` (uses `partial` instead). Partially paid invoices render with the fallback grey badge, making them visually indistinguishable from unknown states.
- **Recommended fix:** Add `partially_paid: 'bg-yellow-50 text-yellow-700'` to `STATUS_COLORS` to match the DB status value, or standardize on `partial` across schema and queries.

---

### GAP-L-08 — Portfolio: No soft-delete support
- **Location:** `src/app/app/portfolio/page.tsx`, `portfolio_library` table
- **Gap type:** Missing data point
- **Impact:** Query does not filter `deleted_at IS NULL`. The app-wide soft-delete pattern is not applied. Deleted portfolio items will reappear in the gallery.
- **Recommended fix:**
  ```sql
  ALTER TABLE public.portfolio_library ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ```
  Add `.is('deleted_at', null)` to the portfolio query.

---

### GAP-L-09 — People: `facility_id` returned as raw UUID, not facility name
- **Location:** `src/app/app/people/(hub)/page.tsx` line 42
- **Gap type:** Missing data point
- **Impact:** `facility: u.facility_id` passes the raw UUID to the `PeopleGrid`. Without joining to `facilities`, the grid will render a UUID string as the facility label.
- **Recommended fix:** Join to `facilities` in the query: add `.select('..., facilities(name)')` and map `facility: u.facilities?.name ?? null`.

---

### GAP-L-10 — Compliance: Export CSV endpoint not implemented
- **Location:** `src/app/app/compliance/(hub)/page.tsx` line 82 → `href="/api/compliance/export"`
- **Gap type:** Missing workflow
- **Impact:** Download button links to `/api/compliance/export` which may not exist as an implemented route. Clicking it will return 404.
- **Recommended fix:** Implement `GET /api/compliance/export` that queries `compliance_documents` for the org and streams a CSV response with `Content-Disposition: attachment`.

---

### GAP-L-11 — Advancing: Links to `projects(name)` but advances may not always have a project
- **Location:** `src/app/app/advancing/(hub)/page.tsx` line 16
- **Gap type:** Missing data point
- **Impact:** `production_advances` joins `projects(name)` but the join is not `.inner` — if `project_id` is null, `projects` will be null. The UI should handle this gracefully, but it currently maps `projects: row.projects as { name: string } | null` with no null guard in rendering.
- **Recommended fix:** Add null guard in `AdvancingListClient` when rendering project name. Also confirm `project_id` on `production_advances` is nullable at the schema level.

---

*End of audit. Total gaps identified: 40 (8 Critical, 20 High, 14 Medium, 11 Low)*
