-- Apply this once to add scheduling to an existing site_banners table.
alter table public.site_banners
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

alter table public.site_banners
  drop constraint if exists site_banners_end_after_start,
  add constraint site_banners_end_after_start
    check (ends_at is null or starts_at is null or ends_at > starts_at);

drop policy if exists "anyone can read enabled site banner" on public.site_banners;
create policy "anyone can read enabled site banner"
on public.site_banners for select to anon, authenticated
using (
  enabled = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);
