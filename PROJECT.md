# DashPilot

## Overview
DashPilot is a polished, full-stack admin dashboard built as a portfolio project to demonstrate production-quality full-stack skills for freelance/Upwork client applications. It simulates a realistic SaaS admin panel: an authenticated admin manages platform users and sales leads, views summary statistics, and works with data through search, filtering, and pagination — all in a clean, responsive, professional UI.

Primary audience: prospective freelance clients evaluating the developer's ability to ship a real, cohesive product (not a tutorial clone).

## Goals
- Ship a cohesive, professional-looking admin dashboard that reads as a real product, not a template.
- Demonstrate full-stack competency: auth, relational schema design, CRUD, server/client data flow, and responsive UI.
- Keep the codebase clean enough to walk through in a client call or link directly from a portfolio/resume.
- Deploy a live, demoable instance.

## Non-Goals (for v1)
- Multi-tenancy / multiple organizations.
- Billing or payments integration.
- Real-time collaboration features (e.g., live cursors, websocket presence).
- Email sending / notification infrastructure.
- Role-based permission granularity beyond `admin` vs `user`.
- Native mobile app (responsive web only).

## Status
Phase 0 (Project Scaffolding) complete. Next.js (App Router) + TypeScript + Tailwind CSS + ESLint are set up under `src/`, the planned base folder structure exists, and `.env.example` documents the required Supabase variables. Lint and build both pass. No Supabase project is connected yet and no auth/database features are implemented — that begins in Phase 1.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend / Auth / DB:** Supabase (Auth, PostgreSQL, Row Level Security)
- **Database:** PostgreSQL (via Supabase)
- **Hosting (planned):** Vercel (app) + Supabase (managed DB/auth)
- **Validation:** Zod (planned, for form and API input validation)
- **Data fetching:** Server Components + Supabase server client for reads; server actions or route handlers for mutations

Decisions on additional libraries (charts, tables, form handling, testing) should be recorded in the Decisions Log below as they're made, rather than assumed in advance.

## Architecture

**Rendering model.** Next.js App Router with React Server Components by default. Pages that only read data (dashboard overview, user/lead lists, detail views) render on the server and query Supabase directly. Interactive pieces (forms, filters, modals, table controls) are isolated as client components and kept as small as possible.

**Data flow.**
- Reads: Server Components use a server-side Supabase client (`src/lib/supabase/server.ts`) to query PostgreSQL directly at request time — no separate REST/GraphQL layer.
- Writes: Mutations (create/update/delete on users and leads) go through Next.js server actions or route handlers under `src/app/api/`, which validate input with Zod (`src/lib/validations/`) before writing to Supabase.
- Browser-only interactions (e.g., auth state on the client) use the browser Supabase client (`src/lib/supabase/client.ts`).

**Auth & access control.** Supabase Auth issues the session; `src/proxy.ts` (Next.js's `proxy`/middleware convention) checks the session on protected routes and redirects unauthenticated requests to `(auth)/login`. Authorization (admin vs. user) is enforced at the database layer via PostgreSQL Row Level Security policies, not just in application code, so access rules hold even if a query bypasses the app layer.

**Deployment topology.** The Next.js app deploys to Vercel; PostgreSQL, Auth, and RLS are managed by Supabase. No custom backend server — Supabase is the entire backend surface, accessed either directly (reads) or through Next.js server actions/route handlers (writes needing validation).

This section describes the intended system shape; see **Folder Architecture** below for where each piece lives in the codebase, and **Database Schema** for the data model.

## Folder Architecture

Planned structure once scaffolding begins:

```
dashpilot/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # sidebar + header shell, auth guard
│   │   │   ├── page.tsx                # overview / stats
│   │   │   ├── users/
│   │   │   │   ├── page.tsx            # user list: search, filter, pagination
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # user detail / edit
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx            # lead list: search, filter, pagination
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # lead detail / edit
│   │   │   └── settings/
│   │   │       └── page.tsx            # admin profile settings
│   │   ├── api/                        # route handlers (if needed beyond server actions)
│   │   ├── layout.tsx                  # root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # design-system primitives: button, input, table, modal, badge, etc.
│   │   ├── layout/                     # sidebar, topbar, nav, mobile nav
│   │   ├── dashboard/                  # stat cards, charts, summary widgets
│   │   ├── users/                      # user table, user form, user filters
│   │   └── leads/                      # lead table, lead form, lead filters, status pipeline
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser client
│   │   │   ├── server.ts               # server component / server action client
│   │   │   └── middleware.ts           # session refresh helper
│   │   ├── validations/                # Zod schemas for forms and API input
│   │   └── utils.ts                    # shared helpers (formatting, cn, etc.)
│   ├── hooks/                          # client-side hooks (e.g., useDebouncedValue, useTablePagination)
│   ├── types/                          # shared TypeScript types, generated Supabase types
│   └── proxy.ts                        # route protection (Next.js proxy/middleware convention)
├── supabase/
│   ├── migrations/                     # SQL migrations, source of truth for schema
│   └── seed.sql                        # demo/seed data for portfolio presentation
├── public/
├── .env.example
├── PROJECT.md
├── CLAUDE.md
├── AGENTS.md
└── (standard Next.js/TS/Tailwind config files)
```

Notes:
- Route groups `(auth)` and `(dashboard)` separate the unauthenticated login flow from the protected admin shell.
- `supabase/migrations` is the source of truth for schema; the schema below should stay in sync with it once migrations exist.

## Database Schema

Target: PostgreSQL via Supabase, with Row Level Security enabled on all tables. Admin-only access enforced via RLS policies checking the caller's role.

### `profiles`
Extends Supabase `auth.users` with app-specific fields. One row per authenticated user (admins and managed platform users both live here, distinguished by `role`).

| Column        | Type          | Notes                                       |
|---------------|---------------|----------------------------------------------|
| `id`          | uuid (PK)     | References `auth.users.id`                   |
| `email`       | text          | Denormalized for convenient search/display   |
| `full_name`   | text          | Nullable                                     |
| `avatar_url`  | text          | Nullable                                     |
| `role`        | text          | `admin` \| `user`, default `user`             |
| `status`      | text          | `active` \| `invited` \| `disabled`           |
| `created_at`  | timestamptz   | Default `now()`                               |
| `updated_at`  | timestamptz   | Default `now()`, updated via trigger          |

### `leads`
Sales/prospect records managed by admins.

| Column          | Type          | Notes                                                        |
|-----------------|---------------|----------------------------------------------------------------|
| `id`            | uuid (PK)     | Default `gen_random_uuid()`                                    |
| `full_name`     | text          | Required                                                        |
| `email`         | text          | Nullable                                                        |
| `phone`         | text          | Nullable                                                        |
| `company`       | text          | Nullable                                                        |
| `source`        | text          | e.g. `website`, `referral`, `cold_outreach`, `other`            |
| `status`        | text          | `new` \| `contacted` \| `qualified` \| `won` \| `lost`             |
| `value_estimate`| numeric       | Estimated deal value, nullable                                  |
| `notes`         | text          | Nullable                                                        |
| `assigned_to`   | uuid (FK)     | References `profiles.id`, nullable                              |
| `created_at`    | timestamptz   | Default `now()`                                                 |
| `updated_at`    | timestamptz   | Default `now()`, updated via trigger                            |

### `activity_log` (stretch, may defer past v1)
Lightweight audit trail for admin actions on users/leads, useful for demoing "polish" in a portfolio walkthrough.

| Column        | Type          | Notes                                    |
|---------------|---------------|--------------------------------------------|
| `id`          | uuid (PK)     | Default `gen_random_uuid()`                |
| `actor_id`    | uuid (FK)     | References `profiles.id`                   |
| `action`      | text          | e.g. `lead.created`, `user.disabled`       |
| `entity_type` | text          | `lead` \| `user`                            |
| `entity_id`   | uuid          | Target record id                           |
| `metadata`    | jsonb         | Nullable, arbitrary context                |
| `created_at`  | timestamptz   | Default `now()`                             |

### Dashboard statistics
No dedicated stats table for v1. The overview page computes aggregates on read (e.g., total users, total leads, leads by status, leads created this week) via SQL queries/views against `profiles` and `leads`. Revisit with a materialized view only if performance requires it.

### Row Level Security (planned policy shape)
- All tables: RLS enabled.
- `profiles`: a user can read/update their own row; only `role = 'admin'` may read/update all rows.
- `leads`: only `role = 'admin'` may read/write.
- `activity_log`: only `role = 'admin'` may read; inserts performed via server-side logic using the admin's identity.

## Development Phases

1. **Phase 0 — Project Scaffolding**
   Initialize Next.js (App Router) + TypeScript + Tailwind. Set up ESLint/Prettier, base folder structure, `.env.example`, and connect the repo to a Supabase project.

2. **Phase 1 — Database & Auth Foundation**
   Write Supabase migrations for `profiles`, `leads` (and `activity_log` if in scope). Enable RLS and write policies. Configure Supabase Auth; implement admin login (email/password to start), session handling, and route protection middleware.

3. **Phase 2 — App Shell & Design System**
   Build the base UI primitives (button, input, table, modal, badge, card) and the dashboard layout: responsive sidebar, topbar, mobile nav. No real data yet — static/placeholder content to lock in the visual design.

4. **Phase 3 — Dashboard Statistics**
   Build the overview page: stat cards (total users, total leads, leads by status, recent activity) backed by real aggregate queries.

5. **Phase 4 — User Management**
   User list with search, filtering (by role/status), and pagination. User detail/edit view. Create/disable/update user records (CRUD against `profiles`).

6. **Phase 5 — Leads Management**
   Lead list with search, filtering (by status/source), and pagination. Lead detail/edit view. Full CRUD, including status pipeline updates.

7. **Phase 6 — Polish Pass**
   Responsive QA across mobile/tablet/desktop, loading/empty/error states, form validation UX, accessibility pass (keyboard nav, focus states, contrast), and visual consistency review.

8. **Phase 7 — Deployment & Portfolio Readiness**
   Deploy to Vercel with a demo Supabase instance and seeded demo data. Write a project README with screenshots and a short case-study summary suitable for linking from a portfolio/Upwork profile.

Each phase should be completed and reviewed before starting the next. Update this file's **Status** section as phases complete.

## Conventions
- App Router, Server Components by default; mark client components explicitly only where interactivity requires it.
- Supabase access goes through `src/lib/supabase/` clients — no ad hoc client creation in components.
- All schema changes go through a migration file in `supabase/migrations`; this file's Database Schema section is kept in sync with migrations.
- Form/API input validated with Zod schemas in `src/lib/validations/` before hitting the database.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.), consistent with the workspace's initial commit.

## Decisions Log
- **2026-09-21** — Project defined: DashPilot, a portfolio-oriented admin dashboard (Next.js/TypeScript/Tailwind/Supabase/PostgreSQL). Folder architecture, database schema, and phased roadmap established. No application code written yet.
- **2026-09-21** — Phase 0 complete: scaffolded with `create-next-app` (Next.js 16.3.5, App Router, TypeScript, Tailwind CSS v4, ESLint). Installed Next.js renamed the middleware file convention to `proxy` (`src/proxy.ts` replaces the deprecated `src/middleware.ts`); PROJECT.md updated to match. No Supabase packages installed and no auth/DB logic added yet.

## Open Questions
- Auth method: email/password only, or also magic link / OAuth (e.g., Google) for a smoother demo login?
- Charting library for dashboard statistics (e.g., Recharts vs. Tremor vs. custom) — decide in Phase 3.
- Table/data-grid approach: build custom table components vs. adopt a headless table library (e.g., TanStack Table) — decide in Phase 2.
- Is `activity_log` worth the scope in v1, or better deferred to a "v2 polish" pass?
- Seed data strategy for the demo deployment: fully synthetic vs. loosely realistic fictional company data.

---

This file is the shared source of truth for the project. Both Claude Code and OpenAI Codex read this file before making changes and should keep it up to date as the project evolves.
