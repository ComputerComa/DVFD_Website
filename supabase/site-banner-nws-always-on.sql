-- NWS alerts are fetched directly by the public site and are no longer configurable.
drop policy if exists "anyone can read enabled site banner" on public.site_banners;
create policy "anyone can read enabled site banner"
on public.site_banners for select to anon, authenticated
using (
  enabled = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

alter table public.site_banners
  drop column if exists show_nws_alerts;
