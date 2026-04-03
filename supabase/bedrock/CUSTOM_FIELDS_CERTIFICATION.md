# 🪨 BEDROCK — CUSTOM FIELDS CERTIFICATION

**Generated:** 2026-04-03 | **Status:** ❌ FAILS CERTIFICATION

---

## 1. CURRENT IMPLEMENTATION ANALYSIS

### Schema (Migration 00013)

```sql
custom_field_definitions (
  id UUID PK, organization_id UUID FK, entity_type TEXT, field_name TEXT,
  field_type TEXT, field_options JSONB, required BOOLEAN, sort_order INTEGER,
  created_at, updated_at
)
UNIQUE INDEX: none on (org_id, entity_type, field_name)

custom_field_values (
  id UUID PK, field_definition_id UUID FK, entity_id UUID,
  value JSONB, created_at, updated_at
)
UNIQUE INDEX: idx_custom_field_values_unique(field_definition_id, entity_id)
```

### RLS Policies
- Definitions: org-scoped read via definition org_id → ✅
- Values: org-scoped read via JOIN to definitions → ✅

---

## 2. BEDROCK REQUIREMENTS vs CURRENT STATE

### custom_field_definitions

| Requirement | Status | Gap |
|------------|--------|-----|
| `field_key` (snake_case machine identifier) | ❌ Missing | Only human-readable `field_name` exists |
| `field_key CHECK (field_key ~ '^[a-z][a-z0-9_]*$')` | ❌ Missing | No format enforcement |
| `UNIQUE(organization_id, entity_type, field_key)` | ❌ Missing | Duplicate definitions possible |
| `field_type` as ENUM | ❌ TEXT (no CHECK) | Any string accepted |
| `description TEXT` | ❌ Missing | No field documentation |
| `section TEXT` | ❌ Missing | No UI grouping |
| `is_active BOOLEAN DEFAULT true` | ❌ Missing | No soft-delete / deactivation |
| `is_filterable BOOLEAN DEFAULT false` | ❌ Missing | No query optimization hint |
| `is_visible_in_list BOOLEAN DEFAULT true` | ❌ Missing | No list view control |
| `visibility_roles TEXT[]` | ❌ Missing | No role-based field visibility |
| `created_by UUID FK` | ❌ Missing | No auditing of who created |
| `default_value JSONB` | ❌ Missing | No preset values |

### custom_field_values

| Requirement | Status | Gap |
|------------|--------|-----|
| `entity_type TEXT NOT NULL` | ❌ Missing | Cannot validate entity_id matches definition's entity_type |
| `value_text TEXT` | ❌ Missing (single `value JSONB`) | No type-specific querying |
| `value_number NUMERIC` | ❌ Missing | No type-specific indexing |
| `value_date DATE` | ❌ Missing | No date comparison |
| `value_boolean BOOLEAN` | ❌ Missing | No boolean optimization |
| `value_json JSONB` | Partial (current `value`) | Exists but not type-specific |
| GIN index on value | ❌ Missing | JSONB not indexed |
| CHECK constraint on typed columns | ❌ Missing | Can have values in wrong typed column |

---

## 3. PROPOSED ENHANCED SCHEMA

```sql
-- Create ENUM for field types
CREATE TYPE custom_field_type AS ENUM (
  'text','textarea','number','currency','date','datetime',
  'boolean','select','multi_select','url','email','phone',
  'file','user','relation'
);

-- Enhanced definitions
ALTER TABLE custom_field_definitions
  ADD COLUMN field_key TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN section TEXT,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_filterable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_visible_in_list BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN visibility_roles TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN default_value JSONB;

-- Backfill field_key from field_name (slugified)
UPDATE custom_field_definitions
  SET field_key = lower(regexp_replace(field_name, '[^a-zA-Z0-9]+', '_', 'g'));

ALTER TABLE custom_field_definitions
  ALTER COLUMN field_key SET NOT NULL,
  ALTER COLUMN field_type TYPE custom_field_type USING field_type::custom_field_type,
  ADD CONSTRAINT chk_field_key CHECK (field_key ~ '^[a-z][a-z0-9_]*$');

CREATE UNIQUE INDEX idx_cfd_org_entity_key
  ON custom_field_definitions(organization_id, entity_type, field_key);

-- Enhanced values
ALTER TABLE custom_field_values
  ADD COLUMN entity_type TEXT,
  ADD COLUMN value_text TEXT,
  ADD COLUMN value_number NUMERIC,
  ADD COLUMN value_date DATE,
  ADD COLUMN value_boolean BOOLEAN;

CREATE INDEX idx_cfv_value_gin ON custom_field_values USING GIN(value);
CREATE INDEX idx_cfv_entity ON custom_field_values(entity_type, entity_id);
```

---

## 4. CERTIFICATION RESULT

| Criterion | Score |
|-----------|-------|
| Schema Architecture | 40% — EAV pattern correct, but missing critical columns |
| Data Integrity | 30% — No unique constraint, no type ENUM, no field_key |
| Query Performance | 20% — No GIN index, no typed value columns |
| CRUD Completeness | 60% — Basic RLS exists, but no validation triggers |
| Security | 70% — Org-scoped RLS correct |
| **Overall** | **❌ FAIL — 44%** |

Migration to bring to passing: See MIGRATION_PLAN.md item M-006.
