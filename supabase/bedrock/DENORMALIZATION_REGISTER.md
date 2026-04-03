# 🪨 BEDROCK — DENORMALIZATION REGISTER

**Generated:** 2026-04-03 | **Registered Denormalizations:** 26

---

## RULES
- Every denormalized column MUST be in this register
- Every entry MUST have a maintenance mechanism (trigger)
- Every entry MUST have a reconciliation query
- Reconciliation queries should run periodically to detect drift

---

## org_id Denormalizations (RLS Performance)

| # | Table.Column | Source of Truth | Maintenance | Reconciliation Query |
|---|-------------|-----------------|-------------|---------------------|
| 1 | `invoices.organization_id` | `proposals.organization_id` via `proposal_id` | TRIGGER: on INSERT copy from proposals | `SELECT i.id FROM invoices i JOIN proposals p ON i.proposal_id=p.id WHERE i.organization_id!=p.organization_id` |
| 2 | `assets.organization_id` | `proposals.organization_id` via `proposal_id` | TRIGGER: on INSERT copy | Same pattern |
| 3 | `activity_log.organization_id` | `proposals.organization_id` via `proposal_id` | TRIGGER: on INSERT copy | Same pattern |
| 4 | `deal_activities.organization_id` | `deals.organization_id` via `deal_id` | TRIGGER: on INSERT copy | `SELECT da.id FROM deal_activities da JOIN deals d ON da.deal_id=d.id WHERE da.organization_id!=d.organization_id` |
| 5 | `client_interactions.organization_id` | `clients.organization_id` via `client_id` | TRIGGER: on INSERT | Same pattern |
| 6 | `invoice_payments.organization_id` | `invoices.organization_id` via `invoice_id` | TRIGGER: on INSERT | Same pattern |
| 7 | `integration_sync_log.organization_id` | `integrations.organization_id` via `integration_id` | TRIGGER: on INSERT | Same pattern |
| 8 | `automation_runs.organization_id` | `automations.organization_id` via `automation_id` | TRIGGER: on INSERT | Same pattern |
| 9 | `credit_notes.organization_id` | `invoices.organization_id` via `invoice_id` | TRIGGER: on INSERT | Same pattern |
| 10 | `change_orders.organization_id` | `proposals.organization_id` via `proposal_id` | TRIGGER: on INSERT | Same pattern |
| 11 | `project_budgets.organization_id` | `proposals.organization_id` via `proposal_id` | TRIGGER: on INSERT | Same pattern |
| 12 | `budget_alerts.organization_id` | `project_budgets.organization_id` via `budget_id` | TRIGGER: on INSERT | Same pattern |
| 13 | `project_costs.organization_id` | `proposals.organization_id` via `proposal_id` | TRIGGER: on INSERT | Same pattern |
| 14 | `proposal_scenarios.organization_id` | `proposals.organization_id` via `proposal_id` | TRIGGER: on INSERT | Same pattern |
| 15 | `time_off_balances.organization_id` | `users.organization_id` via `user_id` | TRIGGER: on INSERT | Same pattern |
| 16 | `time_off_requests.organization_id` | `users.organization_id` via `user_id` | TRIGGER: on INSERT | Same pattern |
| 17 | `team_memberships.organization_id` | `teams.organization_id` via `team_id` | TRIGGER: on INSERT | Same pattern |
| 18 | `project_memberships.organization_id` | `projects.organization_id` via `project_id` | TRIGGER: on INSERT | Same pattern |
| 19 | `email_notifications.organization_id` | Standalone (polymorphic entity) | SET ON INSERT | N/A — no derivable parent |

---

## Computed/Cached Value Denormalizations

| # | Table.Column | Source of Truth | Maintenance | Reconciliation Query |
|---|-------------|-----------------|-------------|---------------------|
| 20 | `proposals.total_value` | SUM(phase_investment) FROM phases | TRIGGER on phases INSERT/UPDATE/DELETE | `SELECT p.id, p.total_value, COALESCE(SUM(ph.phase_investment),0) as actual FROM proposals p LEFT JOIN phases ph ON ph.proposal_id=p.id GROUP BY p.id HAVING p.total_value != COALESCE(SUM(ph.phase_investment),0)` |
| 21 | `proposals.total_with_addons` | total_value + SUM(selected addons) | TRIGGER on phase_addons INSERT/UPDATE/DELETE | Similar to above including selected addons |
| 22 | `project_budgets.spent` | SUM(amount) FROM project_costs WHERE proposal_id | TRIGGER on project_costs INSERT/UPDATE/DELETE | `SELECT pb.id, pb.spent, COALESCE(SUM(pc.amount),0) FROM project_budgets pb LEFT JOIN project_costs pc ON pc.proposal_id=pb.proposal_id GROUP BY pb.id HAVING pb.spent != COALESCE(SUM(pc.amount),0)` |
| 23 | `automations.run_count` | COUNT(*) FROM automation_runs | TRIGGER on automation_runs INSERT/DELETE | `SELECT a.id, a.run_count, COUNT(ar.id) FROM automations a LEFT JOIN automation_runs ar ON ar.automation_id=a.id GROUP BY a.id HAVING a.run_count != COUNT(ar.id)` |
| 24 | `email_threads.message_count` | COUNT(*) FROM email_messages | TRIGGER on email_messages INSERT/DELETE | Same pattern |
| 25 | `assets.deployment_count` | COUNT(*) FROM equipment_reservations WHERE status='checked_out' | TRIGGER on equipment_reservations | Same pattern |
| 26 | `invite_codes.current_uses` | COUNT(*) FROM invite_code_redemptions | TRIGGER on invite_code_redemptions INSERT/DELETE | `SELECT ic.id, ic.current_uses, COUNT(icr.id) FROM invite_codes ic LEFT JOIN invite_code_redemptions icr ON icr.invite_code_id=ic.id GROUP BY ic.id HAVING ic.current_uses != COUNT(icr.id)` |

---

## Status: NO MAINTENANCE TRIGGERS CURRENTLY EXIST

> [!CAUTION]
> None of the 26 registered denormalizations have database-level triggers to maintain consistency. All are currently maintained by application code (or not at all). This is the highest-priority remediation item in the MIGRATION_PLAN.
