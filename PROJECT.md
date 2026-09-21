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
Phase 0 (Project Scaffolding) complete. Phase 1 (Database & Auth Foundation) is partially complete: the `profiles`/`leads` schema, `updated_at` triggers, and Row Level Security policies are written as a Supabase migration under `supabase/migrations/` (not yet applied to the remote project). Supabase client helpers (browser/server) are in place and connected to a real project via `.env.local`. Admin auth UI and route protection are still pending.

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

### Row Level Security
**Implemented** for `profiles` and `leads` in `supabase/migrations/20260921130000_initial_schema.sql` (not yet applied to the remote project):
- Both tables: RLS enabled.
- `profiles`: a user can read and update their own row. Self-service is limited to `full_name` and `avatar_url` — `email`, `role`, and `status` cannot be changed by the row's owner, and `id`/`created_at` cannot be changed by anyone, including admins. `updated_at` is not user-settable; it's stamped by a separate `before update` trigger on every update regardless of what the client sends. Admins can read/update all rows via a `public.is_admin()` helper.
- `leads`: admin-only read/write (`for all` policy gated on `public.is_admin()`); no access for regular users, active or otherwise.
- `public.is_admin()` returns true only when the caller's own profile has `role = 'admin'` **and** `status = 'active'`. It's `SECURITY DEFINER` with `search_path` pinned to `''` (every reference inside is schema-qualified) so a `profiles` RLS policy can check the caller's role without recursively re-triggering RLS on `profiles`, and so name resolution can't be hijacked via `search_path`. A disabled admin fails this check, which drops them to normal-user-equivalent access everywhere it's used — including on their own row, so a disabled admin cannot reactivate themselves.
- `public.guard_profiles_protected_fields()` (trigger `enforce_profile_field_guard`) is the single enforcement point for the field-level rules above; it runs regardless of which RLS policy (`profiles_update_own` or `profiles_update_admin`) matched, so the column-level restrictions hold even though the policies themselves only gate row visibility, not individual columns. It runs `SECURITY INVOKER` (no elevated privilege) since it only reads the row already supplied and delegates the actual permission decision to `public.is_admin()`.

**Not yet implemented:** `activity_log` remains deferred (see Open Questions) — only `role = 'admin'` would read it, with inserts via server-side logic, if it's added.

### Signup → profile bootstrap
When Supabase Auth inserts a new row into `auth.users` (i.e., on signup), an `after insert` trigger (`on_auth_user_created` → `public.handle_new_user()`) automatically inserts a matching `public.profiles` row: `id`/`email` copied from the new auth user, `full_name` read from `raw_user_meta_data ->> 'full_name'` if present, and `role`/`status` **hardcoded** to `'user'`/`'active'` — never taken from user-supplied metadata, so nobody can hand themselves `role: admin` at signup. This function must be `SECURITY DEFINER` (not optional here): `profiles` has no `INSERT` policy for `authenticated`/`anon`, so without elevated privilege the insert would simply fail for every signup.

### Bootstrapping the first admin
No signup is ever auto-promoted, including the first one. After creating your own account through the app's normal signup flow, promote it to admin **once**, manually, via the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = '<your-email>';
```

This command is documented here and in the migration file as a placeholder only — no real email or credential is stored in either place. Once that first admin exists (and stays `status = 'active'`), all further role/status management happens through the app itself via `is_admin()`-gated policies; no more manual SQL should be needed.

## Development Phases

1. **Phase 0 — Project Scaffolding**
   Initialize Next.js (App Router) + TypeScript + Tailwind. Set up ESLint/Prettier, base folder structure, `.env.example`, and connect the repo to a Supabase project.

2. **Phase 1 — Database & Auth Foundation**
   - [x] Write Supabase migrations for `profiles` and `leads`. Enable RLS and write policies (see Database Schema → Row Level Security).
   - [ ] Apply the migration to the remote Supabase project.
   - [ ] Configure Supabase Auth; implement admin login (email/password to start), session handling, and route protection via `src/proxy.ts`. **Not started.**

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
- **2026-09-21** — Supabase connection scaffolding: installed `@supabase/supabase-js` and `@supabase/ssr`; added `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server, cookie-based). `.env.example` documents `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the newer publishable-key naming, replacing the legacy anon-key naming); `SUPABASE_SERVICE_ROLE_KEY` intentionally omitted since nothing server-side needs elevated privileges yet. `.env.local` holds real project credentials locally and is gitignored.
- **2026-09-21** — Phase 1 database foundation: added `supabase/migrations/20260921130000_initial_schema.sql` defining `profiles`, `leads`, `updated_at` triggers, RLS policies, and a `SECURITY DEFINER` `public.is_admin()` helper to avoid recursive RLS. A `before update` trigger blocks non-admins from changing their own `role`. Migration is written and lint/build-verified locally but **not yet applied** to the remote Supabase project. Auth UI and route protection remain pending.
- **2026-09-21** — Hardened the same (still-unapplied) migration in place rather than layering on a second migration: `is_admin()` now also requires `status = 'active'` (so disabled admins lose admin access everywhere, including reactivating themselves) and pins `search_path = ''`; the guard trigger (renamed `guard_profiles_protected_fields()` / `enforce_profile_field_guard`) was broadened from role-only to block `id`/`created_at` changes for everyone and `email`/`role`/`status` changes for anyone who isn't an active admin, leaving only `full_name`/`avatar_url` freely self-editable. The guard function itself was demoted from `SECURITY DEFINER` to `SECURITY INVOKER` (least privilege — it only reads the row and delegates to `is_admin()`), and both `SECURITY DEFINER`/trigger functions had their default `PUBLIC` execute grants revoked.
- **2026-09-21** — Added the signup → profile bootstrap: `public.handle_new_user()` (`SECURITY DEFINER`, required since `profiles` has no `INSERT` policy for `authenticated`/`anon`) fires `after insert` on `auth.users` and creates the matching `profiles` row with `role`/`status` hardcoded to `'user'`/`'active'` — never read from signup metadata, so a signup can't self-assign a role. No account is auto-promoted; the first admin is bootstrapped manually, once, via a documented `UPDATE` in the Supabase SQL Editor (placeholder email only — no real credential committed).

## Open Questions
- Auth method: email/password only, or also magic link / OAuth (e.g., Google) for a smoother demo login?
- Charting library for dashboard statistics (e.g., Recharts vs. Tremor vs. custom) — decide in Phase 3.
- Table/data-grid approach: build custom table components vs. adopt a headless table library (e.g., TanStack Table) — decide in Phase 2.
- Is `activity_log` worth the scope in v1, or better deferred to a "v2 polish" pass?
- Seed data strategy for the demo deployment: fully synthetic vs. loosely realistic fictional company data.

---

This file is the shared source of truth for the project. Both Claude Code and OpenAI Codex read this file before making changes and should keep it up to date as the project evolves.
