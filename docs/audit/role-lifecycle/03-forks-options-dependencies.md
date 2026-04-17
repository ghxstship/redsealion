# Phase 3 — Forks, Options, Dependencies

Each item becomes a state-machine branch or precondition that must be encodable in DB schema + enforced via trigger or RLS + reflected in the permission bundle.

---

## 3.1 — Forks (conditional branches)

Forks are mutually exclusive paths. Each fork requires:
- a discriminator column on the governing table,
- distinct document / credential requirements per branch,
- branch-specific RLS filter on downstream stages.

| Fork ID | Axis | Branches | Governing table | Discriminator | Affected stages | Affected roles | Closure ticket |
|---|---|---|---|---|---|---|---|
| F-01 | Employment class | 1099 / W2 / corp-to-corp / volunteer | `crew_members`, `staff_members`, `vendors` | `employment_class` enum | 2, 4, 10, 11 | crew, staff, vendor | C-FORK-01 |
| F-02 | Jurisdiction | domestic / international | `project_users`, `vendors`, `talent_records` | `jurisdiction` code + `work_auth_type` | 2, 4, 11 | crew, staff, talent, vendor | C-FORK-02 |
| F-03 | Union status | IATSE / non-union / hybrid | `crew_members`, `project.is_union_signatory` | `union_local` FK, `is_union_signatory` bool | 2, 4, 5, 10 | crew, management | C-FORK-03 |
| F-04 | Asset source | owned / rented / fabricated / sub-rented | `advance_line_items`, `component_items` | `fulfillment_method` enum (exists, extend) | 6, 7, 9, 10 | vendor, production, management | C-FORK-04 |
| F-05 | Permit status | permitted / unpermitted / pending | `permits` (new sub of compliance) | `permit_status` enum | 5, 7 | management, production, executive | C-FORK-05 |
| F-06 | Credential tier | all-access / production / vendor / press / guest / GA | `credentials` | `credential_tier` enum | 7, 8 | all | C-FORK-06 |
| F-07 | Minor status | minor / adult | `talent_records`, `guest_tickets`, `attendee_tickets` | `is_minor` bool + `guardian_consent_id` | 2, 4, 6, 7 | talent, guest, attendee | C-FORK-07 |
| F-08 | Visa type | B-1 / O-1 / P-1 / P-2 / none-required | `talent_records`, `crew_members` | `visa_type` enum | 2, 6, 7 | talent, crew | C-FORK-08 |
| F-09 | Signatory | prime / sub / agency placement | `vendors`, `staff_members` | `signatory_type` enum | 4, 10, 11 | vendor, staff | C-FORK-09 |
| F-10 | Approval chain | single-signer / dual-signer / board-required | `advances`, `purchase_orders` | `approval_chain_id` FK | 6, 10 | executive, production, management | C-FORK-10 |

---

## 3.2 — Options (elective pathways)

Options do not gate progression but record a chosen path. Captured as nullable or default-valued columns; surfaced as settings per engagement.

| Option ID | Axis | Values | Table / column | Affected stages | Roles | Closure ticket |
|---|---|---|---|---|---|---|
| O-01 | Billing terms | direct bill / PO / pre-pay / net-15 / net-30 / net-60 / net-90 | `purchase_orders.billing_terms` enum | 4, 10 | vendor, client | C-OPT-01 |
| O-02 | Access grade | escorted / self-sufficient / restricted | `credentials.access_grade` enum | 7, 8 | talent, press, vendor | C-OPT-02 |
| O-03 | Lodging | provided / per-diem buyout / own-accommodation | `travel_bookings.lodging_mode` enum | 6 | crew, staff, talent | C-OPT-03 |
| O-04 | Transport | shuttle / rental / personal / rideshare / provided-car | `travel_bookings.transport_mode` enum | 6, 9 | crew, staff, talent | C-OPT-04 |
| O-05 | Pay cadence | per-shift / weekly / bi-weekly / event-settle | `deal_memos.pay_cadence` enum | 10 | crew, staff | C-OPT-05 |
| O-06 | Meal plan | catered / buyout / per-diem food | `per_diem.meal_mode` enum | 6, 8 | crew, staff, talent | C-OPT-06 |
| O-07 | Delivery method | vendor-deliver / crew-pickup / shipping | `purchase_orders.delivery_method` enum | 7 | vendor, management | C-OPT-07 |
| O-08 | Data rights | full / license-limited / no-retention | `photo_releases.data_rights` enum | 4, 12 | press, talent | C-OPT-08 |
| O-09 | Notification channel | email / SMS / push / radio / none | `profiles.notify_channels[]` | all | all | C-OPT-09 |
| O-10 | Rating visibility | public / private-to-management / closed | `project_role_ratings.visibility` enum | 12 | management, executive | C-OPT-10 |

---

## 3.3 — Dependencies (precondition graph)

Each dependency is a DB-enforced precondition (either `CHECK` using `role_stage_preconditions` table or trigger-enforced). Fails block state transition.

### Upstream blockers

| Dep ID | Stage | Blocked until | Affected roles | Closure ticket |
|---|---|---|---|---|
| D-01 | 3 Onboarding | stage 2 for: COI valid, W9/W8 on file, I-9 (if US), background check cleared (if role requires) | crew, staff, talent, vendor | C-DEP-01 |
| D-02 | 4 Contracting | stage 3 complete AND rate/quote matrix locked | all contracted roles | C-DEP-02 |
| D-03 | 5 Scheduling | stage 4 signed | crew, staff, talent, vendor | C-DEP-03 |
| D-04 | 6 Advancing | stage 5 has confirmed call time / slot | crew, staff, talent, vendor, sponsor | C-DEP-04 |
| D-05 | 7 Deployment | stage 6 approved (advance status = `confirmed`) AND venue permit active | all | C-DEP-05 |
| D-06 | 8 Active Ops | stage 7 checkin recorded | crew, staff, talent, vendor, press, guest, attendee | C-DEP-06 |
| D-07 | 9 Demobilization | stage 8 has no open high-severity incidents | crew, staff, vendor, management | C-DEP-07 |
| D-08 | 10 Settlement | stage 4 signed AND stage 8 timesheets / POs posted | crew, staff, talent, vendor | C-DEP-08 |
| D-09 | 11 Reconciliation | stage 10 payments cleared (Stripe webhook confirmed) | vendor, crew, staff, talent | C-DEP-09 |
| D-10 | 12 Archival | stage 11 tax export generated (if applicable) | vendor, crew, staff, talent | C-DEP-10 |
| D-11 | 13 Closeout | stage 12 complete for every role on the project | all | C-DEP-11 |

### Parallel prerequisites (AND-gate)

| Dep ID | Stage | Parallel checks required | Roles | Closure ticket |
|---|---|---|---|---|
| P-01 | 3 Onboarding | (COI valid) ∧ (W9/W8 on file) ∧ (background check if flagged) ∧ (I-9 if US) | crew, staff, talent, vendor | C-PARA-01 |
| P-02 | 7 Deployment | (venue permit active) ∧ (insurance active) ∧ (credential issued) ∧ (badge printed) | all | C-PARA-02 |
| P-03 | 10 Settlement | (timesheet approved) ∧ (PO received) ∧ (advance reconciled) ∧ (no open disputes) | vendor, crew, staff | C-PARA-03 |
| P-04 | 13 Closeout | (all role lifecycles complete) ∧ (budget reconciliation signed) ∧ (tax exports generated) | executive | C-PARA-04 |

### Downstream consumers (reverse FKs for cascade)

| Dep ID | Source | Consumers | Cascade behavior | Closure ticket |
|---|---|---|---|---|
| K-01 | `timesheets` | `paystubs`, `tax_exports`, `budget_reconciliations` | soft-delete propagates; lock when paystub issued | C-CASC-01 |
| K-02 | `purchase_orders` | `invoices`, `po_matches`, `vendor_ledgers`, `budget_reconciliations` | lock on paid; immutable on reconciled | C-CASC-02 |
| K-03 | `advances` | `advance_line_items`, `travel_bookings`, `per_diem`, `hospitality_riders` | cannot delete advance with attached bookings | C-CASC-03 |
| K-04 | `credentials` | `checkins`, `zone_access_events`, `egress_logs` | revoke cascades to access_events; immutable on egress | C-CASC-04 |
| K-05 | `project_users` | all role-scoped records | soft-delete cascades to `active` rows only; audit preserved | C-CASC-05 |

### Cross-entity dependencies (WHO × WHAT × WHERE)

| Dep ID | Dep description | Tables | Closure ticket |
|---|---|---|---|
| X-01 | Vendor deployment depends on venue zone access grant (WHO-vendor depends on WHERE-zone) | `vendors` × `zone_access_grants` | C-XFK-01 |
| X-02 | Talent green room depends on space availability (WHO-talent depends on WHERE-space) | `talent_records` × `spaces` | C-XFK-02 |
| X-03 | Equipment deployment depends on PO receipt AND dock slot (WHAT-equipment × WHO-vendor × WHERE-dock_slot) | `equipment` × `purchase_orders` × `dock_slots` | C-XFK-03 |
| X-04 | Crew deployment depends on shift AND credential AND geo-fence (WHO-crew × WHEN-shift × WHERE-zone) | `crew_members` × `shifts` × `zones` | C-XFK-04 |
| X-05 | Press pool access depends on credential AND pool slot (WHO-press × WHEN-pool_slot) | `press_credentials` × `pool_slots` | C-XFK-05 |

---

## 3.4 — Exception paths

Each exception is a distinct state transition that MUST be recordable, reversible where possible, and audit-logged.

| Exception | From state | To state | Triggering role | Side effects | Closure ticket |
|---|---|---|---|---|---|
| Cancellation (pre-deploy) | any pre-deployment | `cancelled` | `production`, `executive`, `client` | contract void, partial refund if owed, audit | C-EX-01 |
| No-show | `deployment` expected | `no_show` | system (time-based) | shift void, penalty clause trigger (if in memo), audit | C-EX-02 |
| Reassignment | `scheduling`→`deployment` | new role record, old → `reassigned` | `management` | credential reissue, notify both parties | C-EX-03 |
| Force majeure | any | `force_majeure` | `executive` | contract clause invoked, tax-event recorded, audit | C-EX-04 |
| Change order | `active_operations` | remains, but `change_order` attached | `client`, `management`, `production` | budget delta, approval chain, audit | C-EX-05 |
| Dispute | `settlement`/`reconciliation` | `disputed` | `vendor`, `client`, `executive` | payment paused, dispute SLA started, audit | C-EX-06 |
| Chargeback | `settlement` paid | `charged_back` | system (Stripe webhook) | re-opens reconciliation, audit | C-EX-07 |
| Credential revocation | `deployment`/`active_operations` | credential suspended | `management`, `executive` | zone_access revoked, audit | C-EX-08 |
| Injury / incident | `active_operations` | adds `incident_id`; may trigger demob if severity high | self, `management` | workers-comp record, OSHA log, audit | C-EX-09 |
| Tax-form correction | `reconciliation` | reopens to `settlement` | `executive` | reissue 1099/W2 corrected, audit | C-EX-10 |

Exception table closure: `C-EX-TBL` — add a single `role_lifecycle_exceptions` table with FK to `project_users.id`, typed via enum above, with RLS restricting who can raise each exception.

---

## 3.5 — Summary counts

| Category | Count | Encoded today? | Closure effort |
|---|---|---|---|
| Forks | 10 | 1 (`fulfillment_method`) | Large |
| Options | 10 | 0 | Medium |
| Upstream blockers | 11 | 0 as enforced preconditions | Large |
| Parallel prerequisites | 4 | 0 | Medium |
| Downstream cascades | 5 | Partial (FKs exist, lock rules missing) | Medium |
| Cross-entity deps | 5 | 0 | Medium |
| Exceptions | 10 + table | 0 | Large |
| **Total net-new constructs** | **55** | | |
