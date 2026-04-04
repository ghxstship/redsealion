# ADR-005: Zod Environment Validation

**Status:** Accepted  
**Date:** 2026-04-03  
**Decision:** Validate all environment variables at startup using Zod schemas.

## Context

Environment variables were accessed via bare `process.env.VAR_NAME` with no
validation. Missing or misconfigured variables caused silent runtime failures
(e.g., Stripe throwing cryptic errors when `STRIPE_SECRET_KEY` was undefined).

## Decision

Created `lib/env.ts` with two Zod schemas:

1. **Server schema** — validates 20+ server-only variables (Supabase, Stripe,
   Resend, Twilio, integrations, logging)
2. **Public schema** — validates 3 `NEXT_PUBLIC_*` variables (Supabase URL/key, app URL)

Key design choices:
- Required variables throw immediately with descriptive messages
- Optional variables have documented defaults
- `EMAIL_PROVIDER` validates against allowed enum ('console', 'resend', 'smtp')
- `INTEGRATION_ENCRYPTION_KEY` validates 64-char hex length
- Results are cached after first validation call

## Consequences

- Deployment failures are surfaced immediately, not at first request
- New environment variables must be added to the schema
- Type inference provides `ServerEnv` and `PublicEnv` types
