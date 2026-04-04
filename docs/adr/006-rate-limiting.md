# ADR-006: Rate Limiting Middleware

**Status:** Accepted  
**Date:** 2026-04-03  
**Decision:** Implement tiered rate limiting via reusable middleware.

## Context

All API routes were unprotected against abuse — no rate limiting existed,
leaving the application vulnerable to brute-force attacks on auth endpoints,
denial-of-service via write-heavy routes, and excessive read load.

## Decision

Created `lib/middleware/rate-limit.ts` with:

- **Tiered configuration:**
  - Auth endpoints: 10 req/min (strict)
  - Write endpoints: 60 req/min (moderate)
  - Read endpoints: 120 req/min (relaxed)
  - Webhook endpoints: 200 req/min (high throughput)

- **In-memory sliding window** with periodic GC
- **Standard headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **429 response** with `Retry-After` header
- **`withRateLimit()` HOF** for wrapping route handlers

## Consequences

- Route handlers can opt into rate limiting via `withRateLimit(RATE_LIMITS.write, handler)`
- In-memory store is per-process — for multi-instance deployments, swap to Redis/Upstash
- GC runs lazily every 60s to prevent memory leaks
