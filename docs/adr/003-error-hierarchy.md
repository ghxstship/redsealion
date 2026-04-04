# ADR-003: Canonical Error Hierarchy

**Status:** Accepted  
**Date:** 2026-04-03  
**Decision:** Establish typed error classes mapped to HTTP status codes.

## Context

Error handling was inconsistent — some routes returned `{ error: message }`,
others returned `{ error: message, details: internalError }`, leaking stack 
traces and database error messages to API consumers.

## Decision

Created `lib/errors.ts` with a canonical `AppError` hierarchy:

| Class | HTTP | Code | Use Case |
|-------|------|------|----------|
| ValidationError | 400 | VALIDATION_ERROR | Invalid input |
| AuthenticationError | 401 | AUTHENTICATION_ERROR | Missing/invalid auth |
| AuthorizationError | 403 | AUTHORIZATION_ERROR | Insufficient permissions |
| NotFoundError | 404 | NOT_FOUND | Resource doesn't exist |
| ConflictError | 409 | CONFLICT | Duplicate/conflicting state |
| UnprocessableError | 422 | UNPROCESSABLE | Valid syntax, invalid semantics |
| RateLimitError | 429 | RATE_LIMIT | Too many requests |
| ExternalServiceError | 502 | EXTERNAL_SERVICE_ERROR | Third-party failure |

Paired with `lib/api/response.ts` which maps AppError → HTTP status and strips
internal details from all client responses.

## Consequences

- Zero internal error details exposed to clients
- Machine-readable error codes enable client-side handling
- Consistent response envelope: `{ data, meta }` or `{ error }`
