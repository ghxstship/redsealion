# ADR-001: Security Headers

**Status:** Accepted  
**Date:** 2026-04-03  
**Decision:** Implement comprehensive security headers via Next.js `next.config.ts`.

## Context

The application had no response security headers, leaving it vulnerable to
clickjacking, XSS, MIME sniffing, and protocol downgrade attacks.

## Decision

Added 8 security headers applied to all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com` | Prevents XSS and data injection |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS |
| X-Frame-Options | `DENY` | Prevents clickjacking |
| X-Content-Type-Options | `nosniff` | Prevents MIME sniffing |
| Referrer-Policy | `strict-origin-when-cross-origin` | Controls referrer leakage |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Restricts browser APIs |
| X-DNS-Prefetch-Control | `on` | Performance optimization |

## Consequences

- All pages are protected against common web vulnerabilities
- CSP may need updating when new external services are integrated
- HSTS preload requires domain submission to the HSTS preload list
