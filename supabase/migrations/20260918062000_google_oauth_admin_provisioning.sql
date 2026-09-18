-- OPG Designated Initial Super Admin Provisioning for Google OAuth / Auth
-- Automatically provisions the initial Super Admin profile for Aki Zita upon sign-in.

create or replace function private.provision_designated_admin_on_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  super_admin_role_id smallint;
begin
  if lower(new.email) = 'aki.zita@freedompropertyinvestors.com.au' then
    select id into super_admin_role_id
    from public.roles
    where role_key = 'super_admin';

    if super_admin_role_id is not null then
      insert into public.admin_profiles (id, display_name, role_id, is_active)
      values (
        new.id,
        coalesce(
          nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
          nullif(trim(new.raw_user_meta_data->>'name'), ''),
          'Aki Zita'
        ),
        super_admin_role_id,
        true
      )
      on conflict (id) do update
      set is_active = true,
          role_id = super_admin_role_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_admin_provisioning on auth.users;
create trigger on_auth_user_admin_provisioning
  after insert or update of email on auth.users
  for each row execute function private.provision_designated_admin_on_auth();

-- Backfill any existing user record with the designated email
insert into public.admin_profiles (id, display_name, role_id, is_active)
select 
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    'Aki Zita'
  ),
  r.id,
  true
from auth.users u
cross join public.roles r
where lower(u.email) = 'aki.zita@freedompropertyinvestors.com.au'
  and r.role_key = 'super_admin'
on conflict (id) do update
set is_active = true,
    role_id = excluded.role_id;

