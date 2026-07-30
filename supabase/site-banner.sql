-- Site-wide announcement banner. Run against the linked Supabase project.
create table if not exists public.site_banners (
  id smallint primary key default 1 check (id = 1),
  message text not null default '' check (char_length(message) <= 500),
  enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint site_banners_end_after_start check (ends_at is null or starts_at is null or ends_at > starts_at)
);

alter table public.site_banners enable row level security;

grant select on public.site_banners to anon, authenticated;
grant update on public.site_banners to authenticated;

drop policy if exists "anyone can read enabled site banner" on public.site_banners;
create policy "anyone can read enabled site banner"
on public.site_banners for select to anon, authenticated
using (
  enabled = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists "admins can read site banner" on public.site_banners;
create policy "admins can read site banner"
on public.site_banners for select to authenticated
using ((select private.is_admin()));

drop policy if exists "admins can update site banner" on public.site_banners;
create policy "admins can update site banner"
on public.site_banners for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

insert into public.site_banners (id)
values (1)
on conflict (id) do nothing;
