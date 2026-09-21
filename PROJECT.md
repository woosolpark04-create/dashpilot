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
Phase 0 (Project Scaffolding) complete. **Phase 1 (Database & Auth Foundation) complete:**
- Remote schema applied — `profiles`/`leads`, triggers, RLS policies, and the signup bootstrap trigger (`20260921130000_initial_schema.sql`).
- Table-privilege fix applied — `authenticated` grants on `profiles`/`leads` (`20260921140000_grant_table_privileges.sql`), required alongside RLS (see Database Schema → PostgreSQL table grants).
- First admin manually promoted and confirmed active.
- Admin authentication working end-to-end (email/password login, server-side session handling via `src/lib/supabase/server.ts`, logout).
- Route protection working (`src/proxy.ts` redirects unauthenticated requests to `/login`; the `(dashboard)` layout independently enforces active-admin-only authorization, showing "Access restricted" otherwise).

**Phase 2 (App Shell & Design System) complete:**
- Internal design system under `src/components/ui/`: `Button`, `Input`, `Select`, `Card` (+ sub-parts), `Badge`, `Table` (+ sub-parts), `Dialog` (native `<dialog>`-based), `EmptyState`, `Skeleton`.
- App shell under `src/components/layout/`: `Sidebar` (persistent, desktop/tablet), `MobileNav` (slide-over drawer), `Topbar`, `AccountMenu` (with sign-out), and `AppShell` (client component holding the shared mobile-nav-open state), wired into `(dashboard)/layout.tsx` in place of the old bare header.
- All six existing routes (`/`, `/users`, `/users/[id]`, `/leads`, `/leads/[id]`, `/settings`) restyled with the new components; `Users`/`Leads` list and detail pages use static demo data with visually-complete-but-inert search/filter/pagination controls — no real CRUD. `Settings` shows the actual signed-in admin's own profile (reusing the existing self-row RLS read, not new functionality) plus an `EmptyState` placeholder for future settings.
- Added `clsx`, `tailwind-merge` (→ `cn()` helper in `src/lib/utils.ts`) and `lucide-react` (icons) as dependencies.
- No database/RLS/auth changes in this phase.

User management, leads management, and the dashboard's real statistics are not built yet — that's Phase 3+.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend / Auth / DB:** Supabase (Auth, PostgreSQL, Row Level Security)
- **Database:** PostgreSQL (via Supabase)
- **Hosting (planned):** Vercel (app) + Supabase (managed DB/auth)
- **Validation:** Zod (planned, for form and API input validation)
- **Data fetching:** Server Components + Supabase server client for reads; server actions or route handlers for mutations
- **UI utilities:** `clsx` + `tailwind-merge` (via `cn()` in `src/lib/utils.ts`) for conditional class composition; `lucide-react` for icons

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
│   │   ├── ui/                         # design-system primitives (implemented, Phase 2)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── card.tsx                # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx               # Table, TableHeader, TableBody, TableRow, TableHead, TableCell
│   │   │   ├── dialog.tsx              # Dialog (native <dialog>-based) + Header/Title/Description/Footer
│   │   │   ├── empty-state.tsx
│   │   │   └── skeleton.tsx
│   │   ├── layout/                     # app shell (implemented, Phase 2)
│   │   │   ├── app-shell.tsx           # client: holds shared mobile-nav-open state
│   │   │   ├── sidebar.tsx             # persistent nav, desktop/tablet
│   │   │   ├── mobile-nav.tsx          # slide-over drawer, mobile
│   │   │   ├── topbar.tsx
│   │   │   ├── account-menu.tsx        # user menu + sign-out
│   │   │   └── nav-items.ts            # shared nav config (Overview/Users/Leads/Settings)
│   │   ├── dashboard/                  # stat cards, charts, summary widgets (Phase 3)
│   │   ├── users/                      # user form, user filters (Phase 4 — table/list currently inline in the route)
│   │   └── leads/                      # lead form, lead filters (Phase 5 — table/list currently inline in the route)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser client
│   │   │   └── server.ts               # server component / server action client
│   │   ├── auth/
│   │   │   └── actions.ts              # login/logout server actions
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
**Implemented** for `profiles` and `leads` in `supabase/migrations/20260921130000_initial_schema.sql` (applied to the remote project):
- Both tables: RLS enabled.
- `profiles`: a user can read and update their own row. Self-service is limited to `full_name` and `avatar_url` — `email`, `role`, and `status` cannot be changed by the row's owner, and `id`/`created_at` cannot be changed by anyone, including admins. `updated_at` is not user-settable; it's stamped by a separate `before update` trigger on every update regardless of what the client sends. Admins can read/update all rows via a `public.is_admin()` helper.
- `leads`: admin-only read/write (`for all` policy gated on `public.is_admin()`); no access for regular users, active or otherwise.
- `public.is_admin()` returns true only when the caller's own profile has `role = 'admin'` **and** `status = 'active'`. It's `SECURITY DEFINER` with `search_path` pinned to `''` (every reference inside is schema-qualified) so a `profiles` RLS policy can check the caller's role without recursively re-triggering RLS on `profiles`, and so name resolution can't be hijacked via `search_path`. A disabled admin fails this check, which drops them to normal-user-equivalent access everywhere it's used — including on their own row, so a disabled admin cannot reactivate themselves.
- `public.guard_profiles_protected_fields()` (trigger `enforce_profile_field_guard`) is the single enforcement point for the field-level rules above; it runs regardless of which RLS policy (`profiles_update_own` or `profiles_update_admin`) matched, so the column-level restrictions hold even though the policies themselves only gate row visibility, not individual columns. It runs `SECURITY INVOKER` (no elevated privilege) since it only reads the row already supplied and delegates the actual permission decision to `public.is_admin()`.

**Not yet implemented:** `activity_log` remains deferred (see Open Questions) — only `role = 'admin'` would read it, with inserts via server-side logic, if it's added.

### PostgreSQL table grants — required alongside RLS
RLS and ordinary `GRANT` privileges are two separate, both-required layers: **RLS restricts which rows a role can see/touch; the base table `GRANT` decides whether that role can attempt the operation at all.** Postgres checks the table-level grant first — RLS is never even evaluated if the grant check fails. The initial migration enabled RLS and wrote policies but never granted table privileges to `authenticated`, so every request from a logged-in user failed with `42501: permission denied for table profiles` before RLS had a chance to run (diagnosed live via temporary auth diagnostics in the dashboard layout).

Fixed in `supabase/migrations/20260921140000_grant_table_privileges.sql` (applied to the remote project):
- `usage on schema public` → `authenticated`.
- `profiles`: `select, update` → `authenticated` (no `insert`/`delete` — creation is the `handle_new_user()` trigger's job; deletion follows `auth.users` via cascade).
- `leads`: `select, insert, update, delete` → `authenticated`, with `leads_admin_all` RLS still deciding per row whether a given authenticated (non-admin) user's request actually succeeds.
- `anon` explicitly has no table-level access to either table.

No existing RLS policy changed. Both layers are necessary together: the grant alone would let every authenticated user attempt anything (RLS still narrows to their own row or admin-only, as already documented above); RLS alone, without the grant, denies everyone outright at the privilege check, which is exactly the bug this migration fixes.

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

2. **Phase 1 — Database & Auth Foundation** — complete
   - [x] Write Supabase migrations for `profiles` and `leads`. Enable RLS and write policies (see Database Schema → Row Level Security).
   - [x] Apply the migration to the remote Supabase project; first admin manually promoted via the Supabase SQL Editor.
   - [x] Grant base table privileges to `authenticated` (RLS alone is not sufficient — see Database Schema → PostgreSQL table grants); applied to the remote project.
   - [x] Configure Supabase Auth; implement admin login (email/password), session handling, and route protection via `src/proxy.ts`, plus active-admin-only authorization in the `(dashboard)` layout. Verified working end-to-end against the remote project.

3. **Phase 2 — App Shell & Design System** — complete
   - [x] Build the base UI primitives (button, input, select, card, badge, table, dialog, empty state, skeleton) under `src/components/ui/`.
   - [x] Build the dashboard layout: responsive sidebar, topbar, mobile nav, account menu with sign-out, under `src/components/layout/`.
   - [x] Restyle all existing routes with static/placeholder content to lock in the visual design. No real data yet.

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
- **2026-09-21** — Migration applied to the remote Supabase project; first admin manually promoted and confirmed active. Implemented Phase 1 auth: `src/lib/auth/actions.ts` (`login`/`logout` server actions using `signInWithPassword`/`signOut`), a real `(auth)/login` form, and `src/proxy.ts` rewritten to refresh the Supabase session and redirect unauthenticated requests to `/login` for every non-public path (via `supabase.auth.getUser()`, never `getSession()`). Authorization is a second, separate check in the `(dashboard)` layout: it queries the caller's own `profiles` row and renders an "Access restricted" screen (with sign-out) for anyone who isn't `role='admin' AND status='active'`, rather than looping them back to `/login`. Smoke-tested against the real Supabase project (unauthenticated `/` and `/users` both 307 to `/login`; `/login` renders 200) without using real credentials.
- **2026-09-21** — Found (via a live diagnostic added to the `(dashboard)` layout after the active first admin still saw "Access restricted") that the layout's profile query was silently swallowing its Supabase error — `.single()`'s error was never checked, so a failed query and "no profile" were indistinguishable. Fixed that (switched to `.maybeSingle()` + explicit error capture, added temporary dev-only diagnostics), which surfaced the real root cause: `42501: permission denied for table profiles` — RLS was correctly configured, but `authenticated` had never been granted base table privileges on `profiles`/`leads`, so every request failed the privilege check before RLS was even evaluated. Wrote (not yet applied) `supabase/migrations/20260921140000_grant_table_privileges.sql` as a new migration — the already-applied initial migration is left untouched — granting `authenticated` `select, update` on `profiles` and full CRUD on `leads` (RLS still narrows both), with `anon` explicitly denied on both tables.
- **2026-09-21** — Table-privilege migration applied to the remote project; admin login confirmed working end-to-end. Removed the temporary diagnostics from `(dashboard)/layout.tsx` (the always-on console log and the dev-only on-page panel), while keeping the underlying fix: the profile-lookup error is still captured (not discarded) and explicitly fails `isActiveAdmin` closed on a genuine query error, logging it server-side. **Phase 1 (Database & Auth Foundation) is complete.**
- **2026-09-21** — Phase 2 (App Shell & Design System): added `clsx` + `tailwind-merge` (via a `cn()` helper in `src/lib/utils.ts`) and `lucide-react` as new dependencies — the only new dependencies added this phase, chosen for being small, standard, and load-bearing for a professional (not "generic tutorial") look. Built nine UI primitives under `src/components/ui/` and a six-piece app shell under `src/components/layout/` (sidebar, mobile drawer, topbar, account menu, and an `AppShell` client wrapper holding the shared mobile-nav-open state). `(dashboard)/layout.tsx` now renders `<AppShell>` instead of a bare header; its auth/authorization logic is untouched. All six existing routes restyled with static/demo content — `Users`/`Leads` search/filter/pagination controls are present but inert (no real CRUD), while `Settings` reuses the existing self-row profile read (already RLS-permitted, not new functionality) so the admin's own account section isn't showing fake data. Verified via `npm run build`/`lint` plus an unauthenticated smoke test (dev server); the authenticated shell itself could not be visually verified in this session since I don't have the admin's password — recommend a manual pass after logging in.

## Open Questions
- Auth method: email/password only, or also magic link / OAuth (e.g., Google) for a smoother demo login?
- Charting library for dashboard statistics (e.g., Recharts vs. Tremor vs. custom) — decide in Phase 3.
- Table/data-grid approach: build custom table components vs. adopt a headless table library (e.g., TanStack Table) — decide in Phase 2.
- Is `activity_log` worth the scope in v1, or better deferred to a "v2 polish" pass?
- Seed data strategy for the demo deployment: fully synthetic vs. loosely realistic fictional company data.

---

This file is the shared source of truth for the project. Both Claude Code and OpenAI Codex read this file before making changes and should keep it up to date as the project evolves.
