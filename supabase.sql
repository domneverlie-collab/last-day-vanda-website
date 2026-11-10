-- Run this entire script in Supabase Dashboard > SQL Editor.
-- Public visitors can register and see guest names only.
-- Only admins can read contact details and the full guest table.

create table if not exists public.party_members (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 80),
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.party_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.party_members enable row level security;
alter table public.party_admins enable row level security;

-- Anyone can submit a registration. No public table-read policy is granted.
drop policy if exists "Anyone can register" on public.party_members;
create policy "Anyone can register"
on public.party_members for insert to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 80
  and (email is null or char_length(email) <= 254)
  and (phone is null or char_length(phone) <= 30)
);

-- Admin users can read all guest details.
drop policy if exists "Admins can read registrations" on public.party_members;
create policy "Admins can read registrations"
on public.party_members for select to authenticated
using (exists (select 1 from public.party_admins a where a.user_id = (select auth.uid())));

-- Admin roster is not readable or writable through the public API.
drop policy if exists "Admins can read own admin record" on public.party_admins;
create policy "Admins can read own admin record"
on public.party_admins for select to authenticated
using (user_id = (select auth.uid()));

-- A restricted view exposes only guest names and registration timestamps.
create or replace view public.public_party_members
with (security_barrier = true)
as
  select id, name, created_at from public.party_members;

grant usage on schema public to anon, authenticated;
grant select on public.public_party_members to anon, authenticated;
grant insert (name,email,phone) on public.party_members to anon, authenticated;
grant select on public.party_members to authenticated;
grant select on public.party_admins to authenticated;
grant usage, select on sequence public.party_members_id_seq to anon, authenticated;

-- ADMIN SETUP:
-- 1) Create your admin account in Supabase Dashboard > Authentication > Users > Add user.
-- 2) Copy that user's UUID.
-- 3) Run this separately, replacing the UUID:
-- insert into public.party_admins (user_id) values ('YOUR-ADMIN-AUTH-USER-UUID');
--
-- Do not enable public sign-ups for admin accounts. Create admin users yourself.
