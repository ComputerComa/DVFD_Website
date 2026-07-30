-- Run once in the Supabase SQL Editor to publish public banner changes to Realtime.
-- The block is safe to run again.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_banners'
  ) then
    alter publication supabase_realtime add table public.site_banners;
  end if;
end;
$$;
