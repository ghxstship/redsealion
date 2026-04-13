# ADR-009: Rate Limiter Dual-Module Strategy

## Status

**Accepted** — April 2026

## Context

Two rate limiting modules exist:

| Module | API | Backend | Consumers |
|--------|-----|---------|-----------|
| `src/lib/api/rate-limit.ts` | `serveRateLimit()` | Upstash Redis + in-memory fallback | 6 API routes |
| `src/lib/middleware/rate-limit.ts` | `withRateLimit()` / `checkRateLimit()` | In-memory sliding window | HOC wrapper pattern |

These serve **different integration patterns**:

- **`serveRateLimit()`** — Simple inline check within route handlers. Returns `{ success, remaining }`. Used for public-facing API routes (portal, intake, referral) that need rate limiting without wrapping the entire handler.
- **`withRateLimit()`** — Higher-order function that wraps a route handler, automatically returns 429 responses with standard `X-RateLimit-*` headers. Better for routes that want automatic header injection.

## Decision

**Retain both modules** with clear SSOT documentation:

1. Add comprehensive JSDoc headers cross-referencing each module
2. Document both patterns in `docs/ARCHITECTURE.md`
3. Recommend `serveRateLimit()` for most use cases due to its simplicity and Redis backing

### Guidelines for Future Development

- For new public API routes: use `serveRateLimit()` from `@/lib/api/rate-limit`
- For routes needing automatic 429 + rate-limit headers: use `withRateLimit()` from `@/lib/middleware/rate-limit`

## Consequences

- Both modules are clearly documented with their purpose and integration pattern
- The Upstash Redis dependency remains in `package.json` for production use
- No breaking changes to existing rate-limited routes
