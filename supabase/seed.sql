-- ============================================================================
-- DashPilot demo seed data — Phase 7A (Portfolio Demo Data)
--
-- Everything below is 100% FICTIONAL. Names, companies, emails, phone
-- numbers, and notes are invented for demo purposes only and do not
-- reference any real person, company, or organization. Email domains use
-- the `.test` TLD, which is permanently reserved by IETF RFC 2606 for
-- exactly this purpose (guaranteed to never resolve to a real domain).
-- Phone numbers use the 555-01xx block reserved for fictional use in
-- North American media/telecom conventions.
--
-- Scope: `public.leads` only. This file intentionally does NOT insert any
-- rows into `public.profiles` (or, obviously, `auth.users`) — see the
-- "Demo users" note at the bottom for why, and what the safe alternative
-- looks like if demo user accounts are ever wanted.
--
-- Idempotent: every row uses a fixed, hardcoded id (10000000-0000-4000-
-- 8000-0000000000xx — deliberately recognizable as seed data, and
-- guaranteed never to collide with a real gen_random_uuid() lead) and
-- `on conflict (id) do nothing`, so re-running this file is always safe
-- and never creates duplicates.
--
-- How to apply (pick whichever is available to you):
--   - Supabase Dashboard → SQL Editor → paste and run this file.
--   - Supabase CLI:  supabase db execute -f supabase/seed.sql
--                    (or `supabase db reset`, which runs seed.sql automatically
--                    after migrations on a local dev database)
--   - psql:          psql "$DATABASE_URL" -f supabase/seed.sql
--
-- `assigned_to` references the one real, already-existing active admin
-- profile in this project (id below) — never a fabricated id — so the FK
-- to public.profiles stays valid. If you're applying this to a different
-- Supabase project, replace that id with a real admin's profiles.id first,
-- or leave those rows unassigned (NULL) by removing the value.
-- ============================================================================

insert into public.leads
  (id, full_name, email, phone, company, source, status, value_estimate, notes, assigned_to, created_at)
values
  ('10000000-0000-4000-8000-000000000001', 'Jordan Ellis', 'jordan.ellis@nimbuscloudworks.test', '(555) 010-0101', 'Nimbus Cloud Works', 'website', 'won', 18500, 'Signed annual contract after a successful pilot.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-07-10T14:32:00Z'),
  ('10000000-0000-4000-8000-000000000002', 'Priya Anand', 'priya.anand@granitepeaklogistics.test', '(555) 010-0102', 'Granite Peak Logistics', 'referral', 'lost', 6200, 'Went with a competitor offering a lower rate.', null, '2026-07-14T09:15:00Z'),
  ('10000000-0000-4000-8000-000000000003', 'Marcus Whitfield', 'marcus.whitfield@brightleafmarketing.test', '(555) 010-0103', 'BrightLeaf Marketing', 'cold_outreach', 'lost', 3100, 'Not the right fit for their budget this year.', null, '2026-07-18T16:47:00Z'),
  ('10000000-0000-4000-8000-000000000004', 'Elena Vasquez', 'elena.vasquez@ferrousmetalworks.test', '(555) 010-0104', 'Ferrous Metalworks', 'other', 'won', 27500, 'Referred by an industry trade show contact.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-07-22T11:05:00Z'),
  ('10000000-0000-4000-8000-000000000005', 'Tobias Lindgren', 'tobias.lindgren@solsticeanalytics.test', '(555) 010-0105', 'Solstice Analytics', 'website', 'lost', 4800, 'Project got shelved after a budget freeze.', null, '2026-07-26T13:20:00Z'),

  ('10000000-0000-4000-8000-000000000006', 'Aisha Rahman', 'aisha.rahman@cobaltridgeconsulting.test', '(555) 010-0106', 'Cobalt Ridge Consulting', 'referral', 'qualified', 15200, 'Strong interest, evaluating against two other vendors.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-08-02T10:10:00Z'),
  ('10000000-0000-4000-8000-000000000007', 'Connor Blake', 'connor.blake@willowbrookrealty.test', '(555) 010-0107', 'Willowbrook Realty Group', 'website', 'contacted', 9400, 'Requested a follow-up demo next week.', null, '2026-08-06T15:38:00Z'),
  ('10000000-0000-4000-8000-000000000008', 'Naomi Osei', 'naomi.osei@meridianhealthpartners.test', '(555) 010-0108', 'Meridian Health Partners', 'cold_outreach', 'won', 32000, 'Closed after a three-month evaluation cycle.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-08-09T08:52:00Z'),
  ('10000000-0000-4000-8000-000000000009', 'Derek Simmons', 'derek.simmons@thornwoodashlegal.test', '(555) 010-0109', 'Thornwood & Ash Legal', 'other', 'lost', 2200, 'Decided to build an in-house solution instead.', null, '2026-08-13T17:02:00Z'),
  ('10000000-0000-4000-8000-000000000010', 'Lucia Ferreira', 'lucia.ferreira@pixelharborstudios.test', '(555) 010-0110', 'Pixel Harbor Studios', 'website', 'qualified', 11800, 'Budget approved, finalizing contract terms.', null, '2026-08-16T12:44:00Z'),
  ('10000000-0000-4000-8000-000000000011', 'Samuel Okafor', 'samuel.okafor@cascaderidgeoutfitters.test', '(555) 010-0111', 'Cascade Ridge Outfitters', 'referral', 'contacted', 6700, 'Warm introduction from an existing customer.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-08-20T09:27:00Z'),
  ('10000000-0000-4000-8000-000000000012', 'Ingrid Halvorsen', 'ingrid.halvorsen@ironcladsecurity.test', '(555) 010-0112', 'Ironclad Security Systems', 'cold_outreach', 'new', 8900, 'Initial outreach call scheduled for next week.', null, '2026-08-24T14:11:00Z'),
  ('10000000-0000-4000-8000-000000000013', 'Rajesh Patel', 'rajesh.patel@lumenvalleyenergy.test', '(555) 010-0113', 'Lumen Valley Energy', 'other', 'won', 41500, 'Multi-year deal signed after board approval.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-08-28T10:59:00Z'),

  ('10000000-0000-4000-8000-000000000014', 'Chloe Bennett', 'chloe.bennett@sablecreekventures.test', '(555) 010-0114', 'Sable Creek Ventures', 'website', 'new', 5300, 'Filled out the contact form after a webinar.', null, '2026-09-01T09:00:00Z'),
  ('10000000-0000-4000-8000-000000000015', 'Malik Johnson', 'malik.johnson@northgatefreight.test', '(555) 010-0115', 'Northgate Freight Co.', 'referral', 'contacted', 7600, 'Referred by a partner logistics firm.', null, '2026-09-03T11:30:00Z'),
  ('10000000-0000-4000-8000-000000000016', 'Freya Nilsen', 'freya.nilsen@verdantfieldsagritech.test', '(555) 010-0116', 'Verdant Fields Agritech', 'cold_outreach', 'qualified', 13400, 'Positive second call, sending a formal proposal.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-09-05T13:15:00Z'),
  ('10000000-0000-4000-8000-000000000017', 'Andres Morales', 'andres.morales@copperlinemfg.test', '(555) 010-0117', 'Copperline Manufacturing', 'other', 'new', 9800, 'Inbound inquiry via the contact page.', null, '2026-09-08T08:40:00Z'),
  ('10000000-0000-4000-8000-000000000018', 'Grace Kimura', 'grace.kimura@bluepeakwireless.test', '(555) 010-0118', 'Bluepeak Wireless', 'website', 'won', 22750, 'Closed-won ahead of their Q3 deadline.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-09-10T15:52:00Z'),
  ('10000000-0000-4000-8000-000000000019', 'Owen Fitzgerald', 'owen.fitzgerald@amberwoodhospitality.test', '(555) 010-0119', 'Amberwood Hospitality Group', 'referral', 'contacted', 4100, 'Following up after a promising discovery call.', null, '2026-09-12T10:22:00Z'),
  ('10000000-0000-4000-8000-000000000020', 'Zainab Hassan', 'zainab.hassan@falconridgeinsurance.test', '(555) 010-0120', 'Falconridge Insurance', 'cold_outreach', 'new', 6500, 'Left a voicemail, awaiting callback.', null, '2026-09-14T16:05:00Z'),
  ('10000000-0000-4000-8000-000000000021', 'Miles Carter', 'miles.carter@driftwoodcoffee.test', '(555) 010-0121', 'Driftwood Coffee Roasters', 'other', 'qualified', 3200, 'Small deal but a good reference customer.', null, '2026-09-15T09:48:00Z'),
  ('10000000-0000-4000-8000-000000000022', 'Sophia Delacroix', 'sophia.delacroix@anchorpointlegal.test', '(555) 010-0122', 'Anchorpoint Legal Services', 'website', 'new', 12100, 'Downloaded the pricing guide this morning.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-09-17T12:00:00Z'),
  ('10000000-0000-4000-8000-000000000023', 'Theo Anderson', 'theo.anderson@skylinefacilities.test', '(555) 010-0123', 'Skyline Facilities Management', 'referral', 'contacted', 8300, 'Second call booked for later this week.', null, '2026-09-18T14:36:00Z'),
  ('10000000-0000-4000-8000-000000000024', 'Layla Haddad', 'layla.haddad@redwoodtrailoutdoors.test', '(555) 010-0124', 'Redwood Trail Outdoors', 'cold_outreach', 'new', 5900, 'Responded positively to the intro email.', null, '2026-09-19T10:14:00Z'),
  ('10000000-0000-4000-8000-000000000025', 'Ben Whitaker', 'ben.whitaker@marbleandvineevents.test', '(555) 010-0125', 'Marble & Vine Events', 'website', 'won', 16800, 'Signed after comparing two competing quotes.', 'd8c99970-a457-470a-9d41-e7b9673cab36', '2026-09-20T17:22:00Z')
on conflict (id) do nothing;

-- ============================================================================
-- Demo users — not seeded here, on purpose.
--
-- `public.profiles.id` is a foreign key to `auth.users.id` (see
-- 20260921130000_initial_schema.sql). A profile row inserted directly via
-- SQL with a made-up id would either violate that FK constraint (if
-- enforced, which it is here) or, if the constraint were ever relaxed,
-- create an orphaned profile with no matching Supabase Auth user — one
-- that could never actually sign in, and that RLS/`is_admin()` would treat
-- inconsistently since it depends on `auth.uid()` matching a real session.
-- Fabricating one via SQL is not a safe shortcut.
--
-- The safe way to add demo user accounts is to create them the same way
-- every real user is created — through Supabase Auth — so `auth.users` and
-- `public.profiles` stay in sync via the existing `handle_new_user()`
-- trigger:
--   1. Admin API, scripted: `admin.auth.admin.createUser({ email, password,
--      email_confirm: true, user_metadata: { full_name } })` using the
--      same server-only admin client as `src/lib/supabase/admin.ts` — this
--      is the same mechanism Phase 4B's invite flow already uses, just
--      creating the account directly (with a known password) instead of
--      emailing an invite link, since a portfolio demo user needs
--      hand-out-able credentials rather than an email-based signup.
--   2. Or the existing Invite User flow (`/users`), using inboxes you
--      control, if the demo is fine linking to real (your own) email
--      addresses rather than needing pre-set passwords.
-- Either way, no direct `insert into public.profiles` — only Supabase Auth
-- ever creates a `profiles` row (via `handle_new_user()`), keeping the two
-- tables' referential integrity intact. This is intentionally left as
-- future work per this phase's explicit instruction not to create fake
-- Supabase Auth users via SQL; existing real test/invited accounts remain
-- as-is for now.
-- ============================================================================
