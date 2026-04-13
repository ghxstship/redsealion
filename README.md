# FlyteDeck

**Production Management Platform for Live Events, Fabrication & Creative Operations**

FlyteDeck is a multi-tenant SaaS platform built for production companies that manage live events, fabrication, and creative operations. It consolidates project management, financial operations, crew scheduling, equipment tracking, and client collaboration into a single system.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime) |
| Payments | [Stripe Connect](https://stripe.com/connect) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai/) + Anthropic |
| Rate Limiting | [Upstash Redis](https://upstash.com/) (prod) / In-Memory (dev) |
| Validation | [Zod 4](https://zod.dev/) |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |

## Architecture

FlyteDeck uses a **two-tier RBAC architecture** with database-enforced permissions:

- **Platform Roles** (10 roles): `developer`, `owner`, `admin`, `controller`, `collaborator`, `contractor`, `crew`, `client`, `viewer`, `community`
- **Project Roles** (4 roles): `project_creator`, `project_collaborator`, `project_viewer`, `project_vendor`
- **Subscription Tiers** (4 tiers): `portal` → `starter` → `professional` → `enterprise`

Multi-tenancy is enforced via Row-Level Security (RLS) on every table, with organization-scoped data isolation.

> See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full backend architecture guide.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (local or cloud)

### Environment Setup

```bash
cp .env.example .env.local
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features |

### Install & Run

```bash
npm install
npm run dev          # Starts on http://localhost:3001
```

### Database Migrations

```bash
npx supabase db push    # Apply all migrations to linked database
npx supabase gen types typescript --project-id <id> > src/types/database.ts
```

## Module Index

FlyteDeck ships 20+ operational modules organized by domain:

| Domain | Modules |
|--------|---------|
| **Projects** | Projects, Tasks, Gantt, Roadmap, Files, Calendar |
| **Finance** | Invoices, Expenses, Budgets, Time Tracking, Mileage |
| **Sales** | Pipeline (CRM), Proposals, Leads, Clients |
| **Operations** | Crew, Equipment, Warehouse, Events, Locations |
| **Procurement** | Purchase Orders, Purchase Requisitions, Vendors |
| **Production** | Fabrication, Dispatch, Rentals, Schedule |
| **AI** | AI Assistant, AI Drafting, Automations |
| **Collaboration** | Client Portal, Project Portals, Advances |
| **Admin** | Settings, People (HR), Compliance, Integrations |

## ADR Index

Architecture Decision Records are in [`docs/adr/`](docs/adr/):

| # | Decision |
|---|----------|
| 001 | Next.js App Router (from Pages) |
| 002 | Supabase for Auth + Database |
| 003 | Harbor Master RBAC Architecture |
| 004 | Subscription Tier Feature Gating |
| 005 | Design System Token Architecture |
| 006 | Rate Limiting Strategy |
| 007 | Legacy Role Purge (manager/team_member → collaborator) |
| 008 | Dual Audit Log Architecture |
| 009 | Rate Limiter Dual-Module Strategy |

## Deployment

FlyteDeck deploys to [Vercel](https://vercel.com/) with automatic preview deployments on PR.

```bash
npm run build    # Production build
npm run start    # Start production server on port 3001
```

## Testing

```bash
npm test              # Run unit tests (Vitest)
npm run test:e2e      # Run E2E tests (Playwright)
npm run test:e2e:ui   # Playwright UI mode
```

## License

Proprietary. All rights reserved.
