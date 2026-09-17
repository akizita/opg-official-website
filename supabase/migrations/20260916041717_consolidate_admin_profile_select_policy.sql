drop policy admin_profiles_self_select on public.admin_profiles;
drop policy admin_profiles_super_admin_select on public.admin_profiles;

create policy admin_profiles_authorized_select
on public.admin_profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (
    (select private.is_aal2())
    and (select private.has_permission('users.roles.manage'))
  )
);
