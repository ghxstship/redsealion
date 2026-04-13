# 🔬🪨 IRON CURTAIN × BEDROCK — 3NF SSOT Canonical Compliance Audit & Remediation Protocol

**Frozen Phoenix Prompt Library — Codebase Integrity Series**
**Prompt Code:** `FP-QA-IRONCURTAIN-3NF-001`
**Stack:** Next.js · Supabase · TypeScript · Tailwind CSS
**Scope:** Full codebase — every file, route, page, component, API endpoint, export, import, type, schema, and dependency — audited against canonical 3NF SSOT compliance
**Classification:** EXHAUSTIVE | ZERO DEFERRAL | REAL-TIME REMEDIATION | TRIPLE-PASS CERTIFICATION

---

## ═══════════════════════════════════════════════════════════════════════════
## IRON CURTAIN ENFORCEMENT LAYER
## ═══════════════════════════════════════════════════════════════════════════

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   DEAD CODE IS A LIE THE CODEBASE TELLS ITSELF.                         ║
║                                                                           ║
║   • An orphaned route is a door to a room that doesn't exist.            ║
║   • A dangling import is a promise to a module that left.                ║
║   • A legacy pattern next to a canonical one is a civil war.             ║
║   • An unused export is dead weight on every build.                      ║
║   • A backwards-compatible shim is yesterday refusing to leave.          ║
║   • A duplicated source of truth is two lies pretending to agree.        ║
║                                                                           ║
║   The codebase must speak with ONE voice.                                ║
║   Every file must earn its place in the tree.                            ║
║   Every import must resolve to a living module.                          ║
║   Every route must render a real page.                                   ║
║   Every type must trace to a single canonical definition.                ║
║                                                                           ║
║   This protocol finds every violation and kills it on sight.             ║
║   There is no "tech debt backlog." There is only "fixed" or "deleted."  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## BEHAVIORAL ENFORCEMENT RULES (NON-NEGOTIABLE)

```
RULE 1 — ZERO DEFERRAL
  Every finding is remediated THE MOMENT it is discovered.
  You do NOT catalog issues for later. You do NOT create TODO comments.
  You do NOT say "this should be addressed." You address it. Now.
  There is no Phase 2. There is no follow-up ticket. There is no backlog.
  Find it. Fix it. Verify the fix. Move on.

RULE 2 — ZERO LEGACY TOLERANCE
  If a pattern, file, function, component, route, type, or dependency
  exists solely for backwards compatibility — it is deleted.
  If both an old pattern and a new pattern coexist — the old one is deleted.
  If a migration shim, adapter, wrapper, or bridge exists to support
  a deprecated approach — it is deleted and all consumers are migrated.
  There is no grace period. There is no deprecation warning. There is only canonical.

RULE 3 — ZERO REGRESSION TOLERANCE
  Every remediation is verified IMMEDIATELY after implementation.
  If a fix introduces a new finding, that new finding is remediated
  before moving forward. The audit does not advance past broken fixes.
  TypeScript compilation must pass after every remediation.
  No file is saved in a broken state. Ever.

RULE 4 — ZERO ORPHAN TOLERANCE
  If it is not imported — it is deleted.
  If it is not routed — it is deleted.
  If it is not called — it is deleted.
  If it is not rendered — it is deleted.
  If it is not referenced by any living code path — it does not exist.
  Orphans are not "potentially useful later." They are dead weight now.

RULE 5 — SINGLE SOURCE OF TRUTH (SSOT) ABSOLUTE
  Every piece of data, every type definition, every constant, every
  configuration value exists in EXACTLY ONE canonical location.
  If the same value is defined in two places — one is deleted and
  the other is imported. No exceptions. No "convenience copies."
  The database schema is the prime authority. TypeScript types are
  generated from or mirror the schema. Application state derives
  from the database. There is one truth. Everything else is a reference.

RULE 6 — SILENT EXECUTION
  Do NOT pause to ask questions. Do NOT output progress updates.
  Do NOT ask "should I continue?" Do NOT present interim findings.
  Work autonomously from start to finish. Make reasonable decisions.
  If a judgment call is ambiguous, choose the canonical option —
  the one that reduces total code surface area and consolidates
  toward a single pattern. Output ONLY the final certification report.

RULE 7 — TRIPLE-PASS CERTIFICATION
  This audit is not complete until it passes THREE (3) consecutive
  full sweeps with ZERO findings. If Pass 2 finds anything that
  Pass 1 missed or introduced, the count resets to zero.
  Pass 1 remediates. Pass 2 verifies and catches stragglers.
  Pass 3 certifies. All three must be clean. No shortcuts.
```

---

## PRIME DIRECTIVE

You are executing **IRON CURTAIN × BEDROCK** — a total codebase compliance audit that verifies every file, route, page, component, API endpoint, export, import, type definition, database reference, and dependency against canonical 3NF Single Source of Truth standards. Every violation is remediated in real-time as discovered. The only acceptable end state is a codebase where every line of code is canonical, every reference resolves, every route renders, every type traces to one definition, and three consecutive audit passes return zero findings.

---

## PHASE 1 — FILESYSTEM CENSUS & DEAD CODE ELIMINATION

**Objective:** Map every file in the codebase. Identify and delete every file that is not imported, referenced, routed, or rendered by any living code path.

### 1A — Full Tree Inventory
```
Recursively catalog every file in:
├── src/app/          (pages, layouts, routes, API routes)
├── src/components/   (UI components)
├── src/lib/          (utilities, hooks, helpers, clients)
├── src/types/        (type definitions)
├── src/config/       (configuration, constants)
├── src/stores/       (state management)
├── src/styles/       (global styles, tokens)
├── supabase/         (migrations, seeds, functions, types)
├── public/           (static assets)
└── root config       (next.config, tailwind.config, tsconfig, etc.)

For EVERY file, determine:
  → Is this file imported by another file? (trace the import graph)
  → Is this file a route/page that Next.js renders? (app router convention)
  → Is this file a configuration file consumed by a tool? (next.config, etc.)
  → Is this file a migration consumed by Supabase CLI?
  → Is this file a public asset referenced in code or markup?

If the answer to ALL of the above is NO → DELETE THE FILE.
```

### 1B — Export Audit
```
For EVERY exported symbol (function, component, type, constant, class):
  → Is this export imported ANYWHERE in the codebase?
  → If NO → remove the export.
  → If removing the export makes the file empty → DELETE THE FILE.
  → If the export is a barrel re-export (index.ts) → verify every
    re-exported symbol is consumed. Remove dead re-exports.
```

### 1C — Import Audit
```
For EVERY import statement in EVERY file:
  → Does the imported module exist?
  → Is the imported symbol actually used in this file?
  → If imported but unused → remove the import.
  → If the import path is aliased → verify the alias resolves.
  → If the import uses a relative path where an alias exists → convert to alias.
  → If multiple files import the same thing through different paths → canonize to ONE path.
```

---

## PHASE 2 — ROUTE & PAGE INTEGRITY

**Objective:** Verify every route renders a real page, every page is reachable, and no orphaned routes or pages exist.

### 2A — Route Map
```
Build the complete route tree from src/app/:
  → Every page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx
  → Every route.ts (API routes)
  → Every route group (parenthetical directories)
  → Every dynamic segment ([param], [...catchAll], [[...optional]])

For EVERY route:
  → Does the page component render without errors?
  → Is this route reachable via navigation from at least one other page?
  → Is this route referenced in any navigation component, link, or redirect?
  → If an API route → is it called by any client-side code?
  → If unreachable and uncalled → DELETE IT.
```

### 2B — Navigation Integrity
```
For EVERY <Link>, router.push(), redirect(), useRouter() call:
  → Does the target route exist?
  → Does the target route render a real page (not a 404)?
  → If the route doesn't exist → fix the reference or delete the link.
  → Are there any hardcoded route strings that should be constants?
    → If yes → extract to a canonical route constants file (SSOT).
```

### 2C — API Endpoint Integrity
```
For EVERY API route in src/app/api/:
  → Is this endpoint called by any client-side code?
  → Does the endpoint handler reference valid database tables/columns?
  → Does the endpoint return types that match what the client expects?
  → If uncalled → DELETE IT.
  → If the database reference is stale → fix or delete.
```

---

## PHASE 3 — TYPE SYSTEM & SSOT COMPLIANCE

**Objective:** Verify every type definition exists in exactly one canonical location. Eliminate all duplicate, shadow, inline, or drift type definitions.

### 3A — Type Census
```
Catalog EVERY type, interface, and enum across:
  → src/types/          (canonical home)
  → supabase/           (generated database types)
  → Inline in components (type Props = {...})
  → Inline in lib files  (type Options = {...})
  → Inline in API routes (type RequestBody = {...})

RULE: Database entity types are derived from Supabase generated types.
RULE: Component prop types live adjacent to their component ONLY if
      they are not shared. If used by 2+ components → extract to src/types/.
RULE: If the same shape is defined in two places → consolidate to one.
```

### 3B — Type Drift Detection
```
For every type that mirrors a database table:
  → Compare field names, types, and nullability against the schema.
  → If the TypeScript type has fields the table doesn't → remove them.
  → If the table has fields the TypeScript type doesn't → add them.
  → If nullability doesn't match → fix the TypeScript type.
  → If the type is manually defined but could be derived from
    Supabase generated types → replace with the generated type
    or an extension of it.
```

### 3C — Constant & Configuration SSOT
```
For every hardcoded string, number, or configuration value:
  → Is this value defined in more than one place?
  → If yes → consolidate to src/config/ and import everywhere.
  → Are there magic numbers or magic strings? → extract to named constants.
  → Are environment variables accessed in more than one file?
    → If yes → centralize in a config module with validation.
```

---

## PHASE 4 — DATABASE SCHEMA 3NF COMPLIANCE

**Objective:** Verify every table, column, relationship, constraint, and index conforms to Third Normal Form with zero redundancy.

### 4A — Normalization Audit
```
For EVERY table:
  1NF — Every column holds atomic values.
    → No arrays-as-strings. No CSV-in-a-column. No multi-value fields.
    → JSONB columns must have documented schemas or be typed.
  2NF — Every non-key column depends on the ENTIRE primary key.
    → No partial dependencies in composite-key junction tables.
  3NF — No transitive dependencies.
    → If column A determines column B, and column B determines column C,
       then C should NOT be in this table — it belongs in B's table.
    → Denormalized columns are ONLY acceptable with:
       a) A documented performance justification
       b) A trigger that keeps them in sync
       c) A comment explaining why
    → If a denormalized column exists without all three → normalize it.
```

### 4B — Foreign Key & Relationship Integrity
```
For EVERY foreign key:
  → Does the referenced table and column exist?
  → Is ON DELETE behavior correct? (CASCADE vs SET NULL vs RESTRICT)
  → Are there implicit relationships (matching column names) without
    formal FK constraints? → Add the constraint.
  → Are there orphaned junction tables? → Delete them.
  → Are there circular dependencies? → Document or restructure.
```

### 4C — Index & Constraint Audit
```
  → Every FK column has an index.
  → Every column used in WHERE clauses has an index.
  → No redundant indexes (prefix duplicates).
  → Every NOT NULL constraint matches the application's requirements.
  → Every UNIQUE constraint matches business rules.
  → Every CHECK constraint validates what it claims to.
  → created_at / updated_at exist on every table with triggers.
```

---

## PHASE 5 — DEPENDENCY & PACKAGE HYGIENE

**Objective:** Every dependency is used. Every dependency is current. No duplicate functionality.

```
For EVERY package in package.json:
  → Is this package imported ANYWHERE in the codebase?
  → If NO → uninstall it.
  → Are there two packages that do the same thing? → consolidate to one.
  → Are devDependencies correctly separated from dependencies?
  → Are there packages imported dynamically that aren't in package.json?
```

---

## PHASE 6 — PATTERN CANONIZATION

**Objective:** The codebase uses exactly ONE pattern for each concern. No pattern duplication.

```
AUDIT EACH CATEGORY — if multiple patterns coexist, consolidate to ONE:

  Data Fetching:    Server Components vs. useEffect vs. React Query vs. SWR
  State Management: Zustand vs. Context vs. useState vs. Redux
  Form Handling:    React Hook Form vs. native forms vs. custom hooks
  Validation:       Zod vs. Yup vs. manual vs. inline
  Styling:          Tailwind tokens vs. inline styles vs. CSS modules vs. raw values
  API Layer:        Server Actions vs. Route Handlers vs. direct Supabase calls
  Auth Checks:      Middleware vs. per-page vs. per-component vs. per-API-route
  Error Handling:   Error boundaries vs. try/catch vs. .catch() vs. silent failures
  Date Handling:    date-fns vs. dayjs vs. moment vs. native Date
  ID Generation:    uuid vs. nanoid vs. cuid vs. database-generated

For each: identify the CANONICAL pattern. Delete all others.
Migrate all consumers to the canonical pattern. No coexistence.
```

---

## PHASE 7 — COMPONENT ARCHITECTURE COMPLIANCE

**Objective:** Every component follows the canonical architecture. No structural drift.

```
For EVERY component:
  → Does it follow the canonical file structure?
  → Are props typed (not using `any`)?
  → Is `any` used ANYWHERE? → Replace with a proper type.
  → Are there components that duplicate functionality? → Merge them.
  → Are there wrapper components that add no value? → Remove them.
  → Are there components that render conditionally but the condition
    is always true/false? → Remove the dead branch.
  → Are there commented-out JSX blocks? → Delete them.
  → Are there console.log / console.error statements? → Remove or
    replace with proper logging.
```

---

## CERTIFICATION — TRIPLE-PASS PROTOCOL

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   PASS 1 — REMEDIATION                                                    ║
║   Execute Phases 1–7. Fix every finding in real-time.                    ║
║   Do not advance past a finding without fixing it.                       ║
║   Output: Internal finding count (target: 0 after remediation).          ║
║                                                                           ║
║   PASS 2 — VERIFICATION                                                   ║
║   Re-execute Phases 1–7 from scratch on the remediated codebase.         ║
║   If ANY new finding is discovered:                                       ║
║     → Fix it immediately.                                                 ║
║     → RESET the pass counter. Pass 2 becomes the new Pass 1.            ║
║     → Start over.                                                         ║
║   Output: Finding count (MUST be 0 to proceed).                          ║
║                                                                           ║
║   PASS 3 — CERTIFICATION                                                  ║
║   Re-execute Phases 1–7 from scratch. Read-only. No fixes needed.        ║
║   If ANY finding exists:                                                  ║
║     → RESET to Pass 1. Start over entirely.                              ║
║   If zero findings:                                                       ║
║     → Output CERTIFICATION REPORT.                                        ║
║                                                                           ║
║   THE AUDIT IS NOT COMPLETE UNTIL 3 CONSECUTIVE CLEAN PASSES.            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## FINAL OUTPUT — CERTIFICATION REPORT

```
Upon 3 consecutive zero-finding passes, output:

═══════════════════════════════════════════════════
 IRON CURTAIN × BEDROCK — CERTIFICATION REPORT
═══════════════════════════════════════════════════

CODEBASE:        [project name]
TIMESTAMP:       [ISO 8601]
PROTOCOL:        FP-QA-IRONCURTAIN-3NF-001
PASSES:          3/3 CLEAN

PHASE RESULTS:
  Phase 1 — Filesystem & Dead Code:    ✅ CLEAN
  Phase 2 — Routes & Pages:            ✅ CLEAN
  Phase 3 — Type System & SSOT:        ✅ CLEAN
  Phase 4 — Database Schema 3NF:       ✅ CLEAN
  Phase 5 — Dependency Hygiene:        ✅ CLEAN
  Phase 6 — Pattern Canonization:      ✅ CLEAN
  Phase 7 — Component Architecture:    ✅ CLEAN

REMEDIATIONS APPLIED:
  Files Deleted:           [count]
  Files Modified:          [count]
  Exports Removed:         [count]
  Imports Fixed:           [count]
  Routes Deleted:          [count]
  Types Consolidated:      [count]
  Constants Extracted:     [count]
  Patterns Canonized:      [count]
  Dependencies Removed:    [count]
  Schema Corrections:      [count]

CANONICAL PATTERNS LOCKED:
  Data Fetching:     [chosen pattern]
  State Management:  [chosen pattern]
  Form Handling:     [chosen pattern]
  Validation:        [chosen pattern]
  Styling:           [chosen pattern]
  API Layer:         [chosen pattern]
  Auth:              [chosen pattern]
  Error Handling:    [chosen pattern]

VERDICT: CODEBASE CERTIFIED — 3NF SSOT CANONICAL COMPLIANT
═══════════════════════════════════════════════════
```

---

*Frozen Phoenix Prompt Library · GHXSTSHIP Industries LLC*