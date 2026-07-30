-- Run this once in Supabase Dashboard → SQL Editor.
create schema if not exists private;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  description text,
  banner_message text check (char_length(banner_message) <= 500),
  published boolean not null default true,
  rrule text,
  created_at timestamptz not null default now(),
  constraint events_end_after_start check (end_at is null or end_at > start_at),
  constraint events_rrule_format check (rrule is null or rrule like '%RRULE:%')
);

create index events_public_schedule_idx on public.events (start_at) where published;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.events enable row level security;
alter table public.admins enable row level security;

-- This function is intentionally in a non-exposed schema. Only authenticated users may execute it.
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

create policy "anyone can read published events"
on public.events for select to anon, authenticated using (published = true);
create policy "admins can read all events"
on public.events for select to authenticated using ((select private.is_admin()));
create policy "admins can insert events"
on public.events for insert to authenticated with check ((select private.is_admin()));
create policy "admins can update events"
on public.events for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins can delete events"
on public.events for delete to authenticated using ((select private.is_admin()));

-- Create an Auth user first, then run this as the project owner (Dashboard SQL Editor):
-- insert into public.admins (user_id) values ('YOUR_AUTH_USER_UUID');
