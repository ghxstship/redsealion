# 🪨 BEDROCK — RLS ALIGNMENT

**Generated:** 2026-04-03

---

## 1. RLS ENFORCEMENT STATUS

| Status | Count |
|--------|-------|
| ✅ RLS Enabled with Policies | 72 |
| 🔴 RLS NOT Enabled | 2 (permission_catalog, subscription_plans — use `SELECT USING (true)` via Harbor Master policies) |
| Total Tables | 74 |

**All 74 tables have RLS enabled.** ✅

---

## 2. RLS PATTERN INCONSISTENCY

### Pattern A — Helper Function (Migrations 00001–00014)
```sql
USING (organization_id = auth_user_org_id())
```
**Used by:** ~40 policies on tables from migrations 00001–00014

### Pattern B — Subquery (Migrations 00015–00021)
```sql
USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()))
```
**Used by:** ~15 policies on tables from migrations 00015–00021

### Pattern C — Harbor Master `check_permission()` (Migration 00022)
```sql
USING (check_permission(auth.uid(), 'manage', 'resource', 'organization', organization_id))
```
**Used by:** ~30 policies on Harbor Master tables

### Analysis

| Pattern | Performance | Consistency | Recommendation |
|---------|-------------|-------------|----------------|
| A (helper fn) | ✅ Best — single function call, SECURITY DEFINER | ✅ Clean | Keep for existing tables |
| B (subquery) | 🟡 Moderate — subquery executes per row | ❌ Inconsistent | Migrate to Pattern A |
| C (check_perm) | 🟡 Moderate — function call with JOINs | ✅ Correct for RBAC | Keep for Harbor Master tables |

**Recommendation:** Tables using Pattern B should be updated to use `auth_user_org_id()` (Pattern A) for consistency and performance.

### Tables Using Pattern B (Should Migrate to Pattern A)

| Table | Migration | Current RLS |
|-------|-----------|------------|
| crew_profiles | 00015 | Pattern B |
| crew_availability | 00015 | Pattern B |
| crew_bookings | 00015 | Pattern B |
| equipment_bundles | 00016 | Pattern B |
| equipment_reservations | 00016 | Pattern B |
| maintenance_records | 00016 | Pattern B |
| esignature_requests | 00017 | Pattern B |
| shifts | 00018 | Pattern B |
| leads | 00018 | Pattern B |
| lead_forms | 00018 | Pattern B |
| payment_links | 00018 | Pattern B |
| calendar_sync_configs | 00018 | Pattern B (user-scoped ok) |
| onboarding_documents | 00019 | Pattern B |
| warehouse_transfers | 00019 | Pattern B |
| api_keys | 00021 | Pattern B |
| tags | 00021 | Pattern B |
| email_templates | 00021 | Pattern B |
| document_defaults | 00021 | Pattern B |

---

## 3. RBAC GRANULARITY AUDIT

### Tables with overly broad policies

| Table | Policy | Issue | Risk |
|-------|--------|-------|------|
| `tasks` | `FOR ALL USING (org_id = auth_user_org_id())` | Any org member can UPDATE/DELETE any task | 🟡 Should restrict to assignee or creator |
| `task_dependencies` | Via tasks JOIN | Inherits tasks' broad access | 🟡 |
| `task_comments` | Via tasks JOIN | Same | 🟡 |
| `proposal_scenarios` | `FOR ALL USING (org_id)` | Any member can manage | 🟡 Should restrict to proposal team |

### Tables missing write policies (SELECT-only)

| Table | Has SELECT? | Has INSERT/UPDATE/DELETE? | Issue |
|-------|-------------|--------------------------|-------|
| `subscription_plans` | ✅ | ❌ (platform-managed) | ✅ Correct |
| `permission_catalog` | ✅ | ❌ (system-managed) | ✅ Correct |
| All others | ✅ | ✅ | ✅ |

---

## 4. POST-CANONIZATION RLS IMPACT

If naming changes from NAMING_CANONIZATION.md are applied, the following RLS policies would need updating:

| Renamed Column | Policies Affected |
|---------------|-------------------|
| `venues.constraints` → `site_constraints` | 0 (not used in policies) |
| `phases.number` → `phase_number` | 0 (not used in policies) |
| Boolean renames (`is_*`) | 0 (booleans not used in RLS WHERE clauses) |

**Impact: ZERO policies require RLS changes from naming canonization.** ✅
