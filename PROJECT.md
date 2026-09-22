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

**Phase 3 (Dashboard Statistics) complete:**
- Overview page now renders real Supabase data instead of demo content: 4 stat cards (total users, total leads, active leads, won-this-month) and a "Recent leads" list (newest 5, real columns), each streamed independently via React `Suspense` with a `Skeleton`-based loading fallback.
- Data-access layer added under `src/lib/dashboard/stats.ts` (`getOverviewStats`, `getRecentLeads`) — no large query blocks in page/component files; queries run under the existing admin session and existing RLS (no schema/RLS changes).
- Each stat has a real period-over-period trend (this month vs last month); see Database Schema → Dashboard statistics for the exact definitions and the one documented limitation (Active leads' trend is a substitute metric, not a true historical comparison — no audit/history table exists to reconstruct a past point-in-time count).
- Error handling: each section (stats, recent leads) fails independently and shows a polished "unavailable" state with a generic message plus the Postgres/PostgREST error *code* only (never the raw error message) — errors are logged server-side, never silently swallowed.
- Empty state: if `leads` has zero rows, the existing `EmptyState` component renders — no fake rows are shown.
- No database schema, RLS, or auth changes in this phase; `Users`/`Leads` pages remain static demo content (unchanged, out of scope) — that's Phase 4/5.
- Verified via manual browser review against the live (empty) Supabase project: all four stat cards correctly show `0`/`$0` (Total users counts `role='user'` only, so the sole seeded admin correctly doesn't count), and Recent Leads correctly renders the `EmptyState` rather than any fake row.

**Phase 3 is complete.**

**Phase 4 / 4A (User Management) complete — verified via manual browser testing:** real profile data renders correctly, `full_name` editing works, search works, role/status filters work, the current admin cannot demote or disable their own account, and the user detail page works.
- `/users` now lists real `profiles` rows (`full_name`, `email`, `role`, `status`, `created_at`) — all demo rows/counts removed.
- Working search (`full_name`/`email`, case-insensitive `ilike`, debounced), role filter (all/admin/user), status filter (all/active/invited/disabled), and real server-side pagination (10/page, `Previous`/`Next`, "Showing X–Y of Z"). Search/filter/page state lives in the URL (`?q=&role=&status=&page=`), so it survives reload/back-forward and is shareable/bookmarkable.
- `/users/[id]` shows real profile data (full name, email, role, status, joined date, last-updated date, user ID). Loading `error.code === "22P02"` (Postgres's "invalid UUID syntax" code) from a malformed `[id]` renders a clear "That doesn't look like a valid user ID" message rather than the generic query-failure one.
- **Edit scope, narrowed in Phase 4A**: the edit form only allows `full_name`, `role`, and `status`. `email` is shown but **read-only** — deliberately not editable, since `profiles.email` and the Supabase Auth user's actual sign-in email are separate concerns that updating only one of would silently desync (a note under the field explains this). `avatar_url` editing (present in the initial Phase 4 pass) was also dropped to match this phase's narrower, explicit field list. `id`/`created_at` were never editable; `updated_at` remains fully automatic via the existing trigger.
- Submits via a `'use server'` action (`updateUserAction`), using `useActionState` for inline success/error feedback (no page-reload redirect hack).
- Route-level `loading.tsx` added for both `/users` and `/users/[id]` (Skeleton-based) — this is what makes navigations (search typing, filter changes, pagination, page-to-page) show a loading state, not just the initial load.
- **Self-lockout guard** (application layer, in `updateUserAction`): an active admin cannot change their own role away from `admin` or their own status away from `active` — the action rejects the attempt with a clear message before touching the database. See "RLS/security issues discovered" below for why this can't be delegated to RLS/triggers.
- No RLS, grant, or schema changes were needed — the existing Phase 1 policies/grants/triggers already support everything Phase 4/4A needed. `Leads` page, app shell, and auth behavior all untouched.

**Phase 4B (Invite User) complete — verified via manual end-to-end testing:** the Invite user button works, admin authorization works, the Supabase Auth Admin API invite call works, a new auth user is created, the corresponding `profiles` row is created automatically, the new user appears in the real Users list, and `SUPABASE_SECRET_KEY` remains server-only in `.env.local`.
- **Server-only admin client** (`src/lib/supabase/admin.ts`): uses `SUPABASE_SECRET_KEY` (the current Supabase naming for what used to be called the `service_role` key) and bypasses RLS entirely. Guarded by the `server-only` package — not just a naming convention, this makes the **build itself fail** if the module is ever reachable from a Client Component, rather than relying on code review to catch a leak. Only one file imports it: `src/lib/users/actions.ts`, a `'use server'` module.
- **Authorization happens before the admin client is touched, using the normal session-scoped client**: `src/lib/auth/require-admin.ts` (`requireActiveAdmin`) calls `supabase.auth.getUser()` and then checks `profiles.role === 'admin' && profiles.status === 'active'` for that real session — the secret key itself grants no authorization on its own, and `inviteUserAction` returns early with a generic error if this check fails, never reaching `createAdminClient()`.
- **Invite flow**: `inviteUserAction` (`src/lib/users/actions.ts`) validates `full_name`/`email`, then calls `admin.auth.admin.inviteUserByEmail(email, { data: { full_name }, redirectTo })`. `full_name` is passed only as auth user metadata — the inviter has no way to set `role`/`status`; the existing `handle_new_user()` trigger creates the resulting `profiles` row exactly as it does for self-signup (`role='user'`, `status='active'`), per this phase's explicit instruction not to touch that trigger.
- **UI**: the "Invite user" button (previously disabled) now opens a `Dialog` (the existing primitive) with `full_name`/`email` fields, submitting via `useActionState` — shows a pending "Sending…" state, inline validation/duplicate/failure errors (never the raw Supabase error), and a success panel with a "Done" button. Reopening the dialog remounts it (`key={open}`) so a prior success/error doesn't linger.
- **Refresh**: `revalidatePath("/users")` after a successful invite — the new `profiles` row (created by the trigger) appears in the real users table without a manual page reload, same pattern already verified working for `updateUserAction`.
- **Redirect URL**: `redirectTo` is built from `NEXT_PUBLIC_APP_URL` (optional, public env var — renamed from `NEXT_PUBLIC_SITE_URL` in Phase 7C for clarity ahead of deployment) + `/auth/callback` (updated in Phase 4C — was `/login`), defaulting to `http://localhost:3000/auth/callback` for local dev. **For production**, set `NEXT_PUBLIC_APP_URL` to the deployed domain, and add that same redirect URL to the Supabase Dashboard → Authentication → URL Configuration → Redirect URLs allow-list — Supabase silently ignores/rejects a `redirectTo` that isn't allow-listed there.
- **Discovered, not changed (per explicit instruction)**: `profiles.status` has an `'invited'` value in its check constraint, which would semantically fit a freshly-invited user better than `'active'` — but `handle_new_user()` doesn't distinguish invite-created accounts from self-signups, and this phase's spec explicitly required that behavior stay as-is. Worth reconsidering in a future phase.
- **Env/security**: `SUPABASE_SECRET_KEY` added to `.env.example` (empty value, explicit server-only warning) — never added to `.env.local` by me (I don't have the real value and this stays a manual step for you); `.env.local` confirmed still gitignored (`.env*.local` pattern). The secret is never logged; only structured Supabase errors are logged server-side, and only a generic, categorized message ever reaches the client.

**Phase 4C (Invite Acceptance / Password Setup) complete — verified end-to-end with a real invite email:** a real invite was sent, the email link opened, `/auth/callback` established the invited user's session, `/set-password` rendered and validated both the "too short" (client-side `minLength`) and "passwords don't match" (server-side) cases, a valid password was accepted, the session was signed out and redirected to `/login` with the confirmation banner, and the invited user logged in again with the new password — landing on the admin-only "Access restricted" screen and confirmed via the admin's Users list as still `role='user'`, `status='active'`. An invited user can now go from clicking the email link to a working password to a normal login, without ever touching `SUPABASE_SECRET_KEY` or the `profiles.role`/`status` columns.
- **`/auth/callback`** (`src/app/(auth)/auth/callback/page.tsx` + `src/components/auth/auth-callback-client.tsx`, client component): exchanges whatever Supabase put in the URL for a real session using the normal **browser** Supabase client — never the admin client. Handles all three shapes Supabase's invite link can arrive in depending on project auth settings: an implicit-flow hash fragment (`#access_token&refresh_token`, via `setSession()`), a PKCE `?code=` (via `exchangeCodeForSession()`), or an OTP `?token_hash=&type=` pair (via `verifyOtp()`). The hash-fragment case is why this has to be a client component rather than a route handler — a URL fragment is never sent to the server. On success, redirects to `/set-password`; on failure (missing/expired/reused link), shows an inline "This invite link isn't valid" state with a link back to `/login`.
- **`/set-password`** (`src/app/(auth)/set-password/page.tsx`, server component): reads the real session via `supabase.auth.getUser()` (server client). No session → a "Session expired" state instead of the proxy's usual blanket redirect to `/login` (see below). A session → renders `SetPasswordForm` (`src/components/auth/set-password-form.tsx`), a `useActionState` form for the new/confirm password fields.
- **`setPasswordAction`** (added to `src/lib/auth/actions.ts`): validates both fields are present, ≥8 characters, and match; re-checks `getUser()` server-side (never trusts the client-established session blindly); calls `supabase.auth.updateUser({ password })` — an Auth API call that only touches the password hash and never writes to `profiles`, so `role`/`status` (set once, by `handle_new_user()`) can't be influenced by the invited user. Signs the session out afterward and redirects to `/login?message=...` so the user proves the new password actually works by signing in fresh; the login page now renders that as a green confirmation banner (existing red error banner pattern, reused).
- **Route protection**: `src/proxy.ts`'s `PUBLIC_PATHS` gained `/auth/callback` and `/set-password` — both need to render their own friendly states (invalid link, expired session) for a request with no/bad session, rather than being bounced straight to `/login` by the proxy before the page ever renders.
- **Security**: no `SUPABASE_SECRET_KEY`/admin client anywhere in this flow (grep confirms `src/lib/supabase/admin.ts` is still only imported from `src/lib/users/actions.ts`); no RLS/migration changes; the invited user never gets a code path to set their own `role`/`status`.
- **Verification split**: the surrounding states (`/set-password` with no session, `/auth/callback` with no/invalid params, the login page's success banner) were checked via Playwright automation; the real invite send → email → click → redeem → password-set → re-login cycle was run manually with a real inbox (per explicit instruction not to auto-submit a real invite through Playwright) and passed every step.

**Phase 5 (Leads Management) complete — verified via Playwright (create/search/filter/paginate/edit/assign/delete, desktop + mobile) using clearly fictional test data, cleaned up afterward:** `/leads` and `/leads/[id]` now run entirely on real `public.leads` data — all demo rows and "Demo data shown" copy removed.
- **Data-access layer** (`src/lib/leads/queries.ts`): `listLeads` (search across `full_name`/`company`/`email` via PostgREST `.or()` + the same double-quote escaping `users/queries.ts` uses, `status`/`source` `.eq()` filters, `created_at desc`, 10/page server-side pagination) and `getLeadById` (embeds the assigned profile via `assigned:profiles!assigned_to(id, full_name, email)`, with the same `22P02` → "That doesn't look like a valid lead ID" handling as `getUserById`). `listAssignableProfiles` restricts assignment candidates to `role='admin' AND status='active'` — leads are worked by staff, not by the platform users managed in `/users`.
- **Validation** (`src/lib/leads/validation.ts`): this phase is what finally introduced **Zod** (added as a dependency), used to validate every create/edit field server-side — `full_name` required, `email` format-checked, `value_estimate` coerced/non-negative, `status`/`source` constrained to their known values, `assigned_to` UUID-checked. Empty optional fields (`""` from an unfilled input) are normalized to `undefined` before validation so they save as `null`, not empty strings.
- **Mutations** (`src/lib/leads/actions.ts`): `createLeadAction`, `updateLeadAction`, `deleteLeadAction` all call `requireActiveAdmin()` (the same Phase 4B helper) against the normal session-scoped client before touching anything — no `SUPABASE_SECRET_KEY`/admin client anywhere in this phase, and RLS (`leads_admin_all`, already in place since Phase 1) is the only thing deciding whether the write is allowed. Each mutation revalidates `/leads`, `/` (Overview), and `/leads/[id]` where relevant, so Phase 3's stat cards and "Recent leads" pick up create/edit/delete without a manual refresh — confirmed live (adding a lead immediately moved Total leads/Active leads and populated Recent Leads).
- **UI**: `CreateLeadDialog` (the existing `Dialog` primitive, widened to `max-w-lg` via its existing `className` override — no changes to `Dialog` itself) covers create; the detail page's edit form (originally `LeadEditForm`, later folded into `LeadDetailPanel` — see the UX-standardization note below) includes the `assigned_to` field the create dialog deliberately omits (matches the spec: invite-time and create-time both start unassigned/role-less). `DeleteLeadDialog` is a second `Dialog` consumer — a destructive-styled confirmation (reusing the `destructive` `Button` variant) that only deletes on explicit confirm, then redirects to `/leads?deleted=1` for a success banner (same query-flag pattern as the login page's post-password-reset message). Added one new primitive, `Textarea` (`src/components/ui/textarea.tsx`), styled to match `Input`, for the `notes` field.
- **Reused rather than duplicated**: `PaginationControls` (Phase 4) is imported as-is from `src/components/users/` — it was already fully generic (URL/page-number logic, no user-specific code), so leads uses the same component instead of a copy. `formatCurrency` (Phase 3, `src/lib/dashboard/stats.ts`) is reused for the list and detail views' Est. value display.
- **States**: route-level `loading.tsx` for both `/leads` and `/leads/[id]` (Skeleton-based, mirroring Users'); empty-vs-no-results copy distinguished by whether any filter/search param is active; query and mutation errors show a generic message (+ Postgres error code where applicable) and are always logged server-side, never the raw error text.
- **Not changed**: no new migration — `leads_admin_all` RLS and the `authenticated` grants from Phase 1's two migrations already covered full CRUD; `.env.local` untouched.

**Post-Phase-5 UX polish — standardized the explicit edit-mode pattern across every editable detail screen (Leads, Users):** both `/leads/[id]` and `/users/[id]` were read-only-plus-an-always-visible-edit-form before this pass; both now default to read-only with a header **Edit lead**/**Edit user** button that toggles the same card's content into a form with **Cancel**/**Save changes** — no editable inputs shown until the user explicitly asks for them.
- **Shared, not duplicated**: `useEditMode()` (`src/hooks/use-edit-mode.ts` — the first thing to land in that previously-empty planned folder) centralizes the `isEditing`/`editSession`/`savedMessage` state machine (start/cancel/handleSaved) so both `LeadDetailPanel` and the new `UserDetailPanel` share one implementation of the toggle bookkeeping, while each still owns its own fields, layout, and security rules. `blockImplicitSubmit` (moved from a local helper into `src/lib/utils.ts`) is the shared `onKeyDown` guard: it calls `preventDefault()` only when Enter is pressed with an `<input>` focused, leaving `<textarea>` newlines and button activation untouched — used by both forms.
- **`editSession` remount trick**: bumped every time "Edit" is clicked and passed as the edit form's React `key`, forcing a fresh mount (and a fresh `useActionState`) each time — so canceling then re-opening edit mode, or a failed save followed by leaving and re-entering, never leaks a stale error/pending state into the next attempt.
- **`src/components/users/user-detail-panel.tsx`** replaces `user-edit-form.tsx` (deleted), following the exact shape of `lead-detail-panel.tsx`: same button placement/order (Cancel, then Save changes), same success-banner styling, same "Saving…" pending-label convention. All Phase 4/4A security behavior is unchanged and re-verified: `email` still rendered read-only with its original explanatory note, the self-lockout guard (`updateUserAction`) still rejects a self-role-change-away-from-admin or self-status-change-away-from-active with its original message, and `id`/`created_at` remain absent from the form entirely (never were editable).
- **Settings intentionally untouched**: `/settings` has no editable fields today (pure read-only account summary + an "coming soon" placeholder) — per this pass's own instruction not to expand permissions, no edit mode was added there. It'll pick up the same pattern if/when a future phase actually adds editable profile fields.
- **No schema/RLS/auth changes**: this was purely a client-side presentation refactor around the existing `updateLeadAction`/`updateUserAction` server actions, which are untouched.

**Phase 6 (Polish Pass) complete — no major new product scope, per this phase's own goal:** a full accessibility/responsive/edge-case review across the app surfaced five genuine bugs (not just polish), all fixed:
1. **Dialogs had no accessible name** — a modal `<dialog>` doesn't get one from a heading inside it automatically; `Dialog` now generates `titleId`/`descriptionId` via `useId()` and shares them through context so `DialogTitle`/`DialogDescription` can supply `aria-labelledby`/`aria-describedby`.
2. **Mobile nav could strand keyboard focus** — closing the drawer (via its own close button, a nav link, or the backdrop) never moved focus anywhere; the browser was actively warning about this (`aria-hidden`/`inert` on an element that still had focus). Fixed by sharing a ref between `AppShell`, `Topbar`, and `MobileNav` so closing returns focus to the hamburger trigger. The drawer is also now `inert` (not just `aria-hidden`) while closed, so a sighted keyboard user can't tab into off-screen links either.
3. **`?page=` beyond the real range broke two ways**: PostgREST errors (`PGRST103`) rather than returning an empty page past the end — `listUsers`/`listLeads` now catch that and clamp to the real last page instead of showing a generic error. Separately, the search toolbars' debounce `useEffect` fired unconditionally on mount and always stripped `page` from the URL — meaning *any* direct/bookmarked/shared `?page=N` link silently reset to page 1 after ~300ms, regardless of whether N was even out of range. Fixed by skipping the effect when local search state already matches the URL's `q`.
4. **Tablet-width toolbar bug**: the Users/Leads toolbars' two fixed `sm:w-44` filter selects could squeeze the search input down to an icon-only ~50px box (placeholder invisible) at widths like 768px, where the sidebar's fixed 256px eats into the toolbar's available space. Fixed with `flex-wrap` + a `min-w-[12rem]` floor on the search box, so filters wrap to their own row instead of crushing search.
5. **`/users` empty-state copy bug**: always said "No users match your filters" (with a "Clear filters" link) even with zero filters active. Now matches `/leads`'s existing distinguish-empty-from-filtered pattern.
Also: `/settings` was missing its route-level `loading.tsx` (now added); `CardTitle` was h3 (skipping h2 under every page's h1, now fixed); table headers gained `scope="col"`; required fields get a visual `*` where a form genuinely mixes required/optional (Create Lead, lead edit); long names/companies/emails/large currency values were tested and confirmed to truncate (list) or wrap (detail) cleanly via a new `max-w` + `truncate` treatment on list-row links. Security regression re-confirmed via diff + grep (no auth/authorization file was touched) rather than re-running every manual test, since nothing in this phase's changes could plausibly affect them.

**Phase 7A (Portfolio Demo Data) complete:** `public.leads` now holds 25 fictional demo leads (plus pre-existing real test data, untouched) so the dashboard and leads list look like an active, populated pipeline rather than an empty scaffold.
- **Seed strategy**: `supabase/seed.sql` is the reviewable, repeatable source of truth — a single `insert ... on conflict (id) do nothing` statement using 25 hardcoded, visually-recognizable ids (`10000000-0000-4000-8000-0000000000xx`), so re-running it is always safe and never duplicates rows. Every name, company, phone number, and email is fictional; email domains use the `.test` TLD (IETF RFC 2606 — permanently reserved, guaranteed to never resolve to a real domain) and phone numbers use the 555-01xx block reserved for exactly this purpose.
- **Dataset**: 25 leads spread from 2026-07-10 through 2026-09-20 (today is 2026-09-21), all 5 statuses represented (6 new, 5 contacted, 4 qualified, 6 won, 4 lost) and all 4 sources represented (8 website, 6 referral, 6 cold_outreach, 5 other), realistic `value_estimate`s ($2,200–$41,500), short sales-note-style `notes`, and 8 rows assigned to the one real active admin profile (`assigned_to` — never a fabricated id). Dates were deliberately weighted toward August/September so both calendar-month trend comparisons in `getOverviewStats` have real signal in both periods, not just the current one, and the 5 most recent (Sep 15–20) make "Recent Leads" look active.
- **How it was actually applied**: this environment has no `psql`/Supabase CLI/database password available to Claude, and PostgREST (what the JS client talks to) has no "run arbitrary SQL" surface — a table-level `insert`/`upsert` is the only executable path available. A one-off local script (not committed — `supabase/seed.sql` is the committed artifact) used the existing `SUPABASE_SECRET_KEY` admin client to `upsert` the same 25 rows, which is why `created_at` could be backdated at all: neither the normal `createLeadAction` nor the authenticated-admin path expose that field, by design.
- **Discovered gap, fixed via a new migration (not by editing an applied one)**: the very first seed attempt failed with `42501: permission denied for table leads` — `service_role` had never been granted base table privileges on `public.leads` (only `authenticated` was, in Phase 1's grant migration), because nothing had used the admin client for a direct table operation before now (Phase 4B's admin-client usage only ever called the Auth Admin API, a separate code path). `supabase/migrations/20260921150000_grant_service_role_leads.sql` grants exactly `select, insert, update, delete` on `leads` to `service_role` — two lines, no RLS/policy change (service_role already bypasses RLS entirely by design; this only unblocks the separate, lower-level table-grant check Postgres runs before RLS is even evaluated), applied by the user via the Supabase SQL Editor per this project's established practice for every migration so far.
- **Demo users — deliberately not seeded**: `public.profiles.id` is a foreign key to `auth.users.id`; inserting a profiles row via SQL with a made-up id would either violate that constraint or create an orphaned profile with no way to actually sign in. `supabase/seed.sql` documents the safe alternative in detail (create demo accounts through Supabase Auth itself — the Admin API's `createUser`, or the existing Invite User flow — so `handle_new_user()` keeps `auth.users`/`profiles` in sync) as future work, per this phase's explicit instruction not to fabricate auth users. Existing real test/invited accounts were left as-is.
- **Verified via Playwright** (1440px and 375×812): Overview's four stat cards and their trends now reflect the real seeded distribution (Total leads 26, Active 15, Won this month $39,550 — exactly the sum of the two September `won` leads — down 46.2% vs August's $73,500, a deliberately realistic mixed result rather than an artificially all-positive demo); Recent Leads shows real recent rows with correct relative timestamps; Leads list search/status-filter/source-filter/pagination all verified against the new counts; a seeded lead's detail view, edit-mode field population, and Cancel-discard were verified read-only (to avoid disturbing the curated dataset); create/delete were verified against a separate, disposable throwaway lead instead, cleaned up afterward, leaving all 25 seeded rows untouched. No overflow/clipping found at either viewport — long company names and emails truncate in the list and wrap cleanly in the detail view, matching Phase 6's existing `truncate`/`max-w` treatment.
- **Not changed**: no RLS policy, no existing/applied migration file, `.env.local`, or auth behavior.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend / Auth / DB:** Supabase (Auth, PostgreSQL, Row Level Security)
- **Database:** PostgreSQL (via Supabase)
- **Hosting (planned):** Vercel (app) + Supabase (managed DB/auth)
- **Validation:** Zod (added in Phase 5, `src/lib/leads/validation.ts`) for lead create/edit server-side validation
- **Data fetching:** Server Components + Supabase server client for reads; server actions or route handlers for mutations
- **UI utilities:** `clsx` + `tailwind-merge` (via `cn()` in `src/lib/utils.ts`) for conditional class composition; `lucide-react` for icons
- **`server-only`:** build-time guard ensuring `src/lib/supabase/admin.ts` (the `SUPABASE_SECRET_KEY`-based admin client) can never be imported into a Client Component

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
│   │   │   ├── skeleton.tsx
│   │   │   ├── sparkline.tsx           # tiny inline SVG trend line, real data only
│   │   │   └── textarea.tsx            # implemented, Phase 5 — styled to match input.tsx
│   │   ├── layout/                     # app shell (implemented, Phase 2)
│   │   │   ├── app-shell.tsx           # client: holds shared mobile-nav-open state
│   │   │   ├── sidebar.tsx             # persistent nav, desktop/tablet
│   │   │   ├── mobile-nav.tsx          # slide-over drawer, mobile
│   │   │   ├── topbar.tsx
│   │   │   ├── account-menu.tsx        # user menu + sign-out
│   │   │   └── nav-items.ts            # shared nav config (Overview/Users/Leads/Settings)
│   │   ├── dashboard/                  # implemented, Phase 3
│   │   │   ├── stats-cards.tsx         # real stat cards (async Server Component)
│   │   │   ├── stats-cards-skeleton.tsx
│   │   │   ├── recent-leads-card.tsx   # real "recent leads" list (async Server Component)
│   │   │   └── recent-leads-skeleton.tsx
│   │   ├── users/                      # implemented, Phase 4/4A/4B
│   │   │   ├── users-toolbar.tsx       # client: search (debounced) + role/status filters, URL-driven
│   │   │   ├── pagination-controls.tsx # server component: Previous/Next links — reused as-is by leads/
│   │   │   ├── user-detail-panel.tsx   # client: read-only ⇄ edit-mode toggle (useEditMode) + self-lockout guard UI
│   │   │   └── invite-user-dialog.tsx  # client: Dialog + useActionState invite form (Phase 4B)
│   │   ├── leads/                      # implemented, Phase 5
│   │   │   ├── leads-toolbar.tsx       # client: search (debounced) + status/source filters, URL-driven
│   │   │   ├── create-lead-dialog.tsx  # client: Dialog + useActionState create form
│   │   │   ├── lead-detail-panel.tsx   # client: read-only ⇄ edit-mode toggle (useEditMode), incl. assigned_to
│   │   │   └── delete-lead-dialog.tsx  # client: Dialog + useActionState delete confirmation
│   │   └── auth/                       # implemented, Phase 4C
│   │       ├── auth-callback-client.tsx # client: invite-link token exchange
│   │       └── set-password-form.tsx    # client: useActionState-driven password-setup form
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser client
│   │   │   ├── server.ts               # server component / server action client
│   │   │   └── admin.ts                # SERVER-ONLY: SUPABASE_SECRET_KEY admin client (Phase 4B)
│   │   ├── auth/
│   │   │   ├── actions.ts              # login/logout + setPasswordAction (Phase 4C) server actions
│   │   │   └── require-admin.ts        # requireActiveAdmin() — session-scoped authorization gate (Phase 4B, reused by Phase 5's lead actions)
│   │   ├── dashboard/
│   │   │   └── stats.ts                # overview stats + recent-leads data access (Phase 3); formatCurrency reused by Phase 5
│   │   ├── users/
│   │   │   ├── queries.ts              # listUsers, getUserById (Phase 4)
│   │   │   └── actions.ts              # updateUserAction (self-lockout guard) + inviteUserAction (Phase 4B)
│   │   ├── leads/                      # implemented, Phase 5
│   │   │   ├── queries.ts              # listLeads, getLeadById, listAssignableProfiles
│   │   │   ├── validation.ts           # Zod schema — full CRUD input validation
│   │   │   └── actions.ts              # createLeadAction, updateLeadAction, deleteLeadAction
│   │   └── utils.ts                    # shared helpers (cn, blockImplicitSubmit, etc.)
│   ├── hooks/
│   │   └── use-edit-mode.ts            # implemented — shared read-only⇄edit-mode toggle state, used by leads/users detail panels
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
No dedicated stats table. The overview page computes aggregates on read via `src/lib/dashboard/stats.ts`, using the signed-in admin's own Supabase session (no service role, no schema/RLS changes). Exact definitions, as implemented:

| Stat | Definition |
|---|---|
| Total users | `count(*)` from `profiles` where `role = 'user'` |
| Total leads | `count(*)` from `leads`, unfiltered |
| Active leads | `count(*)` from `leads` where `status in ('new','contacted','qualified')` |
| Won this month | `sum(value_estimate)` from `leads` where `status = 'won'` and `created_at` is within the current calendar month (summed client-side over the matching rows — no DB-side `SUM`/view added) |

Trend comparisons (this month vs previous calendar month, UTC month boundaries):
- **Total users / Total leads**: count of rows *created* this month vs last month (a growth-rate signal, distinct from the cumulative headline value, which by definition never decreases).
- **Won this month**: same definition, shifted to the previous month's date range.
- **Active leads — documented limitation**: a true "vs previous month-end" comparison would require knowing what a lead's status *was* as of a past date, but the schema has no audit/history table recording status-over-time — only the *current* status plus `created_at` exist. Inventing that history was rejected. The substitute implemented instead is real and computable: among *currently* active leads, how many were created this month vs last month — a pipeline-freshness signal, not a point-in-time reconstruction. Revisit if `activity_log` (deferred, see Open Questions) is ever added.

When the previous period's count/value is zero, the trend falls back to an absolute label (e.g., "+3 new users vs last month") instead of a percentage, to avoid a divide-by-zero or fabricated growth rate.

Revisit with a dedicated view/materialized view only if performance requires it — not needed at current scale.

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

The same two-layer gap resurfaced for `service_role` in Phase 7A — see `supabase/migrations/20260921150000_grant_service_role_leads.sql`. `service_role` bypasses RLS entirely by design, but still needs the base table grant, and nothing had used it for a direct table operation on `leads` before Phase 7A's demo-seed script (Phase 4B's admin-client usage only ever called the Auth Admin API, a different code path that doesn't go through this grant check at all).

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

4. **Phase 3 — Dashboard Statistics** — complete
   - [x] Real stat cards (total users, total leads, active leads, won this month) backed by live Supabase queries, each with a period-over-period trend.
   - [x] Real "Recent leads" list (newest 5), with loading (`Suspense` + `Skeleton`), empty (`EmptyState`), and error states.
   - [x] Data-access layer under `src/lib/dashboard/stats.ts`; presentation split into `src/components/dashboard/`.

5. **Phase 4 — User Management** — complete
   - [x] User list with real search, role/status filtering, and server-side pagination (URL-preserved).
   - [x] User detail view with real profile data.
   - [x] Update user records (`full_name`, `role`, `status`) against `profiles`, with a self-lockout guard. `email` is read-only by design (see Decisions Log — Phase 4A); `avatar_url` editing was dropped in the Phase 4A narrowing.
   - [x] Invite user (Phase 4B): real `supabase.auth.admin.inviteUserByEmail()` via a server-only admin client, gated by an application-layer active-admin check. "Disable" is covered by the existing `status` field, not a separate delete/deactivate flow; auth-user deletion is still not implemented (not requested).
   - [x] Invite acceptance / password setup (Phase 4C): `/auth/callback` + `/set-password` let an invited user turn their emailed invite into a working login — verified end-to-end with a real invite email (invite link → session → password set → sign-out → sign back in with the new password), with `role='user'`/`status='active'` confirmed unchanged and no UI path to choose either during onboarding.

6. **Phase 5 — Leads Management** — complete
   - [x] Lead list with real search (`full_name`/`company`/`email`), status/source filtering, and server-side pagination (10/page, URL-preserved: `?q=&status=&source=&page=`).
   - [x] Lead detail view with real data, including the assigned admin's name/email.
   - [x] Create lead (`full_name`, `company`, `email`, `phone`, `source`, `status`, `value_estimate`, `notes`; defaults to `status='new'`), via the existing `Dialog` primitive, Zod-validated server-side.
   - [x] Edit lead (same fields plus `assigned_to`), inline on the detail page.
   - [x] Delete lead, with a confirmation dialog, success banner, and redirect back to `/leads`.
   - [x] Assignment restricted to active admins (`profiles` where `role='admin' AND status='active'`) — leads are worked by staff, not the platform users managed in `/users`.
   - [x] Overview stats/Recent Leads (Phase 3) confirmed to update live after create/edit/delete via `revalidatePath`.

7. **Phase 6 — Polish Pass** — complete
   - [x] Accessibility: dialogs now have real accessible names (`aria-labelledby`/`aria-describedby` wired to `DialogTitle`/`DialogDescription` via context); table headers use `scope="col"`; `CardTitle` fixed from h3→h2 so every page's heading outline reads h1→h2 without skipping a level; the mobile nav drawer is `inert` (not just `aria-hidden`) while closed, and returns focus to its trigger button on close (a real bug the browser was flagging: focus could get stranded on a now-hidden element); required fields get a visual `*` where a form genuinely mixes required and optional fields.
   - [x] Loading states: added the one missing route-level `loading.tsx` (`/settings`) — every data-backed page now has one.
   - [x] Empty states: fixed a real copy bug on `/users` — the empty state always said "No users match your filters" (with a "Clear filters" link) even with zero filters active; now matches `/leads`'s pattern of distinguishing a genuinely empty list from a filtered-to-nothing one.
   - [x] Edge cases: found and fixed two real bugs while testing "page beyond available range" — (1) PostgREST doesn't return an empty page past the end, it errors (`PGRST103: Requested range not satisfiable`), which `listUsers`/`listLeads` now catch and clamp to the real last page instead of showing a generic error; (2) the search toolbars' debounce effect fired unconditionally on mount and unconditionally stripped `?page=`, so *any* direct/bookmarked/shared `?page=N` link silently reset to page 1 after ~300ms regardless of whether N was in range — fixed by skipping the effect when the local search state already matches the URL. Also verified long names/companies/emails and a large (`$987,654,322`) value render cleanly (table cells truncate via a new `max-w` + `truncate` treatment; the detail page wraps normally).
   - [x] Responsive: found and fixed a real tablet-width bug — the Users/Leads toolbars' two fixed `sm:w-44` filter selects could squeeze the search input down to ~50px (icon-only, placeholder invisible) at in-between widths; both toolbars now `flex-wrap` with a `min-w-[12rem]` floor on the search box, so filters wrap to their own row instead of crushing search. Verified at 375×812, 768×1024, and 1440×900 across Overview, Users, user detail (read + edit), Invite user, Leads, Add lead, lead detail (read + edit), Settings, and all dialogs — no other overflow/clipping found.
   - [x] Security regression: re-confirmed via code review (nothing in this phase touched auth/authorization files) — `src/lib/supabase/admin.ts` still imported from exactly one place, `SUPABASE_SECRET_KEY` never referenced outside it, the dashboard's fail-closed `role==='admin' && status==='active'` check untouched, and the self-lockout guard in `updateUserAction` untouched (all confirmed by diff + grep, and the self-lockout block was also freshly re-verified live during the edit-UX work earlier this phase).
   - [x] Performance sanity: reviewed for duplicate queries, unnecessary client components, and oversized dependencies — nothing found; no large refactor was warranted.

8. **Phase 7 — Deployment & Portfolio Readiness**
   - [x] **Phase 7A — Portfolio Demo Data** — complete. See Status/Decisions Log for the seed strategy, dataset, and verification.
   - [x] **Phase 7B — Portfolio Documentation** — complete. Added `README.md` (overview, features, tech stack, architecture, security highlights, demo-data disclosure, dev setup, screenshots, project status, and a copy-ready portfolio summary).
   - [x] **Phase 7C — Production Deployment and Portfolio Finalization (readiness only — see below)** — real screenshots captured (`public/screenshots/`), all code-side production-readiness changes made (`NEXT_PUBLIC_APP_URL`, no hardcoded localhost), GitHub/Vercel readiness reviewed, exact Supabase redirect URLs documented for post-deployment, a production QA plan drafted, and portfolio copy written. **Not done yet, and deliberately left for the user:** the actual `git push` to a new GitHub remote, the actual Vercel deployment, and adding the Supabase Site URL/Redirect URL in the dashboard (all require account-specific choices — repo owner, Vercel project, final domain — that shouldn't be assumed).

Each phase should be completed and reviewed before starting the next. Update this file's **Status** section as phases complete.

### Phase 7C — Production QA plan (for after deployment)

Not yet run — there is no deployed URL yet. Once deployed, verify against the
real production URL (adjust the base URL, otherwise identical to local
QA):

- **Login**: valid credentials succeed; invalid credentials show the
  existing generic error; unauthenticated access to any `(dashboard)` route
  redirects to `/login`.
- **Overview**: all four stat cards and their trends load from real data
  (no hydration/console errors); Recent Leads renders.
- **Users**: list/search/role-filter/status-filter/pagination all work
  against production data; a user's detail page loads, edit-mode toggles,
  Cancel discards, Save persists.
- **Invite dialog**: opens, validates required fields, shows the
  loading/success/error states — **do not actually submit a real invite
  without explicit approval**, since that sends a real email in production
  exactly as it does locally.
- **Leads**: list/search/status-filter/source-filter/pagination; create,
  edit, and delete against **one clearly-fictional throwaway lead** created
  for this QA pass and removed afterward, the same discipline used for
  every local Playwright pass in this project — never test destructive
  actions against the real seeded demo dataset.
- **Detail pages**: both `/users/[id]` and `/leads/[id]` for a real
  (fictional) record, plus an invalid/malformed id on each to confirm the
  friendly "not a valid ID" state still works in production.
- **Settings**: renders the signed-in admin's real profile data.
- **Mobile layout**: 375×812 pass across Overview/Users/Leads/dialogs —
  same checklist as Phase 6's polish pass, re-verified against production
  (a different Vercel edge/build environment than local dev could in
  principle surface something local testing didn't).
- **Unauthorized user behavior**: sign in as (or simulate) a non-admin
  session and confirm `(dashboard)` renders "Access restricted", never the
  real dashboard content — this is the single most important production
  check, since it's the app's core security guarantee.

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
- **2026-09-21** — Phase 2 polish pass (post manual browser review): centered dashboard content to `max-w-6xl`, softened the sidebar/topbar (subtle neutral bg, lighter active-nav treatment, reduced height), added a real `Sparkline` primitive for stat-card trends, redesigned the "Recent leads" list (avatars, relative dates, dotted status badges — the `dot` prop added to `Badge` as an opt-in, so `Users`/`Leads` pages stayed visually unchanged), and replaced the developer-facing "Phase 3" placeholder copy with normal product copy. No auth/DB/RLS/route changes.
- **2026-09-21** — Phase 3 (Dashboard Statistics): replaced all demo content on the Overview page with real Supabase queries. Added `src/lib/dashboard/stats.ts` (`getOverviewStats`, `getRecentLeads`) as the data-access layer, and `src/components/dashboard/{stats-cards,recent-leads-card}.tsx` (+ matching `-skeleton.tsx` fallbacks) as async Server Components streamed independently via React `Suspense` — this is what makes the existing `Skeleton` primitive actually show a loading state without any client-side JS. Each section fails independently and shows a generic message plus only the Postgres/PostgREST error *code* (never the raw message) on failure; errors are always logged server-side, never discarded. Zero leads renders the existing `EmptyState`, never fake rows. Documented the one trend that couldn't be computed as literally specified — "Active leads vs previous month-end" — since no audit/history table exists to reconstruct a past point-in-time status count; substituted an honest, computable proxy instead (see Database Schema → Dashboard statistics). No schema, RLS, or auth changes. Reused the same real-data pattern (2-point `[previous, current]` series) for sparklines rather than inventing a smooth historical shape.
- **2026-09-21** — Phase 4 (User Management): real search/filter/pagination against `public.profiles` (`src/lib/users/queries.ts`), URL-driven so state survives reload/back-forward. Search uses PostgREST `.ilike()` via `.or()`; search terms are double-quote-wrapped (PostgREST's documented escape) since `.or()`'s filter string itself uses commas/parens as delimiters — a raw search term containing either would otherwise have corrupted the query. **Security finding**: neither RLS nor the `guard_profiles_protected_fields` trigger prevents an active admin from demoting or disabling *themselves* — both only check "is the caller currently an active admin" via `is_admin()`, which (by Postgres MVCC/snapshot semantics, one snapshot per statement) still evaluates true against the pre-update row, right up until the update they're making commits. Per this phase's explicit instructions, this was deliberately handled at the application layer instead of by modifying RLS/the trigger: `updateUserAction` (`src/lib/users/actions.ts`) rejects a self-role-change-away-from-admin or self-status-change-away-from-active before ever calling `.update()`, with a clear explanatory message. This is a known layering gap worth a future DB-level hardening pass if this app's threat model ever changes (e.g., a future direct-SQL or different code path wouldn't have this app-layer check). Also discovered and documented in the UI: editing another user's `email` only changes the denormalized `profiles.email` copy, not their real Supabase Auth sign-in email — changing *someone else's* actual login email requires the Admin API (`service_role`), which is out of scope. "Invite user" stays disabled with a "coming later" caption for the same reason. No RLS, grants, or schema were modified — everything from Phase 1 already supported this phase's needs.
- **2026-09-21** — Phase 4A (edit-scope narrowing, on top of Phase 4): the edit form's allowed fields were tightened to exactly `full_name`, `role`, `status` per this phase's explicit spec — `avatar_url` editing (added in the initial Phase 4 pass) was removed, and `email` was changed from editable to **read-only**, shown with an inline explanation (updating `profiles.email` alone would silently desync it from the Auth user's real sign-in email, which this app has no `service_role` access to also update). `updateUserAction` no longer reads or writes `avatar_url`/`email` from `formData` at all, so removing those inputs can't accidentally null out existing data. Also added `updated_at` to the user detail view (query + display) and a clearer message for a malformed `[id]` (Postgres `22P02` "invalid UUID syntax" → "That doesn't look like a valid user ID" instead of the generic query-failure text). No RLS/schema changes.
- **2026-09-21** — Phase 4B (Invite User): this phase explicitly authorized and required the `SUPABASE_SECRET_KEY` admin client that every prior phase had deliberately avoided — added `src/lib/supabase/admin.ts`, guarded by the `server-only` package (build-time enforced, not just convention) and imported from exactly one place, `src/lib/users/actions.ts`. Authorization is a separate step, `requireActiveAdmin()` (`src/lib/auth/require-admin.ts`), run against the normal session-scoped client *before* the admin client is ever created — the secret key grants no authorization by itself. `full_name` goes to Supabase as auth metadata only; the inviter cannot set `role`/`status` — `handle_new_user()` (untouched, per this phase's explicit instruction) creates the resulting profile exactly as it does for self-signup. Noted a pre-existing schema/behavior mismatch without fixing it (also per explicit instruction): `profiles.status` has an `'invited'` value that would semantically fit better here than `'active'`, but the trigger doesn't distinguish invite-created accounts from self-signups — worth revisiting later. `NEXT_PUBLIC_SITE_URL` (new, optional, public) builds the invite email's `redirectTo`; documented that production needs both that env var set and the same URL allow-listed in the Supabase Dashboard. `SUPABASE_SECRET_KEY` added to `.env.example` only (empty, server-only warning) — never written to `.env.local`, which stays the user's manual step and remains confirmed gitignored.
- **2026-09-21** — Phase 4C (Invite Acceptance / Password Setup): closed the loop Phase 4B left open — `/auth/callback` (client component, using the browser Supabase client) exchanges an invite link's tokens for a real session regardless of which of the three shapes Supabase sends them in (hash fragment, PKCE `code`, or OTP `token_hash`), then `/set-password` (server component + `setPasswordAction`) lets that session set a real password via `supabase.auth.updateUser()` before redirecting to `/login` with a success banner. `inviteUserAction`'s `redirectTo` now points at `/auth/callback` instead of `/login`. Neither route touches `SUPABASE_SECRET_KEY`, RLS, or `profiles.role`/`status` — `handle_new_user()` remains the only thing that ever sets those. `proxy.ts`'s `PUBLIC_PATHS` gained both routes so each can render its own "invalid link" / "session expired" state instead of the proxy's default redirect-to-login. The real invite-email → click → redeem cycle was left for manual testing, per explicit instruction not to auto-submit a real invite through Playwright.
- **2026-09-21** — Phase 4C end-to-end verification: a real invite was sent and redeemed against the live Supabase project. Every step passed — invite link → `/auth/callback` session establishment → `/set-password` render → validation (short password rejected client-side, mismatched passwords rejected server-side) → valid password accepted → signed out → `/login` confirmation banner → re-login with the new password → confirmed via the admin Users list that the account is still exactly `role='user'`, `status='active'`. **Phase 4C is complete.**
- **2026-09-21** — Phase 5 (Leads Management): replaced all demo lead content with real `public.leads` CRUD, following Phase 4's established patterns rather than inventing new ones — `src/lib/leads/{queries,actions}.ts` mirror `src/lib/users/{queries,actions}.ts`'s shape (same pagination/search-escaping approach, same `requireActiveAdmin()` gate, same generic-error-message/never-raw-Supabase-error discipline). This phase is what finally introduced **Zod** (`src/lib/leads/validation.ts`), which PROJECT.md had listed as "planned" since Phase 0 — full create/edit validation (required `full_name`, email format, non-negative `value_estimate`, constrained `status`/`source` enums, UUID-checked `assigned_to`) now runs server-side regardless of what the client sends. **Assignment scoping decision**: `assigned_to` is restricted to `profiles` where `role='admin' AND status='active'`, not to any authenticated profile — the platform users managed in `/users` are customers/managed accounts (per the Overview's own description), not staff who'd be assigned a sales lead. No new migration was needed: `leads_admin_all` RLS and the `authenticated` table grants from Phase 1 already covered every operation this phase needed (select/insert/update/delete). Reused rather than duplicated: `PaginationControls` (Phase 4, already fully generic) and `formatCurrency` (Phase 3). Added one new design-system primitive, `Textarea`, for the `notes` field — first new `components/ui/` addition since the Phase 2 polish pass's `Sparkline`. Verified via Playwright: create, search, status/source filters, empty/no-results states, real pagination (created 11 fictional test leads to force a second page), inline edit (including a bypassed-native-validation check that server-side Zod actually rejects a malformed email, not just the browser), assignment, delete (with cancel-doesn't-delete confirmed separately from confirm-does-delete), invalid-lead-id handling, and mobile layout for the list/dialog/detail/edit views — then all fictional test leads were deleted, restoring the empty state.
- **2026-09-21** — Standardized the explicit edit-mode UX pattern across every editable detail screen: `/leads/[id]` and `/users/[id]` both default to read-only with a header **Edit lead**/**Edit user** button, Cancel discards and restores persisted values, Save is the only thing that submits, and Enter inside a text input no longer implicitly submits the form. Extracted the shared toggle bookkeeping into `useEditMode()` (`src/hooks/use-edit-mode.ts` — first use of that previously-empty planned folder) and the Enter-key guard into `blockImplicitSubmit` (`src/lib/utils.ts`), used by both `lead-detail-panel.tsx` and the new `user-detail-panel.tsx` (replacing `user-edit-form.tsx`) — the toggle state machine is shared, but each screen keeps its own fields/layout/security rules, per explicit instruction not to over-abstract. All Phase 4/4A user-security behavior re-verified unchanged: email still read-only, self-role/self-status lockout guard still rejects with its original message, `id`/`created_at` still never editable. `/settings` was left untouched — it has no editable fields today, and adding an edit mode where none exists would be expanding scope/permissions beyond what this pass was for.
- **2026-09-21** — Phase 6 (Polish Pass): a full accessibility/responsive/edge-case review, scoped deliberately to fixes rather than redesign — no visual language, spacing scale, or component API changed in a way that would alter how existing screens look. Found and fixed 5 genuine bugs, not just polish: dialogs had no accessible name (fixed via a `useId()`-based context wiring `aria-labelledby`/`aria-describedby` in `Dialog`); the mobile nav drawer could strand keyboard focus on close (the browser was actively warning about it) — fixed by sharing a ref through `AppShell`→`Topbar`/`MobileNav` so closing returns focus to the hamburger button, and making the drawer `inert` (not just `aria-hidden`) while closed; `?page=` beyond the real range broke two separate ways — PostgREST errors (`PGRST103`) rather than returning empty data past the end (now caught and clamped to the real last page in `listUsers`/`listLeads`), and independently, both toolbars' debounced search `useEffect` fired unconditionally on mount and always stripped `page` from the URL, so *any* direct/bookmarked `?page=N` link — in range or not — silently reset to page 1 after ~300ms; a tablet-width layout bug where the toolbars' two fixed `sm:w-44` selects could squeeze the search input down to an unusable ~50px icon-only box (fixed with `flex-wrap` + a `min-w-[12rem]` floor); and a `/users` empty-state copy bug that always said "No users match your filters" even with no filters active. Smaller fixes: added the one missing route `loading.tsx` (`/settings`), `CardTitle` h3→h2 (was skipping a heading level under every page's h1), `scope="col"` on table headers, a visual required-field `*` on the two forms that actually mix required/optional fields, and `truncate`+`max-w` on list-row name/email cells (verified against a fictional lead with an intentionally very long name/company/email and a $987,654,322 value). Security regression re-confirmed via `git diff` + `grep` rather than re-running every manual test: no file in `src/lib/auth/`, `src/lib/supabase/`, `(dashboard)/layout.tsx`, or `proxy.ts` was touched, so the fail-closed admin check, the self-lockout guard, and the `SUPABASE_SECRET_KEY` isolation (still one importer) all carry forward unchanged.
- **2026-09-21** — Phase 7A (Portfolio Demo Data): seeded 25 fictional leads via `supabase/seed.sql` (idempotent, hardcoded ids, `.test`-domain emails, 555-01xx phone numbers — all fictional, per explicit instruction). Deliberately did **not** create any demo `profiles`/`auth.users` rows via SQL — that would either violate the `profiles.id → auth.users.id` FK or create an orphaned, unable-to-sign-in profile; `seed.sql` documents the safe alternative (Admin API `createUser`, or the existing Invite flow) as future work instead. Applying the seed surfaced a real gap: `service_role` had never been granted table privileges on `public.leads` (only `authenticated` was, back in Phase 1) — nothing had used the admin client for a direct table operation before (Phase 4B only ever called the Auth Admin API, a different path). Fixed with a new, narrowly-scoped migration (`20260921150000_grant_service_role_leads.sql`, 2 lines, no RLS/policy change) rather than editing the already-applied Phase 1 migration, applied by the user via the SQL Editor per this project's established practice. Dates were weighted across the past ~2.5 months specifically so both this-month and last-month sides of `getOverviewStats`'s trend comparisons have real data — verified live: Won this month landed at exactly $39,550 (the sum of the two September `won` seed rows), down 46.2% from August's $73,500, a deliberately realistic mixed result rather than a suspiciously all-positive demo. Verified via Playwright at 1440px and 375×812: Overview stats/trends/Recent Leads, and Leads search/status-filter/source-filter/pagination, all reflect the new counts correctly; a seeded lead's detail/edit views were checked read-only (Cancel, never Save) to avoid disturbing the curated dataset, while create/delete were verified against a separate throwaway lead created and removed for that purpose, leaving all 25 seed rows intact.
- **2026-09-21** — Phase 7B (Portfolio Documentation): added `README.md`, the project's first — this repo previously had no README at all. Covers project overview/audience/positioning, a full feature list, tech stack, an architecture summary (rendering model, the three-Supabase-client trust-level split, schema, RLS, server-only secret handling), a dedicated security-highlights section, an explicit demo-data-is-fictional disclosure, a development section (install/env-var-names-only/dev/lint/build/migration+seed notes — no real values), a screenshots section left as explicit TODOs (no invented image paths, since none exist yet), current project status (Phases 1–6 and 7A complete, deployment/production QA and the screenshots themselves still pending), and a standalone 5-sentence portfolio/case-study summary meant to be copied as-is into Upwork/GitHub/a personal site. Written to be read by a prospective client, not a contributor — no tutorial-style explanation of how Next.js or Supabase work in general, only what's specific to this project's own design decisions.
- **2026-09-21** — Phase 7C (Production Deployment and Portfolio Finalization) — readiness work, deployment itself deliberately left to the user: created one fictional Supabase Auth user (`jordan.lee@dashpilot.test`, via `auth.admin.createUser` with a generated password that was never printed/logged/stored — this account exists only to be viewed, never logged into) specifically so the User Detail screenshot wouldn't have to use a real account. Auditing the screenshots already taken then surfaced a second real-data leak: a pre-existing lead (from early Phase 4C manual testing, unrelated to the Phase 7A seed) had a real personal email as its contact address, which appeared in both the Overview and Leads screenshots — fixed by editing that one lead's email to a fictional `.test` address via the normal Edit Lead flow (a legitimate use of an existing feature, not a data-model change). The Users-list screenshot uses a `?q=jordan` filter to show only the fictional account rather than the three real ones — also doubles as an honest demonstration of the search feature. **Production-readiness code changes**: renamed `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL` (`src/lib/users/actions.ts`, `.env.example`) per this phase's explicit naming — same fallback-to-`localhost:3000` behavior, no functional change, just a rename ahead of deployment; confirmed via `grep` that this was the only hardcoded-`localhost` code path in the app. **GitHub readiness confirmed**: `.env.local` ignored, `SUPABASE_SECRET_KEY` untracked (only an empty placeholder in `.env.example`), no Playwright artifacts or temp scripts tracked, working tree otherwise clean. **No remote exists yet** — repo name, connect/push commands, and the exact Supabase Redirect URL to add post-deployment are all in this session's report to the user, not assumed or acted on unilaterally. Deployment itself, the actual `git push`, and adding the Supabase Site URL/Redirect URL were explicitly left for the user, since each requires an account-specific choice (repo owner, Vercel project, final domain) this session has no basis to assume.

## Open Questions
- Auth method: email/password only, or also magic link / OAuth (e.g., Google) for a smoother demo login?
- Charting library for dashboard statistics (e.g., Recharts vs. Tremor vs. custom) — decide in Phase 3.
- Table/data-grid approach: build custom table components vs. adopt a headless table library (e.g., TanStack Table) — decide in Phase 2.
- Is `activity_log` worth the scope in v1, or better deferred to a "v2 polish" pass?
- Seed data strategy for the demo deployment: fully synthetic vs. loosely realistic fictional company data.

---

This file is the shared source of truth for the project. Both Claude Code and OpenAI Codex read this file before making changes and should keep it up to date as the project evolves.
