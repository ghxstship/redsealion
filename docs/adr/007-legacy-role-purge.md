# ADR-007: Legacy Role Purge (manager / team_member → collaborator)

## Status

**Accepted** — April 2026

## Context

During the platform's evolution from 7 roles to a 10-role architecture, two intermediate roles — `manager` and `team_member` — were created to handle project management and standard team access respectively. These roles were later merged into a single `collaborator` role that covers the full internal-user permission surface.

However, the permission matrix in `src/lib/permissions.ts` retained the `manager` (72 lines) and `team_member` (70 lines) permission blocks as dead code. These entries:

1. Were not part of the `PlatformRole` TypeScript union type, so they could never be matched at runtime
2. Inflated the permissions module by ~140 lines of unreachable code
3. Created confusion for developers who saw role names in the matrix that didn't exist in the type system
4. Were referenced in several UI display-label maps (AdminSidebar, UserMenu, PeopleGrid, StatusBadge)

## Decision

Purge all references to `manager` and `team_member` as platform roles:

1. **Delete** the `manager` and `team_member` permission blocks from `DEFAULT_PERMISSIONS`
2. **Replace** legacy role labels in all UI display maps with the canonical 10-role set
3. **Retain** `manager` as an advance-module collaborator role (domain-specific, not a platform role)
4. **Retain** `team_memberships` table references (RBAC schema, unrelated)

## Consequences

- The `DEFAULT_PERMISSIONS` object is now 140 lines smaller and matches the `PlatformRole` type exactly
- All UI components display the canonical role names
- The `database.ts` generated types may still contain `manager` and `team_member` in enum definitions until the next Supabase type generation after a DB migration removes them from the roles table
