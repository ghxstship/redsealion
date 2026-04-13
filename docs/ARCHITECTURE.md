# FlyteDeck — Backend Architecture Guide

> Last updated: April 2026 | Next.js 16 · React 19 · Supabase · Stripe

---

## 1. Multi-Tenant Data Model

FlyteDeck is a **multi-tenant SaaS platform** where every data record is scoped to an `organization_id`. Tenant isolation is enforced at three levels:

1. **Row-Level Security (RLS)** — Every table has RLS policies that filter by the authenticated user's organization membership.
2. **API Guards** — Server-side permission checks validate organization context before any query.
3. **Middleware** — The Supabase middleware (`src/lib/supabase/middleware.ts`) enforces authentication, user status, MFA, and subscription status on every request.

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (linked to `auth.users`) |
| `organizations` | Tenant root entity |
| `organization_memberships` | User↔Org binding with role + seat type |
| `roles` | System and custom role definitions |
| `role_permissions` | Permission grants per role |
| `teams` / `team_memberships` | Team-level grouping within orgs |
| `projects` / `project_memberships` | Project-level access control |

---

## 2. Authentication Flow

```
Request → Middleware (updateSession)
  ├─ Unauthenticated + /app → Redirect /login
  ├─ Authenticated + /login → Redirect /app
  ├─ Unverified email → Redirect /verify-email
  ├─ User status check (cached 60s via fd_user_status cookie)
  │   ├─ suspended → 403 / redirect /login
  │   ├─ deactivated → redirect /reactivate
  │   └─ pending_deletion → 403 / redirect /login
  ├─ Subscription status check (cached 300s via fd_sub_status cookie)
  │   └─ cancelled/past_due → redirect /app/settings/billing
  └─ MFA enforcement (org-level auth_settings)
      └─ require_mfa + !mfa_verified → redirect /app/settings/security/mfa
```

**Implementation**: `src/lib/supabase/middleware.ts`

---

## 3. Authorization Architecture

### Two-Tier RBAC

FlyteDeck uses a **two-tier role system**:

#### Platform Roles (10 roles)

| Role | Scope | Hierarchy |
|------|-------|-----------|
| `developer` | God mode, platform engineering | 0 (highest) |
| `owner` | Organization owner, full access | 10 |
| `admin` | Organization admin, near-full access | 20 |
| `controller` | Financial controller, billing + reporting | 25 |
| `collaborator` | Standard internal user | 30 |
| `crew` | Field crew, limited operational access | 45 |
| `viewer` | Read-only internal access | 50 |
| `client` | External client (portal access) | 55 |
| `contractor` | External contractor (portal access) | 60 |
| `community` | Public/community access (minimal) | 70 |

#### Project Roles (4 roles)

| Role | Purpose |
|------|---------|
| `project_creator` | Full project control |
| `project_collaborator` | Edit + contribute |
| `project_viewer` | Read-only |
| `project_vendor` | External vendor access |

### Permission Resolution

```
1. Check DB-level grants (role_permissions table via RPC)
2. Fall back to DEFAULT_PERMISSIONS matrix (src/lib/permissions.ts)
3. Admin bypass: developer, owner → always true
4. Portal permissions: separate matrix for client/viewer portal access
```

**SSOT Files**:
- `src/lib/permissions.ts` — Default permission matrix (resource × action × role)
- `src/types/rbac.ts` — TypeScript types for RBAC/tenancy tables
- `src/lib/rbac/permissions.ts` — DB-level permission resolution

---

## 4. API Route Patterns

### Guards Pipeline

Every authenticated API route follows this guard chain:

```typescript
// src/app/api/[resource]/route.ts
import { requireAuth } from '@/lib/api/auth-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { requireTier } from '@/lib/api/tier-guard';

export async function GET(request: Request) {
  const auth = await requireAuth();               // Session validation
  const perm = await requirePermission(auth, 'resource', 'view');  // RBAC check
  await requireTier(perm, 'starter');              // Subscription check
  
  // ... business logic
}
```

### Guard Modules

| Guard | File | Purpose |
|-------|------|---------|
| Auth | `src/lib/api/auth-guard.ts` | Validates Supabase session, returns user context |
| Permission | `src/lib/api/permission-guard.ts` | Resolves role → checks permission matrix |
| Tier | `src/lib/api/tier-guard.ts` | Validates org subscription tier ≥ required |
| Portal | `src/lib/api/portal-guard.ts` | Authenticates portal token for external users |

### Response Envelope

```typescript
// Success
{ data: T }

// Error
{ error: string, details?: unknown }
```

### Error Hierarchy

| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 403 | Insufficient permissions or suspended account |
| 404 | Resource not found or not in user's org |
| 409 | Conflict (duplicate, version mismatch) |
| 422 | Validation error (Zod) |
| 429 | Rate limited |

---

## 5. Subscription & Feature Gating

### Tier Hierarchy

```
portal (free) → starter → professional → enterprise
```

### Feature Registry

Defined in `src/lib/subscription.ts`:

```typescript
const featureRegistry: Record<string, SubscriptionTier> = {
  // Portal tier (free for all)
  proposals: 'portal',
  projects: 'portal',
  tasks: 'portal',
  
  // Starter
  invoices: 'starter',
  pipeline: 'starter',
  
  // Professional
  automations: 'professional',
  integrations: 'professional',
  crew: 'professional',
  
  // Enterprise
  time_tracking: 'enterprise',
  warehouse: 'enterprise',
  ai_assistant: 'enterprise',
};
```

### Usage

```typescript
import { canAccessFeature } from '@/lib/subscription';

if (canAccessFeature(orgTier, 'automations')) {
  // Show feature
}
```

---

## 6. Security Posture

### Headers (next.config.ts)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy` — Strict CSP with Stripe + Supabase allowlists
- `Permissions-Policy` — Camera, microphone, geolocation disabled

### Rate Limiting

Two complementary modules:

| Module | Pattern | Backend |
|--------|---------|---------|
| `lib/api/rate-limit.ts` | `serveRateLimit()` inline check | Upstash Redis (prod) / In-memory (dev) |
| `lib/middleware/rate-limit.ts` | `withRateLimit()` HOC wrapper | In-memory sliding window |

### Audit Logging

Two audit tables for different compliance scopes:

| Module | Table | Scope |
|--------|-------|-------|
| `lib/audit.ts` | `audit_log` | App-level operations (CRUD on entities) |
| `lib/api/audit-logger.ts` | `audit_logs` | SOC2 identity/security events |

### Sensitive Data

- Environment variables validated at startup via Zod (`src/lib/env.ts`)
- API keys never exposed to client
- User passwords handled exclusively by Supabase Auth

---

## 7. Database Conventions

### Migration Naming

```
NNNNN_descriptive_name.sql
```

Migrations are in `supabase/migrations/` and applied sequentially.

### RLS Patterns

```sql
-- Standard org-scoped read policy
CREATE POLICY "org_read" ON public.table_name
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

### Soft Delete

Tables use `deleted_at TIMESTAMPTZ DEFAULT NULL` pattern. RLS policies filter `deleted_at IS NULL`.

### Updated-At Triggers

All mutable tables have a `moddatetime` trigger:

```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

## 8. Logging

Structured JSON logging via `src/lib/logger.ts`:

```typescript
import { createLogger } from '@/lib/logger';
const log = createLogger('module-name');

log.info('Operation completed', { entityId, duration });
log.error('Operation failed', { entityId }, error);
```

Fields: `timestamp`, `level`, `module`, `message`, `data`, `error`.

---

## 9. Environment Validation

Startup validation via Zod in `src/lib/env.ts`. The app will **not start** if required variables are missing or malformed.

```typescript
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // ...
});
```

---

## 10. Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Public marketing pages
│   ├── app/               # Authenticated app routes
│   │   ├── projects/      # Project management hub
│   │   ├── finance/       # Financial operations
│   │   ├── crew/          # Crew management
│   │   └── settings/      # Organization settings
│   └── api/               # API routes
├── components/
│   ├── ui/                # Design system primitives
│   ├── shared/            # Cross-module components
│   └── admin/             # Module-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Core business logic
│   ├── api/              # API guard chain
│   ├── rbac/             # RBAC/tenancy engine (auth + roles + permissions)
│   ├── middleware/        # Rate limiting, etc.
│   ├── supabase/         # Supabase client factories
│   └── i18n/             # Internationalization
├── types/                 # TypeScript type definitions
│   ├── database.ts       # Auto-generated Supabase types
│   └── rbac.ts           # RBAC/tenancy types (roles, memberships, sessions)
└── __tests__/            # Test suites
```
