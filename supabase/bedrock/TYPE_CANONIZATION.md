# 🪨 BEDROCK — TYPE CANONIZATION

**Generated:** 2026-04-03

---

## 1. DATA TYPE VIOLATIONS

### 🔴 Critical Type Violations

| # | Table.Column | Current | Canonical | Issue |
|---|-------------|---------|-----------|-------|
| 1 | `assets.dimensions` | TEXT | `width_cm NUMERIC, height_cm NUMERIC, depth_cm NUMERIC` | Non-atomic, unqueryable |
| 2 | `assets.weight` | TEXT | `weight_value NUMERIC, weight_unit VARCHAR(10) DEFAULT 'lbs'` | Non-atomic |
| 3 | `esignature_requests.ip_address` | TEXT | INET | Wrong type — can't do IP operations |
| 4 | `assets.depreciation_method` | TEXT | ENUM `depreciation_method` | Unbounded string for fixed set |

### 🟡 Type Inconsistencies

| # | Table.Column | Current | Canonical | Issue |
|---|-------------|---------|-----------|-------|
| 1 | `organizations.name` | TEXT | VARCHAR(255) | Unbounded short text |
| 2 | All `name` columns (~30) | TEXT | VARCHAR(255) | Unbounded short text |
| 3 | All `title` columns (~10) | TEXT | VARCHAR(255) | Unbounded short text |
| 4 | All `email` columns (~5) | TEXT | VARCHAR(320) | Email max is 320 chars |
| 5 | All `slug` columns (~3) | TEXT | VARCHAR(100) | Slugs should be bounded |
| 6 | `users.rate_card` | TEXT | — | 🟡 Unclear purpose — document or remove |
| 7 | `webhook_endpoints.secret` | TEXT | TEXT (encrypted) | Should be stored encrypted |
| 8 | Money columns | NUMERIC(14,2) on some, bare NUMERIC on others | NUMERIC(14,2) everywhere | Inconsistent precision |

---

## 2. MISSING ENUM TYPES

### Status Columns Using VARCHAR + CHECK (Should be ENUM)

| # | Table.Column | Current Values | Proposed ENUM |
|---|-------------|---------------|---------------|
| 1 | `tasks.status` | 'todo' (default, no CHECK) | `CREATE TYPE task_status AS ENUM ('todo','in_progress','review','done','blocked','cancelled')` |
| 2 | `tasks.priority` | 'medium' (default, no CHECK) | `CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent')` |
| 3 | `expenses.status` | 'pending' + CHECK implied | `CREATE TYPE expense_status AS ENUM ('pending','approved','rejected','reimbursed')` |
| 4 | `purchase_orders.status` | 'draft' | `CREATE TYPE po_status AS ENUM ('draft','sent','acknowledged','received','cancelled')` |
| 5 | `timesheets.status` | 'draft' | `CREATE TYPE timesheet_status AS ENUM ('draft','submitted','approved','rejected')` |
| 6 | `time_off_requests.status` | 'pending' CHECK | `CREATE TYPE time_off_status AS ENUM ('pending','approved','rejected','cancelled')` |
| 7 | `change_orders.status` | 'draft' | `CREATE TYPE change_order_status AS ENUM ('draft','submitted','approved','rejected','void')` |
| 8 | `integrations.status` | 'disconnected' (NO CHECK) | `CREATE TYPE integration_status AS ENUM ('disconnected','connecting','connected','error','suspended')` |
| 9 | `crew_availability.status` | CHECK IN (...) | `CREATE TYPE availability_status AS ENUM ('available','unavailable','tentative')` |
| 10 | `crew_bookings.status` | CHECK IN (...) | `CREATE TYPE booking_status AS ENUM ('offered','accepted','declined','confirmed','cancelled')` |
| 11 | `crew_bookings.rate_type` | CHECK IN (...) | `CREATE TYPE rate_type AS ENUM ('hourly','day','overtime','per_diem','travel','flat')` |
| 12 | `equipment_reservations.status` | CHECK IN (...) | `CREATE TYPE reservation_status AS ENUM ('reserved','checked_out','returned','cancelled')` |
| 13 | `maintenance_records.type` | CHECK IN (...) | `CREATE TYPE maintenance_type AS ENUM ('repair','inspection','cleaning','calibration')` |
| 14 | `maintenance_records.status` | CHECK IN (...) | `CREATE TYPE maintenance_status AS ENUM ('scheduled','in_progress','complete','cancelled')` |
| 15 | `esignature_requests.status` | CHECK IN (...) | `CREATE TYPE esign_status AS ENUM ('pending','viewed','signed','declined','expired')` |
| 16 | `leads.status` | CHECK IN (...) | `CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','converted','lost')` |
| 17 | `payment_links.status` | CHECK IN (...) | `CREATE TYPE payment_link_status AS ENUM ('active','paid','expired')` |
| 18 | `onboarding_documents.type` | CHECK IN (...) | `CREATE TYPE onboarding_doc_type AS ENUM ('w9','nda','i9','direct_deposit','emergency_contact','other')` |
| 19 | `onboarding_documents.status` | CHECK IN (...) | `CREATE TYPE onboarding_doc_status AS ENUM ('pending','uploaded','verified','rejected')` |
| 20 | `warehouse_transfers.status` | CHECK IN (...) | `CREATE TYPE transfer_status AS ENUM ('pending','in_transit','received','cancelled')` |
| 21 | `custom_field_definitions.field_type` | TEXT (no CHECK) | `CREATE TYPE custom_field_type AS ENUM ('text','textarea','number','currency','date','datetime','boolean','select','multi_select','url','email','phone','file','user','relation')` |

### Existing ENUM Types (Correct ✅)

| ENUM Type | Used By | Status |
|-----------|---------|--------|
| `subscription_tier` | organizations | ✅ |
| `org_role` | users | ✅ |
| `proposal_status` | proposals | ✅ |
| `phase_status` | phases | ✅ |
| `milestone_status` | milestone_gates | ✅ |
| `requirement_status` | milestone_requirements | ✅ |
| `requirement_assignee` | milestone_requirements | ✅ |
| `terms_document_status` | terms_documents | ✅ |
| `invoice_type` | invoices | ✅ |
| `invoice_status` | invoices | ✅ |
| `asset_status` | assets | ✅ |
| `asset_condition` | assets, equipment_reservations | ✅ |
| `actor_type` | activity_log | ✅ |
| `contact_role` | client_contacts | ✅ |
| `creative_reference_type` | creative_references | ✅ |
| `deal_stage` | deals, proposals | ✅ |

---

## 3. MISSING CONSTRAINTS

### CHECK Constraints Needed

| # | Table.Column | Constraint | Priority |
|---|-------------|-----------|----------|
| 1 | `deals.probability` | ✅ Already has CHECK(0-100) | Done |
| 2 | `resource_allocations` | `CHECK (end_date >= start_date)` | High |
| 3 | `equipment_reservations` | `CHECK (reserved_until >= reserved_from)` | High |
| 4 | `time_off_requests` | `CHECK (end_date >= start_date)` | High |
| 5 | `crew_bookings` | `CHECK (shift_end >= shift_start)` | High (comparing TIMESTAMPTZ) |
| 6 | `proposals` | `CHECK (valid_until >= prepared_date)` | Medium |
| 7 | `invoices.subtotal` | `CHECK (subtotal >= 0)` | Medium |
| 8 | `invoices.total` | `CHECK (total >= 0)` | Medium |
| 9 | `invoices.tax_amount` | `CHECK (tax_amount >= 0)` | Medium |
| 10 | `time_off_requests.days_requested` | `CHECK (days_requested > 0)` | Medium |
| 11 | `time_off_balances` | `UNIQUE(user_id, policy_id, year)` | High |

### NOT NULL Audit (Missing NOT NULLs)

| # | Table.Column | Should Be | Reason |
|---|-------------|----------|--------|
| 1 | `deals.owner_id` | NOT NULL | Every deal should have an owner |
| 2 | `tasks.status` | ✅ NOT NULL | Correct |
| 3 | `leads.assigned_to` | NULL ok | Not always assigned initially |
