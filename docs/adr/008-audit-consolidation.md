# ADR-008: Dual Audit Log Architecture

## Status

**Accepted** — April 2026

## Context

The platform has two audit logging modules that initially appeared to be duplicates:

| Module | Table | Migration |
|--------|-------|-----------|
| `src/lib/audit.ts` | `audit_log` | 00014 |
| `src/lib/api/audit-logger.ts` | `audit_logs` | 00062 |

Investigation revealed these serve **different compliance scopes**:

- **`audit_log`** — Application-level operations: CRUD events on business entities (proposals, invoices, tasks, expenses, etc.)
- **`audit_logs`** — RBAC identity/security events: login, role changes, permission grants, session management (SOC2 compliance)

## Decision

**Retain both modules** with clear SSOT documentation:

1. Add comprehensive JSDoc headers to both modules explaining their scope and cross-referencing each other
2. Document the dual-table architecture in `docs/ARCHITECTURE.md`
3. Do NOT merge the modules — they serve fundamentally different compliance needs

### Guidelines for Future Development

- Use `logAuditEvent()` / `logAudit()` from `@/lib/audit` for business entity operations
- Use `logAuditAction()` from `@/lib/api/audit-logger` for identity/security/access-control events

## Consequences

- Both modules are now clearly documented with their purpose and scope
- New developers can quickly understand which audit function to call
- SOC2 audit trail remains separate from operational logging
