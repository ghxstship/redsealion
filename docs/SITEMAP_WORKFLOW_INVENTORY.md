# Site Map & Workflow Inventory — Red Sea Lion / FlyteDeck

**Generated**: 2026-04-13  
**Depth**: Full Atomic (5 levels)  
**Scope**: All authenticated, public, and admin views  

---

## Platform Architecture Summary

| Dimension | Count |
|-----------|-------|
| Route Groups | 7 (`(auth)`, `(marketing)`, `app`, `portal`, `o`, `forms`, root) |
| Pages (page.tsx) | **252** |
| Layouts (layout.tsx) | **61** |
| API Routes (route.ts) | **163** |
| RBAC Resources | **50** (`PermissionResource` union) |
| Feature Keys (TierGated) | **80+** (`FeatureKey` union) |
| Subscription Tiers | 4 (`portal`, `starter`, `professional`, `enterprise`) |
| Internal Roles | 6 (`developer`, `owner`, `admin`, `controller`, `manager`, `team_member`) |
| External Roles | 4 (`client`, `contractor`, `crew`, `viewer`) |

---

## 1. Root & Infrastructure

```
FlyteDeck
├── / (Landing Page)
│   ├── Identity: { name: "Landing", level: Page, path: "/" }
│   ├── Capabilities: [View marketing hero, CTA → /signup, CTA → /login]
│   ├── RBAC: { visible: public }
│   └── Layout: (marketing) — MarketingNav + MarketingFooter + JsonLd
│
├── /offline
│   ├── Identity: { name: "Offline", level: Page, path: "/offline" }
│   ├── Capabilities: [Display offline message]
│   ├── Workflows: [PWA offline fallback — triggered by ServiceWorker]
│   └── RBAC: { visible: public }
│
├── /reactivate
│   ├── Identity: { name: "Reactivate", level: Page, path: "/reactivate" }
│   ├── Capabilities: [Display reactivation CTA, link to billing]
│   ├── Workflows: [Subscription recovery — triggered by middleware check]
│   └── RBAC: { visible: authenticated, subscription_expired }
│
└── /forms/[token]
    ├── Identity: { name: "Public Form", level: Page, path: "/forms/:token" }
    ├── Capabilities: [Render dynamic form, submit intake data]
    ├── Workflows: [Lead capture → creates lead in org]
    └── RBAC: { visible: public (token-gated) }
```

---

## 2. Auth Route Group `(auth)`

```
(auth)/
├── /login
│   ├── Capabilities: [Email/password auth, OAuth (Google/GitHub), magic link, "forgot password" link]
│   ├── Workflows: [Login → redirect to /app or /portal based on role]
│   ├── API: POST /api/auth/login
│   └── RBAC: { visible: unauthenticated }
│
├── /signup
│   ├── Capabilities: [Create account, accept invite, redeem invite code]
│   ├── Workflows: [Signup → verify email → setup org → /app]
│   └── Sub-page: /signup/setup-org
│       ├── Capabilities: [Create organization, set slug, upload logo]
│       └── API: POST /api/organizations
│
├── /forgot-password → POST /api/auth/reset
├── /reset-password → POST /api/auth/update-password
├── /verify-email → GET /api/auth/verify
└── /invite/[token]
    ├── Capabilities: [Accept team invitation, join existing org]
    └── API: POST /api/v1/invitations/:id
```

---

## 3. Marketing Route Group `(marketing)`

```
(marketing)/
├── /pricing — Tier comparison table, CTA → signup
├── /features — Feature matrix with animations
├── /marketplace — Public cross-org job board (NEW)
│   ├── Capabilities: [Browse public work orders, filter by org, CTA → signup]
│   ├── API: GET /api/public/marketplace
│   ├── Relationships: { upstream: work_orders(is_public_board=true), downstream: /signup }
│   └── RBAC: { visible: public }
│
├── /compare/ — Competitor comparison hub
│   ├── /asana, /clickup, /monday, /productive-io
│   ├── /project-management-tools, /spreadsheets
│   └── Capabilities: [SEO landing pages with feature comparison tables]
│
├── /use-cases/ — Vertical-specific landing pages
│   ├── /brand-activations, /concerts-festivals, /corporate-events
│   ├── /film-tv-broadcast, /immersive-experiences, /live-events
│   ├── /pop-up-experiences, /theatrical-productions, /trade-shows
│   └── Capabilities: [Industry-specific hero, testimonials, CTA]
│
├── /intake/[orgSlug] — Public intake form for org
├── /privacy — Privacy policy (static)
├── /terms — Terms of service (static)
└── Layout: MarketingNav + MarketingFooter + Organization JsonLd
```

---

## 4. Org Public Pages `/o/[orgSlug]` (NEW)

```
o/[orgSlug]/
├── / (Landing Page)
│   ├── Capabilities: [Display org hero, logo, featured portfolio, open job count]
│   ├── Relationships: { upstream: organizations, portfolio_library(is_published), work_orders(is_public_board) }
│   ├── RBAC: { visible: public }
│   └── Layout: Branded header + client/contractor portal links + footer
│
└── /portfolio
    ├── Capabilities: [Gallery grid, category pills, JSON-LD structured data]
    ├── Relationships: { upstream: portfolio_library(is_published=true) }
    ├── SEO: generateMetadata with OG tags per org
    └── RBAC: { visible: public }
```

---

## 5. Admin App `/app`

### 5.1 Overview Section

```
app/
├── / (Dashboard)
│   ├── Sections: [MetricCards, RecentActivity, QuickActions, UpcomingEvents]
│   ├── Capabilities: [View KPIs, navigate to modules, quick-create proposal/task]
│   ├── RBAC: { visible: all internal roles }
│   └── Layout: RoleGate(layout.tsx) + AppSidebar + TopNav + CommandPalette
│
├── /favorites
│   ├── Capabilities: [CRUD bookmarks, navigate to favorited items]
│   ├── API: GET/POST/DELETE /api/favorites
│   └── RBAC: { visible: all internal roles }
│
├── /ai
│   ├── Capabilities: [Chat with AI, generate proposals, draft emails]
│   ├── API: POST /api/ai/chat, POST /api/ai/generate
│   ├── TierGate: ai_assistant (enterprise)
│   └── RBAC: { visible: all internal roles with ai_assistant permission }
│
├── /my-schedule
│   ├── Capabilities: [Unified agenda from 6 sources, mini-calendar, iCal export, Add to Google Calendar]
│   ├── Upstream: tasks, crew_bookings, schedule_blocks, events, milestones, shifts
│   └── RBAC: { visible: all internal roles }
│
├── /my-tasks → Personal task list, filtered to current user
├── /my-inbox → Notification center + message threads
└── /my-documents → User's uploaded files
```

### 5.2 Projects Section

```
app/projects/
├── / (List) — DataTable of projects, create new, filter
├── /new — Project creation form
├── /[id] — Project detail with sub-tabs (tasks, budget, timeline, files)
│
app/tasks/
├── /(hub)/ — Hub with tabs
│   ├── / (List) — Filterable task table with saved views
│   ├── /board — Kanban board (drag-drop status changes)
│   ├── /calendar — Calendar view of due dates
│   ├── /gantt — Gantt chart timeline
│   ├── /projects — Tasks grouped by project
│   └── /workload — Per-member workload distribution
├── /[id] — Task detail: status, assignees, checklist, comments, attachments, dependencies
│   ├── API: Full CRUD + /checklist, /comments, /attachments, /dependencies, /photos, /watch
│   └── Workflows: [Task lifecycle: todo → in_progress → review → done]
│
app/goals/
├── / — OKR dashboard with goals + key results
│   ├── Components: GoalDialog, KeyResultForm, CheckInDialog
│   ├── Capabilities: [CRUD goals, CRUD key results, check-in progress, auto-complete at 100%]
│   ├── Workflows: [Goal lifecycle: on_track → at_risk → off_track → completed (auto via trigger)]
│   └── TierGate: tasks (portal tier)
│
app/roadmap/
├── / — Quarterly timeline of proposals/projects
│   ├── Upstream: proposals(status != draft) + tasks (for progress)
│   └── TierGate: roadmap (portal tier)
│
app/files/ → Organization file manager
app/templates/ → Reusable document/proposal templates
```

### 5.3 Sales & Marketing Section

```
app/leads/
├── /(hub)/ — Lead management hub
│   ├── / (List) — Lead table with pipeline stage indicators
│   ├── /[id] — Lead detail: contact info, activity log, convert → client/proposal
│   └── /forms — Intake form builder
│   └── TierGate: leads
│
app/pipeline/
├── /(hub)/ — Sales pipeline
│   ├── / — Kanban board of deal stages
│   ├── /list — Table view
│   ├── /forecast — Revenue forecast chart
│   ├── /commissions — Commission tracking
│   ├── /territories — Territory management
│   ├── /settings — Pipeline stage configuration
│   └── /[id] — Deal detail
│   └── TierGate: pipeline
│
app/clients/
├── /(hub)/ — Client CRM
│   ├── / (List) — Client table with contact/company details
│   ├── /activity — Cross-client activity feed
│   ├── /map — Geographic map view
│   ├── /segments — Client segmentation
│   └── /[id] — Client 360: proposals, invoices, contacts, notes
│   └── TierGate: clients
│
app/proposals/
├── / (List) — All proposals with status filters
├── /new — Proposal creation wizard
├── /[id] — Proposal detail
│   ├── /builder — Interactive proposal editor (sections, pricing, scope)
│   ├── /export — PDF/DOCX export
│   └── /scenarios — What-if pricing scenarios (enterprise)
│   └── Workflows: [Proposal lifecycle: draft → sent → approved → signed → active → completed]
│   └── TierGate: proposals
│
app/campaigns/
├── /(hub)/ — Email campaign management
│   ├── / — Campaign list
│   ├── /analytics — Performance metrics (opens, clicks, conversions)
│   ├── /audiences — Audience segment management
│   ├── /drafts — Draft campaigns
│   ├── /scheduled — Scheduled sends
│   └── /new — Campaign builder
│   └── API: GET /api/campaigns/analytics
│   └── TierGate: email_campaigns
│
app/emails/ → Email inbox with threading
app/portfolio/ → Portfolio library with publish/unpublish toggle
    ├── Capabilities: [CRUD items, publish/unpublish toggle (Globe/EyeOff), category filtering]
    ├── API: PATCH /api/portfolio/:id (is_published toggle)
    └── Downstream: /o/[orgSlug]/portfolio (public view)
```

### 5.4 Productions Section

```
app/events/
├── /(hub)/ — Event management
│   ├── / (List), /calendar, /activations, /daily-reports
│   ├── /locations — Venue/location management
│   ├── /punch-list — Outstanding items tracker
│   └── /[id] — Event detail with run-of-show, crew, logistics
│   └── TierGate: events
│
app/schedule/
├── /(hub)/ — Production scheduling
│   ├── / (List), /build-strike — Build/strike schedule
│   ├── /milestones — Milestone tracker
│   ├── /run-of-show — Time-blocked show flow
│   └── /[id], /new
│   └── TierGate: events (same gate)
│
app/advancing/
├── /(hub)/ — Advancing workflow
│   ├── / (Overview), /submissions, /approvals, /allocations
│   ├── /assignments, /fulfillment
│   └── /[id] — Advance detail
│   └── TierGate: advancing
│
app/fabrication/
├── /(hub)/ — Shop floor management
│   ├── / (Overview), /bom — Bill of materials
│   ├── /shop-floor — Work station views + /kiosk mode
│   ├── /quality — QC tracking
│   ├── /print — Print queue
│   └── /[id] — Fabrication order detail
│   └── TierGate: equipment
│
app/procurement/
├── /(hub)/ — Procurement hub
│   ├── / (Overview), /requisitions, /purchase-orders, /suppliers
│   ├── /receiving → REDIRECT → /app/logistics/goods-receipts (canonical)
│   └── Sub-routes: /requisitions/[id], /purchase-orders/[id], /suppliers/[id], etc.
│   └── TierGate: procurement
│
app/rentals/
├── /(hub)/ — Equipment rental management
│   ├── / (List), /reservations, /returns, /sub-rentals, /utilization
│   └── /[id], /new
│   └── TierGate: equipment
```

### 5.5 Operations Section

```
app/people/
├── /(hub)/ — HR module
│   ├── / (Directory), /org-chart, /time-off
│   └── /[id] — Employee profile
│   └── TierGate: people_hr
│
app/crew/
├── /(hub)/ — Crew management
│   ├── / (Roster), /availability — Calendar widget
│   ├── /onboarding, /recruitment, /schedule
│   └── /[id], /[id]/edit
│   └── TierGate: crew
│
app/workloads/
├── /(hub)/ — Resource planning
│   ├── / (Overview), /schedule — Gantt-style resource calendar
│   └── /utilization — Utilization metrics
│   └── TierGate: resource_scheduling
│
app/time/
├── /(hub)/ — Time tracking
│   ├── / (Entries), /timer — Live timer, /timesheets
│   └── API: POST /api/time/start, POST /api/time/stop
│   └── TierGate: time_tracking
│
app/dispatch/
├── /(hub)/ — Field dispatch
│   ├── / (Overview), /board — Dispatch kanban
│   ├── /history, /routes
│   └── /[id], /new
│   └── TierGate: work_orders
│
app/work-orders/
├── / (List), /[id], /new
│   ├── Capabilities: [CRUD work orders, assign crew, manage bids, public board toggle]
│   ├── API: Full CRUD + /assignments, /bids
│   └── TierGate: work_orders
│
app/marketplace/
├── / — Internal work order marketplace (bidding view)
│   └── /[id] — Bid detail
│   └── TierGate: marketplace (enterprise)
│
app/equipment/
├── /(hub)/ — Equipment management
│   ├── / (List), /assets, /bundles, /check-in-out
│   ├── /inventory, /maintenance
│   └── /[id] — Item detail with QR codes
│   └── TierGate: equipment
│
app/logistics/
├── /(hub)/ — Warehouse & logistics
│   ├── / (Overview), /shipping, /receiving — Inbound tracking
│   ├── /transfers, /packing, /counts — Cycle counts
│   ├── /scan — Barcode scanner, /goods-receipts — Canonical goods receipt list
│   └── Sub-routes: /shipments/[id], /shipments/[id]/bol, /transfers/[id], /counts/[id]
│   └── TierGate: warehouse
│
app/compliance/
├── /(hub)/ — Compliance management
│   ├── / (Overview), /certifications, /cois
│   ├── /contracts, /licenses, /permits
│   ├── Workflows: [Document lifecycle: uploaded → review → approved → expiring → expired → renewed]
│   ├── Cron: /api/cron/compliance-expiry (8:00 AM), /api/cron/compliance-renewal (8:30 AM)
│   └── TierGate: compliance
│
app/locations/ — Venue/location registry with map view
```

### 5.6 Finance Section

```
app/finance/
├── /(hub)/ — Finance aggregation hub
│   ├── / (Overview) — Summary metrics: revenue, costs, margins
│   ├── /budgets — Budget list
│   ├── /invoices, /invoices/credit-notes, /invoices/recurring
│   ├── /profitability — Margin analysis
│   ├── /purchase-orders — PO management
│   ├── /revenue-recognition — Rev-rec schedules
│   └── /vendors — Vendor directory
│   └── Sub-routes: /purchase-orders/[id], /purchase-orders/new, /vendors/[id], /vendors/new
│   └── TierGate: profitability
│
app/invoices/
├── /(hub)/ — Direct invoice management
│   ├── / (List), /credit-notes, /recurring
│   └── /[id], /new
│   └── TierGate: invoices
│
app/budgets/ — Project budget management
├── /, /[id]
│   └── TierGate: budgets
│
app/expenses/
├── /(hub)/ — Expense tracking
│   ├── / (List), /approvals, /mileage, /receipts
│   └── /new, /mileage/new
│   └── TierGate: expenses
│
app/profitability/
├── / — Project profitability analysis
│   └── /[proposalId] — Per-proposal P&L
│   └── TierGate: profitability
```

### 5.7 Admin Section

```
app/reports/
├── /(hub)/ — Reporting engine
│   ├── / (Gallery), /builder — Custom report builder
│   ├── /pipeline, /funnel, /win-rate, /revenue
│   ├── /utilization, /wip, /forecast
│   └── TierGate: reports
│
app/automations/
├── /(hub)/ — Workflow automation
│   ├── / (List), /runs — Execution history
│   ├── /templates — Automation templates
│   └── /[id], /[id]/edit, /new
│   └── TierGate: automations
│
app/integrations/
├── / (Hub) — Integration marketplace
│   ├── /[platform] — Platform-specific config (QuickBooks, Xero, Stripe, etc.)
│   └── /sync-errors — Sync error log
│   └── TierGate: integrations
│
app/settings/
├── / (Index) — Settings hub with cards
├── /profile — User profile
├── /appearance — Theme settings (light/dark)
├── /branding — Organization brand config (colors, logo)
├── /billing — Subscription management
├── /team — Team member management + invite
├── /security/ — Security hub
│   ├── /, /mfa, /permissions, /audit-log
├── /webhooks, /api-keys, /sso
├── /notifications, /email-templates
├── /integrations → REDIRECT → /app/integrations
├── /automations-config, /calendar-sync
├── /payment-terms, /payments, /tax, /cost-rates
├── /custom-fields, /tags, /localization
├── /document-defaults, /data-privacy, /facilities
└── TierGate: settings (varies by sub-page)
│
app/portal/ — Portal management
├── / — List of project portals
│   └── /projects/[id] — Portal config per project
│
app/calendar/ — Org-wide calendar view
app/terms/ — Terms & conditions builder
```

---

## 6. Client Portal `/portal/[orgSlug]`

```
portal/[orgSlug]/
├── / — Client dashboard: proposal list, upcoming events
├── /login — Portal-specific login
├── /account — Account settings
├── /pricing — Tier comparison (trial CTA)
├── /refer — Referral program
├── /request — Service request form
│
├── /proposals/[id]/ — Proposal view (with layout-level OG metadata)
│   ├── / — Proposal overview
│   ├── /comments — Threaded comments
│   ├── /files — Shared documents
│   ├── /invoices — Associated invoices
│   ├── /milestones — Milestone tracker
│   └── /progress — Progress dashboard
│   └── RBAC: { visible: authenticated portal users }
│
├── /bookings/[bookingId] — Crew booking detail
├── /pay/[invoiceId] — Online payment page
├── /sign/[token] — E-signature flow
│
├── /app/ — Demo app shell (tier=portal)
│   ├── / — Demo dashboard
│   ├── /clients, /invoices, /leads, /pipeline, /proposals, /reports
│   └── /[...rest] — Catch-all → UpgradePrompt
│   └── Layout: PortalContextProvider(portalType='client') + PortalSidebar + DemoBanner
│
└── /contractor/ — Contractor Portal (NEW)
    ├── / — Dashboard: active bookings, bids, compliance status
    ├── /jobs — Public work order marketplace (bidding)
    │   └── /[id] — Job detail + bid submission form
    ├── /bookings — Crew booking list
    │   └── /[id] — Booking detail with check-in/out
    ├── /time — Time entry logging + history
    ├── /documents — Uploaded files
    ├── /compliance — Certification/expiry tracking with color-coded status
    ├── /profile — Contractor profile editing (name, phone, rate, skills, bio)
    ├── API: GET/POST /api/portal/contractor/time-entries
    ├── Components: ContractorSidebar (emerald/teal), PortalRoleGate
    ├── Layout: PortalContextProvider(portalType='contractor') + ContractorSidebar
    └── RBAC: { visible: contractor, crew roles } (CONTRACTOR_PORTAL_PERMISSIONS)
```

---

## 7. API Routes (163 endpoints)

### Core CRUD APIs

| Resource | Endpoints | Auth |
|----------|-----------|------|
| proposals | GET/POST + /:id (GET/PATCH/DELETE) + /duplicate, /sign, /preview | Permission-guarded |
| clients | GET/POST + /:id + /contacts, /notes, /activity | Permission-guarded |
| invoices | GET/POST + /:id + /payments, /credit-notes, /send | Permission-guarded |
| tasks | GET/POST + /:id + /checklist, /comments, /attachments, /dependencies, /photos, /watch | Permission-guarded |
| work-orders | GET/POST + /:id + /assignments, /bids | Permission-guarded |
| time-entries | GET/POST + /:id | Permission-guarded |
| expenses | GET/POST + /:id + /approvals | Permission-guarded |
| equipment | GET/POST + /:id + /check-in, /check-out | Permission-guarded |
| shipments | GET/POST + /:id + /items | Permission-guarded |

### Platform APIs

| Route | Purpose | Auth |
|-------|---------|------|
| /api/v1/memberships | Org membership CRUD | Auth |
| /api/v1/roles | Role management | Admin |
| /api/v1/sessions | Session management | Auth |
| /api/v1/api-keys | API key management | Admin |
| /api/v1/invitations | Team invitations | Admin |
| /api/v1/invite-codes | Invite code management | Admin |
| /api/v1/join-requests | Join request handling | Admin |
| /api/v1/feature-flags | Feature flag management | Admin |
| /api/v1/portals | Portal configuration | Admin |

### Public APIs (No Auth)

| Route | Purpose |
|-------|---------|
| /api/public/marketplace | Public job board |
| /api/forms/[token] | Public form submission |
| /api/track/open | Email open tracking pixel |
| /api/track/click | Email click tracking |
| /api/portal/auth | Portal authentication |

### Cron Endpoints

| Route | Schedule | Purpose |
|-------|----------|---------|
| /api/cron/task-reminders | 7:00 AM | Task due date reminders |
| /api/cron/review-requests | 9:00 AM | Review request emails |
| /api/cron/proposal-follow-ups | 10:00 AM | Proposal follow-up nudges |
| /api/cron/recurring-invoices | 6:00 AM | Recurring invoice generation |
| /api/cron/compliance-expiry | 8:00 AM | Compliance status updates |
| /api/cron/compliance-renewal | 8:30 AM | Renewal reminder collection |
| /api/cron/maintenance | 6:00 AM | System maintenance |
| /api/cron/recurring-tasks | Hourly | Recurring task generation |
| /api/cron/automations | Every 15 min | Automation engine |
| /api/invoices/send-reminders | 9:00 AM | Invoice payment reminders |

---

## 8. RBAC Matrix

### Permission Resources (50)

```
proposals, pipeline, clients, invoices, budgets, reports, expenses,
time_tracking, tasks, assets, team, integrations, automations, settings,
ai_assistant, crew, equipment, leads, warehouse, advances, activations,
events, locations, work_orders, resources, resource_scheduling,
ai_drafting, email_campaigns, referral_program, purchase_orders, vendors,
dispatch, fabrication, rentals, projects, goals, portfolio, compliance,
marketplace, files, project_portals, webhooks, schedule, portals,
profitability, templates, terms, workloads, roadmap, finance,
calendar, campaigns, email_inbox
```

### Role → Permission Summary

| Role | Access Level |
|------|-------------|
| **developer** | Full CRUD all resources |
| **owner** | Full CRUD all resources |
| **admin** | Full CRUD all resources |
| **controller** | View+Create most; no delete on core; view-only portals/webhooks |
| **manager** | View+Create most; view-only finance/webhooks |
| **team_member** | View-only most; create tasks/time; no settings/finance |
| **client** | Portal-only: view proposals, invoices, files assigned to them |
| **contractor** | Contractor portal: view jobs, submit bids, log time, view bookings |
| **crew** | Contractor portal (limited): view bookings, log time, view compliance |
| **viewer** | Read-only access to portal views |

### Feature Tier Gating

| Tier | Feature Count | Key Features |
|------|--------------|--------------|
| **portal** (free) | 14 | proposals, clients, pipeline, leads, invoices, reports, projects, tasks, gantt, roadmap, files, calendar |
| **starter** | 10 | portfolio, assets, team, templates, terms, export, billing, advancing |
| **professional** | 29 | integrations, automations, webhooks, email, crew, equipment, events, compliance, campaigns, referrals |
| **enterprise** | 18 | time_tracking, budgets, profitability, expenses, AI, warehouse, work_orders, marketplace, SSO, audit_log |

---

## 9. Workflow Inventory

### W1: Proposal Lifecycle
```
Lead Capture → Lead → Convert to Proposal → Draft → Send → Client Review
→ Approve/Reject → E-Sign → Active → Invoice → Completed
```
- **Nodes**: leads/[id], proposals/new, proposals/[id]/builder, portal/.../proposals/[id], portal/.../sign/[token]
- **Type**: Linear with branching (approve/reject)

### W2: Task Lifecycle
```
Create → Todo → In Progress → Review → Done
         ↕ (blocked by dependencies)
```
- **Nodes**: tasks/(hub), tasks/[id], my-tasks
- **Type**: Linear with dependency gates

### W3: Goal OKR Lifecycle
```
Create Goal → Add Key Results → Check-In Progress → Auto-Complete at 100%
                                                    ↓
                                              completed_at set via trigger
```
- **Nodes**: goals/, GoalDialog, KeyResultForm, CheckInDialog
- **Type**: Linear with auto-completion

### W4: Invoice Lifecycle
```
Create → Draft → Send → Viewed → Partial Payment → Paid → Closed
                                ↓ (overdue)
                          Reminder Cron → Manual Follow-up
```
- **Nodes**: invoices/(hub), invoices/[id], portal/.../pay, cron/invoices/send-reminders
- **Type**: Linear with overdue branch

### W5: Work Order → Marketplace → Bid
```
Create WO → Toggle Public Board → Publish to Marketplace
                                    ↓
                              Contractor Views → Submit Bid → Review → Accept/Reject
                                                                ↓
                                                          Create Booking
```
- **Nodes**: work-orders/[id], marketplace, portal/.../contractor/jobs/[id]
- **Type**: Branching (multi-bidder)

### W6: Compliance Document Lifecycle
```
Upload → Review → Approved/Rejected
                    ↓ (approved, has expiry)
              Active → Expiring Soon (30d) → Expired
                              ↓
                    Renewal Cron → Reminder Sent → Renewal Uploaded
```
- **Nodes**: compliance/(hub), contractor/compliance, cron/compliance-renewal
- **Type**: Looping (renewal cycle)

### W7: Equipment Check-In/Out
```
Available → Reserved → Checked Out → In Use → Checked In → Available
                                       ↓ (maintenance)
                                    Maintenance → Repaired → Available
```
- **Nodes**: equipment/(hub)/check-in-out, equipment/[id], equipment/(hub)/maintenance

### W8: Procurement → Goods Receipt
```
Create Requisition → Approve → Create PO → Send to Vendor
                                              ↓
                                    Goods Receipt (logistics) → Inspect → Complete/Partial
```
- **Nodes**: procurement/(hub), logistics/(hub)/goods-receipts
- **Type**: Linear

### W9: Crew Booking
```
Event Created → Staff Requirements → Search/Book Crew → Confirmation
                                                          ↓
                                                    Check-In → Work → Check-Out → Timesheet
```
- **Nodes**: crew/(hub), events/[id], contractor/bookings/[id], time

### W10: Portfolio Publish
```
Create Item → Edit → Publish (is_published=true) → Visible on /o/[orgSlug]/portfolio
                      ↓ (unpublish)
                    Hidden from public
```
- **Nodes**: portfolio/, PortfolioGrid (Globe/EyeOff toggle), o/[orgSlug]/portfolio
- **Type**: Toggle (publish/unpublish)

---

## 10. Quality Flags

### 🟢 Orphaned Elements

| Element | Status | Assessment |
|---------|--------|------------|
| `/app/calendar` | ✅ Valid | Full calendar page, member of scheduling workflow |
| `/app/portal` | ✅ Valid | Portal Management index, member of portal administration workflow |
| `/app/profitability` | ✅ Valid | Finance sub-module with per-proposal analysis |
| `/offline` | ✅ Valid | ServiceWorker fallback, triggered automatically |
| `/reactivate` | ✅ Valid | Middleware-triggered subscription recovery |

**Result: 0 orphaned elements**

> [!NOTE]
> All previously flagged elements have been validated as active workflow participants.

---

### 🟢 Dead-End Workflows

| Workflow | Status | Assessment |
|----------|--------|------------|
| Goals | ✅ Resolved | `completed_at` column + auto-complete trigger at 100% progress |
| Roadmap milestones | ✅ Resolved | No standalone table — view over proposals, which have full lifecycle |
| Portfolio visibility | ✅ Resolved | `is_published` + `published_at` + public RLS + publish toggle UI |
| Compliance renewal | ✅ Resolved | Renewal cron + `renewal_reminder_sent` + `auto_renew` + `v_compliance_expiring_soon` view |

**Result: 0 dead-end workflows**

---

### 🟢 Permission Gaps

| Resource | Status | Assessment |
|----------|--------|------------|
| `portals` | ✅ Resolved | Explicit CRUD for all 6 internal roles |
| `project_portals` | ✅ Resolved | Explicit CRUD for all 6 internal roles |
| `webhooks` | ✅ Resolved | Gated: admin+ full, manager view-only, others none |
| `finance` | ✅ Resolved | Gated: admin+ full, controller/manager view-only |
| `marketplace` | ✅ Resolved | Independent FeatureKey at enterprise tier |
| Contractor portal | ✅ Resolved | `CONTRACTOR_PORTAL_PERMISSIONS` matrix for contractor/crew |

**Result: 0 critical permission gaps**

> [!TIP]
> Pages without explicit `TierGate`/`RoleGate` in their `page.tsx` (72 pages) inherit protection from their parent `layout.tsx`. All 51 module layouts contain gate wrappers.

---

### 🟡 Dangling Dependencies (Minor)

| Dependency | Severity | Details |
|------------|----------|---------|
| `settings/security/audit-log` vs `settings/audit-log` | Low | Two audit log pages exist. `/settings/security/audit-log` is the canonical one within the security sub-group; `/settings/audit-log` exists as a standalone shortcut. Both functional, slight redundancy. |
| `app/invoices` vs `app/finance/invoices` | Low | Two invoice list views. `/app/invoices/(hub)` is the standalone module; `/app/finance/(hub)/invoices` is the finance-aggregated view. Both query the same table. Not broken — intentional aggregation. |

**Result: 0 critical dangling dependencies, 2 documented redundancies (by design)**

> [!NOTE]
> The two redundancies above are **architectural by design**: the finance hub provides an aggregated cross-module view while standalone modules give deep functionality. The settings audit-log shortcut is a convenience alias.

---

## 11. Shared State & Context Providers

| Provider | Scope | State Keys |
|----------|-------|-----------|
| `SubscriptionProvider` | App + Portal | `tier`, `canAccess(feature)` |
| `PortalContextProvider` | Portal layouts | `orgSlug`, `orgName`, `orgId`, `portalType`, `userId`, `crewProfileId` |
| `ThemeProvider` | Root layout | `theme` (light/dark/system) |
| `CommandPaletteProvider` | App layout | `isOpen`, `query`, `results` |
| `SidebarProvider` | App layout | `isCollapsed`, `activeGroup` |

---

## Summary

The FlyteDeck platform contains **252 pages**, **163 API routes**, and **50 RBAC-controlled resources** across a fully hierarchical IA. All previously identified quality flags (orphaned elements, dead-end workflows, permission gaps, and dangling dependencies) have been remediated. The platform is architecturally sound with zero critical findings.
