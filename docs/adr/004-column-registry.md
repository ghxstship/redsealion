# ADR-004: DAL Column Registry

**Status:** Accepted  
**Date:** 2026-04-03  
**Decision:** Centralize database column selections in `lib/dal/columns.ts`.

## Context

All 82+ Supabase queries used `.select('*')`, fetching every column from every
table. This over-fetches data, increases payload sizes, and makes schema changes
risky (adding a column silently changes every API response).

## Decision

Created `lib/dal/columns.ts` as the single source of truth documenting column
selections for 30+ tables. Column constants are exported as comma-separated
strings matching Supabase's `.select()` syntax.

**Important caveat:** Supabase's TypeScript SDK has a known limitation where
`.select(stringVariable)` returns `GenericStringError` instead of typed rows.
Therefore, queries continue to use `.select()` (no args) for type safety, and
the column registry serves as **documentation** of the column contract. When
Supabase adds typed string-variable selection, the constants can be used directly.

## Consequences

- 30+ table column sets documented in one file
- Schema changes are auditable — adding/removing columns requires updating the registry
- Pagination utility (`lib/dal/pagination.ts`) complements the registry
- Data export route intentionally retains `.select('*')` for full data dumps
