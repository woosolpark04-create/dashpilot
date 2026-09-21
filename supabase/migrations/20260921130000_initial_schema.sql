-- DashPilot initial schema: profiles, leads, updated_at triggers, and RLS.
-- Phase 1 database foundation. No auth UI or seed data here.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  company text,
  source text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  value_estimate numeric,
  notes text,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_assigned_to_idx on public.leads (assigned_to);
create index if not exists leads_status_idx on public.leads (status);

-- ---------------------------------------------------------------------------
-- updated_at trigger support
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin-check helper (SECURITY DEFINER to avoid recursive RLS on profiles)
-- ---------------------------------------------------------------------------

-- A policy on `profiles` that queries `profiles` to check the caller's role
-- would normally re-trigger the same RLS policy against itself. Marking this
-- function SECURITY DEFINER makes it run with the function owner's
-- privileges, bypassing RLS for this internal lookup only, which breaks the
-- recursion. `search_path` is pinned to the empty string (rather than just
-- `public`) so name resolution can't be redirected even within `public`
-- itself; every reference below is schema-qualified so this is safe. A
-- disabled admin must not pass admin-gated policies, so `status = 'active'`
-- is part of the admin check itself, not bolted on separately per policy.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- Only the `authenticated` role ever needs to call this from an RLS
-- expression; revoking the default PUBLIC grant keeps it least-privilege.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Guard protected profile fields (identity/audit + privilege fields)
-- ---------------------------------------------------------------------------

-- Two tiers, both enforced regardless of which RLS policy let the UPDATE
-- through:
--   1. `id` and `created_at` are immutable for every caller, including
--      admins — there's no legitimate reason to ever change them post-insert,
--      and profiles_update_admin's `with check` only requires is_admin(), so
--      without this an admin could otherwise repoint a profile's identity.
--   2. `email`, `role`, `status` may only change when the caller is an
--      active admin (`public.is_admin()`), on any row including their own.
--      `full_name`/`avatar_url` are deliberately left unguarded here and
--      stay self-editable via the profiles_update_own policy below.
-- `is distinct from` (not `<>`) is used throughout so a null-involving
-- comparison can't silently evaluate to NULL/false and slip an unauthorized
-- change past the check. Runs as SECURITY INVOKER (no `security definer`):
-- it only reads the OLD/NEW row the trigger call already supplies and
-- delegates the actual permission decision to `public.is_admin()`, which is
-- itself already elevated — so this function needs, and has, no privileges
-- of its own.
create or replace function public.guard_profiles_protected_fields()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'insufficient_privilege: id is immutable';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'insufficient_privilege: created_at is immutable';
  end if;

  if (
    new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.status is distinct from old.status
  ) and not public.is_admin() then
    raise exception 'insufficient_privilege: only an active admin may change email, role, or status';
  end if;

  return new;
end;
$$;

-- Trigger invocation isn't gated by EXECUTE privilege, but revoking the
-- default PUBLIC grant signals this is never meant to be called directly.
revoke all on function public.guard_profiles_protected_fields() from public;

drop trigger if exists enforce_role_change_requires_admin on public.profiles;
drop trigger if exists enforce_profile_privilege_guard on public.profiles;
drop trigger if exists enforce_profile_field_guard on public.profiles;
create trigger enforce_profile_field_guard
  before update on public.profiles
  for each row
  execute function public.guard_profiles_protected_fields();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.leads enable row level security;

-- profiles: a user may read their own row; admins may read every row.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- profiles: a user may update their own row — id/created_at (immutable) and
-- email/role/status (admin-only) are all blocked by the
-- enforce_profile_field_guard trigger above regardless of which policy
-- matched, so only full_name/avatar_url are actually self-editable. Admins
-- may update any row (the trigger still applies; is_admin() requires an
-- active admin, so a disabled admin gets the same restrictions as a normal
-- user, including on their own row).
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- leads: admin-only read/write, no self-service access for regular users.
create policy "leads_admin_all"
  on public.leads
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
