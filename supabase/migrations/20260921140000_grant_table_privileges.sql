-- Grant base table privileges required before RLS can be evaluated.
--
-- RLS policies restrict *which rows* a role can see/touch, but Postgres
-- still requires the ordinary GRANT system to allow the operation on the
-- table at all — RLS is only consulted once the base privilege check has
-- already passed. The initial migration enabled RLS and wrote policies on
-- `profiles`/`leads` but never granted the underlying table privileges to
-- `authenticated`, so every request failed with
-- "42501: permission denied for table profiles" before RLS was ever
-- evaluated. This migration fixes that; it changes no RLS policy.

grant usage on schema public to authenticated;

-- profiles: SELECT/UPDATE only. No INSERT — new profiles are created
-- exclusively by the SECURITY DEFINER public.handle_new_user() trigger on
-- auth.users, which runs with the function owner's privileges and needs no
-- grant to `authenticated`. No DELETE — a profile is removed only as a
-- side effect of its auth.users row being deleted (on delete cascade), not
-- via a direct client-issued DELETE.
grant select, update on public.profiles to authenticated;

-- leads: full CRUD grant, but this only says "authenticated may attempt
-- these operations" — the existing `leads_admin_all` RLS policy
-- (using/with check public.is_admin()) still decides per row whether an
-- individual authenticated user's request actually succeeds. A non-admin
-- authenticated user can now reach RLS instead of failing at the grant
-- check, and RLS still denies them every row.
grant select, insert, update, delete on public.leads to authenticated;

-- Explicit belt-and-suspenders: `anon` must not have table-level access to
-- either table. Supabase's default privileges don't grant this to begin
-- with, but revoking makes the guarantee explicit rather than implicit.
revoke all on public.profiles from anon;
revoke all on public.leads from anon;
