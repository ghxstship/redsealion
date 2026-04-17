# Phase 2 — Lifecycle Journey Maps

Per-role traversal of the 13 canonical stages. Each row specifies:

- **SoR** — System of Record (canonical table)
- **Inputs** — required data/artifacts to enter the stage
- **State** — `role_lifecycle_state` enum value + scoped sub-state column
- **Actors** — which project roles may transition the record
- **Outputs** — artifacts / records created on exit
- **Trigger** — code path or DB trigger that executes on entry
- **Notify** — notification channel(s) fired
- **Audit** — audit record written to `hierarchy_status_log` (or role-scoped log)

Stage index — 1.Discovery · 2.Qualification · 3.Onboarding · 4.Contracting · 5.Scheduling · 6.Advancing · 7.Deployment · 8.Active Operations · 9.Demobilization · 10.Settlement · 11.Reconciliation · 12.Archival · 13.Closeout

RLS pattern per stage: all transitions must write to `project_role_events(project_id, user_id, role, from_state, to_state, actor_id, actor_role, at, reason)` — new table, closure ticket `C-STATE-01`.

---

## 1. Executive

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `org_users` | platform invite, org membership | `discovery` | `owner`, `admin` | invitation row | `accept_invitation()` RPC | email, in-app | invitations table |
| 2 | Qualification | `auth.users` + `auth_settings` | MFA enrolled, email verified | `qualification` | self, `admin` | MFA enrollment | `mfa_enroll_trigger` | email | audit_log |
| 3 | Onboarding | `project_users` | role assignment | `onboarding` | `production`, `owner` | `project_users` row | `project_users_after_insert` | in-app | `project_role_events` |
| 4 | Contracting | `msa_agreements` (new) | MSA template, signer | `contracting` | `executive`, counterparty | signed MSA PDF | e-sign webhook | email | docs, audit |
| 5 | Scheduling | `master_schedules` (view) | project schedule access | `scheduling` | `production` | read access granted | RLS policy | — | — |
| 6 | Advancing | `advances` | advance approval request | `advancing` | self, `production` | approval decision | `advance_approve_fn` | email | `hierarchy_status_log` |
| 7 | Deployment | `credentials` (new) | all-access badge generation | `deployment` | `production` | credential QR | badge print hook | in-app | credentials |
| 8 | Active Ops | `incidents` + `change_orders` | incident/CO escalation | `active_operations` | self | approval decisions | change_order approve fn | in-app | audit |
| 9 | Demobilization | `project_closeout_checklists` (new) | venue strike sign-off | `demobilization` | self, `production` | venue release doc | checklist complete trigger | email | audit |
| 10 | Settlement | `purchase_orders`, `timesheets` | aggregated settlement batch | `settlement` | self (approver) | settlement sign-off | `settlement_approve_fn` | email, Slack | audit |
| 11 | Reconciliation | `budget_reconciliations` (new) | budget-vs-actuals report | `reconciliation` | self | variance sign-off | `budget_sign_off_fn` | email | audit |
| 12 | Archival | `project_role_ratings` (new) | crew/vendor scorecards | `archival` | self | performance reviews | rating snapshot fn | — | ratings |
| 13 | Closeout | `projects.status = 'closed'` | all prior stages complete | `closeout` | self | locked project | `project_closeout_fn` + immutability trigger | email | audit, immutable |

Forks: international project → extra jurisdictional compliance (tax treaty) at stage 2.
Dependencies: stage 13 requires all project-scoped roles across all 12 slugs to have reached `closeout` or `archival`.

---

## 2. Production

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `org_users` | platform membership + invite | `discovery` | `executive`, `owner` | invitation | `invitations_insert_fn` | email | invitations |
| 2 | Qualification | `auth.users`, `profiles.credentials` | resume, portfolio, references | `qualification` | `executive` | approved profile | `profile_approve_fn` | email | audit |
| 3 | Onboarding | `project_users` | project + role | `onboarding` | `executive` | `project_users` row, SSO provision | SSO fn | in-app | audit |
| 4 | Contracting | `contracts` | producer agreement template | `contracting` | `executive`, self | signed contract | e-sign webhook | email | docs |
| 5 | Scheduling | `master_schedules` | calendar permissions | `scheduling` | self | schedule build rights | RLS | — | — |
| 6 | Advancing | `advances`, `advance_line_items` | rider, tech pack | `advancing` | self | approved advance, PO issuance | `advance_approve_fn` | email | `hierarchy_status_log` |
| 7 | Deployment | `credentials`, `manifest` | prod-tier badge, vehicle pass | `deployment` | `management` | issued credential | badge fn | in-app | credentials |
| 8 | Active Ops | `tasks`, `incidents`, `change_orders` | real-time production | `active_operations` | self, `management`, `crew` | task closure, CO approvals | change_order_approve_fn | in-app, Slack | audit |
| 9 | Demobilization | `work_orders`, `damage_reports` (new) | strike plan executed | `demobilization` | self | strike sign-off | work_order_complete_fn | email | audit |
| 10 | Settlement | `timesheets`, `purchase_orders`, `invoices` | line-item settlement pack | `settlement` | self, `executive` (approver) | settlement draft | batch_settle_fn | email | audit |
| 11 | Reconciliation | `budget_reconciliations`, `tax_exports` | PO match, 1099 staging | `reconciliation` | self, `executive` | reconciliation pack | recon_fn | email | audit |
| 12 | Archival | `project_role_ratings` | crew/vendor ratings | `archival` | self | rating snapshot | rating fn | — | ratings |
| 13 | Closeout | `project_role_assignments` | post-mortem doc | `closeout` | `executive` | locked | immutability trigger | email | immutable |

Options: volunteer production (nonprofit) → stage 4 skipped; replaced by volunteer release.
Dependencies: 6 → 7 gated on rider sign-off; 8 → 9 requires all crew demobilized.

---

## 3. Management

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `org_users` | invite, dept assignment | `discovery` | `production` | invitation | invitation_fn | email | invitations |
| 2 | Qualification | `profiles.credentials` | bgc, ID, references | `qualification` | `production` | verified profile | verify_fn | email | audit |
| 3 | Onboarding | `project_users` | project role | `onboarding` | `production` | member row, dept assign | onboard_fn | in-app | audit |
| 4 | Contracting | `contracts` | employment agreement | `contracting` | self | signed agreement | e-sign | email | docs |
| 5 | Scheduling | `shifts`, `call_sheets` | shift plan input | `scheduling` | self | shift grid | shift_build_fn | in-app | audit |
| 6 | Advancing | `advances`, `logistics_plans` | vendor coordination | `advancing` | self | logistics pack | logistics_fn | email | audit |
| 7 | Deployment | `credentials`, `manifest` | mgmt-tier badge | `deployment` | self | credential, key set | badge fn | in-app | credentials |
| 8 | Active Ops | `incidents`, `shifts`, `equipment_transfers` | ops running | `active_operations` | self, crew, staff | shift close, incident resolve | shift_close_fn | Slack | audit |
| 9 | Demobilization | `work_orders`, `return_manifests` | strike phase | `demobilization` | self | return BOL | return_fn | email | audit |
| 10 | Settlement | `timesheets`, `po_receipts` | timesheet batch approve | `settlement` | self | approved timesheets | timesheet_approve_fn | email | audit |
| 11 | Reconciliation | `po_matches` (new) | 3-way match result | `reconciliation` | self | PO match report | po_match_fn | email | audit |
| 12 | Archival | `project_role_ratings` | team ratings | `archival` | self | ratings | rating fn | — | ratings |
| 13 | Closeout | `project_role_assignments` | dept closeout | `closeout` | `production` | locked | immutability trigger | email | immutable |

Forks: union-signatory event → IATSE steward coordination at stage 5.
Dependencies: 10 requires all crew timesheets submitted and approved.

---

## 4. Crew

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `crew_applications` + `uac_roster` | referral, catalog lookup, inbound application | `discovery` | `management`, `production` | application row | application_fn | email | applications |
| 2 | Qualification | `crew_credentials` (COI, W9/W8, union card, I-9) | documents uploaded | `qualification` | `management` | verified record | verification_fn | email | compliance_documents |
| 3 | Onboarding | `crew_members`, `project_users`, `direct_deposit_records` | accepted offer | `onboarding` | self | profile, DD setup | onboarding_fn | email, in-app | audit |
| 4 | Contracting | `deal_memos` | short form / deal memo | `contracting` | self, `management` | signed memo | e-sign webhook | email | docs |
| 5 | Scheduling | `shifts`, `call_sheets` | assigned shift | `scheduling` | `management` | shift row, RRULE-expanded instances | shift_assign_fn | email, push | audit |
| 6 | Advancing | `travel_bookings`, `lodging`, `per_diem` | travel needs declared | `advancing` | `management` | booking refs | advance_fn | email | audit |
| 7 | Deployment | `credentials`, `checkins` | arrival, geo-fence | `deployment` | self | credential, checkin row | checkin_fn (mobile) | push | checkins |
| 8 | Active Ops | `timesheets`, `tasks`, `incidents` | on-shift | `active_operations` | self, `management` | timesheet entries, task updates | clock_in/out, incident_log | push | audit |
| 9 | Demobilization | `checkouts`, `equipment_returns` | strike complete | `demobilization` | self | checkout row, return BOL | checkout_fn | push | audit |
| 10 | Settlement | `timesheets` → `paystubs` | timesheet approved | `settlement` | `management` | paystub | payroll_fn | email | audit |
| 11 | Reconciliation | `tax_exports` | 1099/W2 staging | `reconciliation` | `management` | tax form | tax_export_fn | email | audit |
| 12 | Archival | `crew_ratings`, `recall_pool` (new) | rating submitted | `archival` | `management` | rating, pool entry | recall_fn | — | ratings |
| 13 | Closeout | read-only past earnings | stage 12 complete | `closeout` | self (read) | — | immutability trigger | — | immutable |

Forks: 1099 / W2 / corp-to-corp at stage 2 gates document set.
Options: travel buyout vs provided lodging at stage 6.
Dependencies: 5 blocked by 2+3+4; 10 blocked by 4+8.

---

## 5. Staff

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `staff_applications`, agency placements | application/placement | `discovery` | `management` | application | application_fn | email | applications |
| 2 | Qualification | `staff_credentials` | ID, I-9, TIPS if bar staff | `qualification` | `management` | verified | verification_fn | email | compliance_documents |
| 3 | Onboarding | `staff_members`, `project_users` | accepted | `onboarding` | self | profile | onboarding_fn | email | audit |
| 4 | Contracting | `agency_agreements` or `shift_agreements` | agency MSA or direct | `contracting` | `management` | signed | e-sign | email | docs |
| 5 | Scheduling | `shifts`, `call_sheets` | shift assigned | `scheduling` | `management` | shift row | shift_assign_fn | push | audit |
| 6 | Advancing | `per_diem`, `transport_slots` | per diem/transport | `advancing` | `management` | booking refs | advance_fn | push | audit |
| 7 | Deployment | `checkins`, `credentials` | arrival | `deployment` | self | checkin | checkin_fn | push | checkins |
| 8 | Active Ops | `tasks`, `incidents` | on-duty | `active_operations` | self, `management` | task updates | task_update_fn | push | audit |
| 9 | Demobilization | `checkouts` | off-duty | `demobilization` | self | checkout | checkout_fn | push | audit |
| 10 | Settlement | `timesheets` → `paystubs`/`agency_invoices` | timesheet approved | `settlement` | `management` | paystub or agency invoice | settle_fn | email | audit |
| 11 | Reconciliation | `tax_exports` or `ap_records` | 1099 / agency AP | `reconciliation` | `management` | tax/AP doc | recon_fn | email | audit |
| 12 | Archival | `staff_ratings`, `recall_pool` | rating | `archival` | `management` | rating | recall_fn | — | ratings |
| 13 | Closeout | read-only | — | `closeout` | self (read) | — | immutability | — | immutable |

Forks: agency-placed vs direct-hire at stage 4 (very different contracting + AP).

---

## 6. Talent

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `pipeline` (deals) + `agency_contacts` | agency pitch / direct booking | `discovery` | `production` | deal | pipeline_fn | email | deals |
| 2 | Qualification | `talent_records` | avail hold, contract vetting | `qualification` | `production` | hold record | hold_fn | email | audit |
| 3 | Onboarding | `talent_records` + `project_users` + concierge profile | deal closed | `onboarding` | `production`, concierge | concierge portal | onboarding_fn | email | audit |
| 4 | Contracting | `performance_agreements`, `riders` | long-form PA + rider | `contracting` | self, `executive` | signed PA + rider | e-sign | email | docs |
| 5 | Scheduling | `call_times`, `green_rooms` | call time fixed | `scheduling` | `production` | call sheet entry, GR assignment | schedule_fn | email | audit |
| 6 | Advancing | `hospitality_riders`, `transport_bookings` | rider fulfillment | `advancing` | `management` | rider tracker | rider_fn | email | audit |
| 7 | Deployment | `credentials`, `escort_assignments` (new) | arrival, escort | `deployment` | `management` | VIP credential | escort_fn | push | credentials |
| 8 | Active Ops | `stage_cues`, `incidents` | performance running | `active_operations` | `production` | cue log | stage_mgmt_fn | radio/app | audit |
| 9 | Demobilization | `departure_logistics` | wrap | `demobilization` | `management` | transit manifest | departure_fn | push | audit |
| 10 | Settlement | `performance_fees`, `backend_cuts` | performance complete | `settlement` | `executive` | settlement doc | settle_fn | email | audit |
| 11 | Reconciliation | `media_deliverables`, `royalty_records` | proof of performance | `reconciliation` | `executive` | delivered media | recon_fn | email | audit |
| 12 | Archival | `signed_releases`, `media_assets` | retention policy | `archival` | `production` | archive bundle | archive_fn | — | audit |
| 13 | Closeout | `talent_relationships` | handed to Sales | `closeout` | `executive` | relationship row | handoff_fn | email | immutable |

Forks: international talent → visa (P-1/O-1), tax treaty, rider translation.
Dependencies: 5 blocked by 4 (no call time without PA). 10 blocked by 8 (no fee without performance).

---

## 7. Vendor

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `vendors`, `advance_catalog_items` (UAC) | catalog lookup / RFP | `discovery` | `production`, `management` | vendor row | vendor_onboard_fn | email | audit |
| 2 | Qualification | `vendor_credentials` (COI, W9/W8, MSA) | docs uploaded | `qualification` | `management` | verified vendor | verify_fn | email | compliance_documents |
| 3 | Onboarding | `vendor_portals` (new) | vendor accepted | `onboarding` | self, `management` | portal account | portal_provision_fn | email | audit |
| 4 | Contracting | `sows`, `purchase_orders` | SOW + PO | `contracting` | `management` | signed SOW, issued PO | e-sign, po_issue_fn | email | docs, POs |
| 5 | Scheduling | `dock_slots`, `load_in_schedule` | slot reserved | `scheduling` | `management` | slot row | dock_schedule_fn | email | audit |
| 6 | Advancing | `advances`, `technical_riders`, `power_drops` | tech + logistics advance | `advancing` | `production` | approved advance | advance_approve_fn | email | `hierarchy_status_log` |
| 7 | Deployment | `bol_records` (00114), `credentials` | BOL scan, dock arrival | `deployment` | `management` | BOL row, credential | bol_scan_fn | SMS/email | bol, credentials |
| 8 | Active Ops | `change_orders`, `equipment_transfers`, `asset_maintenance` | deployment ongoing | `active_operations` | self, `management` | CO records | change_order_fn | email | audit |
| 9 | Demobilization | `return_manifests`, `damage_reports` | end of engagement | `demobilization` | `management`, self | return BOL, damage claim | return_fn | email | audit |
| 10 | Settlement | `invoices`, `po_matches`, `stripe_transfers` | 3-way match | `settlement` | `executive`, `management` | paid invoice | ap_batch_fn | email | audit |
| 11 | Reconciliation | `vendor_ledgers`, `tax_forms` | 1099-NEC / W9 validation | `reconciliation` | `executive` | 1099 | tax_export_fn | email | audit |
| 12 | Archival | `vendor_scorecards` (new), `sla_reviews` (new) | scorecard inputs | `archival` | `management` | scorecard | scorecard_fn | — | audit |
| 13 | Closeout | `vendors.status = 'archived'` | all prior complete | `closeout` | `executive` | ledger lock | immutability trigger | email | immutable |

Forks: domestic W9 vs international W8-BEN-E at stage 2.
Options: Net-30 / Net-60 / pre-pay / direct bill at stage 4.
Dependencies: 10 blocked by 4+6+7 (PO issued, advance approved, BOL received).

---

## 8. Client

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `leads` / `pipeline` | inbound / outbound sales | `discovery` | sales (`production`) | lead | lead_capture_fn | email | leads |
| 2 | Qualification | `deals` | proposal accepted | `qualification` | sales | deal | deal_close_fn | email | deals |
| 3 | Onboarding | `clients`, `client_portals` | deal closed | `onboarding` | `production` | portal account | portal_fn | email | audit |
| 4 | Contracting | `contracts`, `msa_agreements` | MSA + SOW | `contracting` | self, `executive` | signed contracts | e-sign | email | docs |
| 5 | Scheduling | read-only master schedule | contract signed | `scheduling` | — | visibility | RLS | — | — |
| 6 | Advancing | `approvals` (new) | deliverable approvals | `advancing` | self | approval decisions | approval_fn | email | audit |
| 7 | Deployment | `client_walkthrough` (new) | pre-event walkthrough | `deployment` | self, `production` | walkthrough sign-off | walkthrough_fn | email | audit |
| 8 | Active Ops | `change_orders`, `approvals` | live event decisions | `active_operations` | self | approved COs | change_order_approve_fn | email, Slack | audit |
| 9 | Demobilization | `deliverable_acceptance` (new) | sign-off on deliverables | `demobilization` | self | acceptance doc | acceptance_fn | email | audit |
| 10 | Settlement | `invoices`, `stripe_payments` | net-30 invoice | `settlement` | self | paid invoice | payment_fn | email | audit |
| 11 | Reconciliation | `final_reports` | project report | `reconciliation` | self (read) | received report | report_fn | email | audit |
| 12 | Archival | `client_ratings`, relationship record | — | `archival` | sales | rating | — | — | audit |
| 13 | Closeout | relationship renewal | project closed | `closeout` | sales | next-opportunity seed | renewal_fn | email | immutable |

---

## 9. Sponsor

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `sponsor_pipeline` (reuse `pipeline`) | sponsorship pitch | `discovery` | sales | lead | pipeline_fn | email | leads |
| 2 | Qualification | `deals` + brand fit score | scoring | `qualification` | sales, `executive` | scored deal | scoring_fn | email | audit |
| 3 | Onboarding | `sponsors`, `sponsor_portals` | deal closed | `onboarding` | `production` | portal account | portal_fn | email | audit |
| 4 | Contracting | `sponsorship_agreements`, `brand_guidelines` | sponsorship deck + guidelines | `contracting` | self, `executive` | signed deal | e-sign | email | docs |
| 5 | Scheduling | `activation_calendar` | activation slot | `scheduling` | `management` | slot | schedule_fn | email | audit |
| 6 | Advancing | `activations`, `brand_assets` | asset uploads, tech advance | `advancing` | self, `production` | approved activation | activation_approve_fn | email | audit |
| 7 | Deployment | `activation_builds`, `credentials` | build-out | `deployment` | `management` | live activation | deploy_fn | email | audit |
| 8 | Active Ops | `activation_metrics` (impressions, scans) | running | `active_operations` | self (read) | live metrics | metrics_fn | — | audit |
| 9 | Demobilization | `activation_strike` | strike | `demobilization` | `management` | strike sign-off | strike_fn | email | audit |
| 10 | Settlement | `sponsorship_invoices` | invoice | `settlement` | self | paid invoice | payment_fn | email | audit |
| 11 | Reconciliation | `activation_reports`, `proof_of_performance` | proof deck | `reconciliation` | `production`, self | delivered proof | recon_fn | email | audit |
| 12 | Archival | `sponsor_ratings`, `media_archive` | rating + assets | `archival` | sales | rating, media retention | archive_fn | — | audit |
| 13 | Closeout | relationship renewal | — | `closeout` | sales | renewal seed | renewal_fn | email | immutable |

---

## 10. Press

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `press_applications` (new) | accreditation application | `discovery` | self | application | application_fn | email | applications |
| 2 | Qualification | `press_credentials` (new) | editor letter, outlet verification | `qualification` | `production` (PR) | approved/declined | verify_fn | email | audit |
| 3 | Onboarding | `press_registrations` (new) | approved | `onboarding` | self | press kit, portal access | press_portal_fn | email | audit |
| 4 | Contracting | `photo_releases`, `embargo_agreements` | T&C + release | `contracting` | self | signed release | e-sign (checkbox) | email | docs |
| 5 | Scheduling | `press_conferences`, `pool_slots` | presser invite / pool slot | `scheduling` | `production` | RSVP | rsvp_fn | email | audit |
| 6 | Advancing | `parking_assignments`, `kit_pickup` | logistics | `advancing` | `management` | parking pass | advance_fn | email | audit |
| 7 | Deployment | `credentials`, `zone_access_grants` | arrival, badge | `deployment` | `management` | badge | badge_fn | in-app | credentials |
| 8 | Active Ops | `zone_access_events`, `media_requests` | coverage | `active_operations` | self | access logs | zone_scan_fn | — | audit |
| 9 | Demobilization | `egress_logs` | exit | `demobilization` | system | egress scan | egress_fn | — | audit |
| 10 | Settlement | n/a (no fees) | — | `settlement` | — | — | — | — | — |
| 11 | Reconciliation | `coverage_tracking` | published coverage | `reconciliation` | `production` (PR) | coverage log | coverage_fn | — | audit |
| 12 | Archival | `press_archive`, CRM update | coverage archived | `archival` | PR | archived | archive_fn | — | audit |
| 13 | Closeout | past credentials read-only | — | `closeout` | self (read) | — | immutability | — | immutable |

---

## 11. Guest

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | `guest_invitations` (new) | invitation from host | `discovery` | host (`production`/`talent`) | invite row | invite_fn | email, SMS | invitations |
| 2 | Qualification | ID check (if flagged) | optional | `qualification` | `management` | verified | verify_fn | email | audit |
| 3 | Onboarding | `guest_tickets` (new) | RSVP | `onboarding` | self | digital ticket/QR | ticket_issue_fn | email | tickets |
| 4 | Contracting | waiver / T&C checkbox | RSVP submit | `contracting` | self | acceptance log | checkbox | — | audit |
| 5 | Scheduling | `event_schedules` | event start | `scheduling` | system | notification | scheduled_job | push | — |
| 6 | Advancing | parking / VIP prelim | optional | `advancing` | `management` | parking pass | advance_fn | email | audit |
| 7 | Deployment | `guest_scans`, `credentials` | entry | `deployment` | system | wristband / lanyard | scan_fn | push | audit |
| 8 | Active Ops | `zone_access_events`, `f&b_tabs` | onsite | `active_operations` | self | zone access, tab balance | zone_scan_fn, pos_fn | — | audit |
| 9 | Demobilization | egress scan | exit | `demobilization` | system | egress log | egress_fn | — | audit |
| 10 | Settlement | `f&b_tab_settlement` | tab close | `settlement` | self | paid tab | pos_close_fn | — | audit |
| 11 | Reconciliation | aggregated capacity metric | — | `reconciliation` | system | metric | recon_fn | — | audit |
| 12 | Archival | CRM marketing update | tag for next events | `archival` | marketing | CRM row | crm_update_fn | — | audit |
| 13 | Closeout | — | — | `closeout` | — | — | — | — | immutable |

---

## 12. Attendee

| # | Stage | SoR | Inputs | State | Actors | Outputs | Trigger | Notify | Audit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discovery | ticketing platform (external FK) | ticket purchase | `discovery` | self | ticket | webhook from ticketing | email | tickets |
| 2 | Qualification | — auto | — | `qualification` | system | qualified | auto | — | — |
| 3 | Onboarding | `attendee_tickets` | — | `onboarding` | system | QR ticket | ticket_sync_fn | email | tickets |
| 4 | Contracting | T&C / liability waiver | purchase | `contracting` | self | acceptance | checkbox | — | audit |
| 5 | Scheduling | push notify doors open | — | `scheduling` | system | push | scheduled_job | push | — |
| 6 | Advancing | clear-bag / permitted items | — | `advancing` | — | info | info_fn | push | — |
| 7 | Deployment | `attendee_scans`, `general_admission_credentials` | gate scan | `deployment` | system | wristband | scan_fn | — | audit |
| 8 | Active Ops | `zone_access_events` (GA) | onsite | `active_operations` | self | zone access | zone_scan_fn | — | audit |
| 9 | Demobilization | egress | exit | `demobilization` | system | egress log | egress_fn | — | audit |
| 10 | Settlement | merch/F&B POS | tab close | `settlement` | self | — | pos_fn | — | audit |
| 11 | Reconciliation | total scan vs capacity | — | `reconciliation` | system | capacity report | recon_fn | — | audit |
| 12 | Archival | CRM marketing | opt-in | `archival` | marketing | CRM row | crm_fn | — | audit |
| 13 | Closeout | post-event survey distribution | — | `closeout` | marketing | survey email | survey_fn | email | immutable |

---

## Cross-role stage dependencies

- Stage 13 (Closeout) for `executive` cannot fire until all other 11 roles have reached `archival` or `closeout`.
- Stage 10 (Settlement) for any `vendor` cannot fire until matching `purchase_order` has been received (stage 7) and advance approved (stage 6).
- Stage 7 (Deployment) across roles is gated by the `venue.is_active` flag on the project (venue permitted + insurance active).
- Stage 4 (Contracting) is the universal gate that must precede stages 5–9 for `crew`, `staff`, `talent`, `vendor`.

Closure ticket `C-STATE-02` introduces a `role_stage_preconditions` table to encode these as DB-level CHECK constraints (or trigger functions).
