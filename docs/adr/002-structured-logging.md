# ADR-002: Structured JSON Logging

**Status:** Accepted  
**Date:** 2026-04-03  
**Decision:** Replace all `console.log/error` with structured JSON logger.

## Context

Production logging used ad-hoc `console.log` and `console.error` calls with
inconsistent formatting, no severity levels, and no PII protection. This made
log aggregation, alerting, and compliance auditing impossible.

## Decision

Created `lib/logger.ts` providing:

- **JSON output** — machine-parseable for aggregation tools (Datadog, Logflare)
- **Severity levels** — debug, info, warn, error, fatal (controlled via `LOG_LEVEL`)
- **Service scoping** — each logger instance is namespaced (e.g., `createLogger('payments')`)
- **PII scrubbing** — automatic redaction of keys matching `password|secret|token|api_key|authorization`
- **Stack traces** — included in non-production, suppressed in production

## Consequences

- All 11 API routes migrated from console to structured logger
- Zero `console.log` or `console.error` in production code
- Log aggregation services can parse and alert on JSON fields
- PII is never written to log storage
