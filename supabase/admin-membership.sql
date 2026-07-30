-- Allows a signed-in user to check only their own administrator membership.
grant select on public.admins to authenticated;

drop policy if exists "users can read their own admin membership" on public.admins;
create policy "users can read their own admin membership"
on public.admins
for select
to authenticated
using ((select auth.uid()) = user_id);
