-- Apply this once to add the NWS alert toggle to an existing site_banners table.
alter table public.site_banners
  add column if not exists show_nws_alerts boolean not null default false;

drop policy if exists "anyone can read enabled site banner" on public.site_banners;
create policy "anyone can read enabled site banner"
on public.site_banners for select to anon, authenticated
using (
  show_nws_alerts = true
  or (
    enabled = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  )
);
