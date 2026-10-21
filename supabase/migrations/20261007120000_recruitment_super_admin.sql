-- Designate the shared OPG recruitment mailbox as the automatically
-- provisioned Super Admin. Authentication still occurs through Supabase Auth;
-- this trigger supplies the active CMS profile and role after Auth creates or
-- updates the user.

create or replace function private.provision_designated_admin_on_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  super_admin_role_id smallint;
begin
  if lower(coalesce(new.email, '')) = 'recruitment@opglobal.com.hk' then
    select id into super_admin_role_id
    from public.roles
    where role_key = 'super_admin'
      and is_active;

    if super_admin_role_id is not null then
      insert into public.admin_profiles (id, display_name, role_id, is_active)
      values (
        new.id,
        'OPG',
        super_admin_role_id,
        true
      )
      on conflict (id) do update
      set is_active = true,
          role_id = excluded.role_id,
          display_name = 'OPG';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_admin_provisioning on auth.users;
create trigger on_auth_user_admin_provisioning
  after insert or update of email on auth.users
  for each row execute function private.provision_designated_admin_on_auth();

-- Backfill an existing recruitment user when this migration is applied.
insert into public.admin_profiles (id, display_name, role_id, is_active)
select
  u.id,
  'OPG',
  r.id,
  true
from auth.users u
cross join public.roles r
where lower(coalesce(u.email, '')) = 'recruitment@opglobal.com.hk'
  and r.role_key = 'super_admin'
  and r.is_active
on conflict (id) do update
set is_active = true,
    role_id = excluded.role_id,
    display_name = 'OPG';
