-- OPG admin identity, role-based access control, and append-only audit baseline.
-- This migration intentionally creates no Auth users and stores no passwords.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.roles (
  id smallint generated always as identity primary key,
  role_key text not null unique,
  display_name text not null,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint roles_role_key_format check (role_key ~ '^[a-z][a-z0-9_]*$'),
  constraint roles_display_name_not_blank check (btrim(display_name) <> ''),
  constraint roles_description_not_blank check (btrim(description) <> '')
);

create table public.permissions (
  id smallint generated always as identity primary key,
  permission_key text not null unique,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint permissions_key_format check (
    permission_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
  ),
  constraint permissions_description_not_blank check (btrim(description) <> '')
);

create table public.role_permissions (
  role_id smallint not null references public.roles(id) on delete restrict,
  permission_id smallint not null references public.permissions(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create index role_permissions_permission_id_idx
  on public.role_permissions (permission_id);

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null,
  role_id smallint not null references public.roles(id) on delete restrict,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_profiles_display_name_not_blank check (btrim(display_name) <> '')
);

create index admin_profiles_role_id_idx on public.admin_profiles (role_id);
create index admin_profiles_created_by_idx on public.admin_profiles (created_by)
  where created_by is not null;
create index admin_profiles_updated_by_idx on public.admin_profiles (updated_by)
  where updated_by is not null;
create index admin_profiles_active_role_idx on public.admin_profiles (role_id)
  where is_active;

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  constraint audit_log_action_not_blank check (btrim(action) <> ''),
  constraint audit_log_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint audit_log_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index audit_log_actor_user_id_idx on public.audit_log (actor_user_id)
  where actor_user_id is not null;
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, occurred_at desc);

insert into public.roles (role_key, display_name, description)
values
  ('editor', 'Editor', 'Creates and edits drafts and submits content for review.'),
  ('publisher', 'Publisher', 'Reviews, publishes, unpublishes, and archives content.'),
  ('inquiry_manager', 'Inquiry Manager', 'Views and manages contact inquiries.'),
  ('super_admin', 'Super Admin', 'Manages all administration, users, roles, and operational settings.')
on conflict (role_key) do update
set display_name = excluded.display_name,
    description = excluded.description,
    is_active = true;

insert into public.permissions (permission_key, description)
values
  ('content.view', 'View the content workspace.'),
  ('content.draft.write', 'Create and edit draft content.'),
  ('content.review.submit', 'Submit draft content for review.'),
  ('content.review.request_changes', 'Return content for changes.'),
  ('content.publish', 'Publish and unpublish content.'),
  ('content.archive', 'Archive content.'),
  ('media.draft.write', 'Upload and manage draft media.'),
  ('inquiries.view', 'View stored contact inquiries.'),
  ('inquiries.manage', 'Assign, update, and resolve inquiries.'),
  ('subscribers.view', 'View newsletter subscription status.'),
  ('users.invite', 'Invite an administrator through the protected server workflow.'),
  ('users.roles.manage', 'Create, activate, deactivate, and change administrator roles.'),
  ('settings.manage', 'Change site-wide operational settings.'),
  ('audit.view', 'View append-only audit events.')
on conflict (permission_key) do update
set description = excluded.description,
    is_active = true;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.permission_key = any (
  case r.role_key
    when 'editor' then array[
      'content.view',
      'content.draft.write',
      'content.review.submit',
      'media.draft.write'
    ]::text[]
    when 'publisher' then array[
      'content.view',
      'content.draft.write',
      'content.review.submit',
      'content.review.request_changes',
      'content.publish',
      'content.archive',
      'media.draft.write'
    ]::text[]
    when 'inquiry_manager' then array[
      'inquiries.view',
      'inquiries.manage',
      'subscribers.view'
    ]::text[]
    when 'super_admin' then array[
      'content.view',
      'content.draft.write',
      'content.review.submit',
      'content.review.request_changes',
      'content.publish',
      'content.archive',
      'media.draft.write',
      'inquiries.view',
      'inquiries.manage',
      'subscribers.view',
      'users.invite',
      'users.roles.manage',
      'settings.manage',
      'audit.view'
    ]::text[]
    else array[]::text[]
  end
)
on conflict (role_id, permission_id) do nothing;

create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_profiles ap
      join public.roles r on r.id = ap.role_id
      where ap.id = (select auth.uid())
        and ap.is_active
        and r.is_active
    );
$$;

create or replace function private.has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_profiles ap
      join public.roles r on r.id = ap.role_id
      join public.role_permissions rp on rp.role_id = r.id
      join public.permissions p on p.id = rp.permission_id
      where ap.id = (select auth.uid())
        and ap.is_active
        and r.is_active
        and p.is_active
        and p.permission_key = required_permission
    );
$$;

create or replace function private.is_aal2()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

create or replace function private.stamp_admin_profile()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(caller_id, new.created_by);
  end if;

  new.updated_at := now();
  new.updated_by := coalesce(caller_id, new.updated_by);
  return new;
end;
$$;

create or replace function private.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_role_key text;
  new_role_key text;
  remaining_super_admins integer;
begin
  select r.role_key into old_role_key
  from public.roles r
  where r.id = old.role_id;

  if tg_op = 'UPDATE' then
    select r.role_key into new_role_key
    from public.roles r
    where r.id = new.role_id;
  end if;

  if old.is_active
     and old_role_key = 'super_admin'
     and (
       tg_op = 'DELETE'
       or not new.is_active
       or new_role_key <> 'super_admin'
     ) then
    -- Serialize final-Super-Admin checks across concurrent role changes.
    perform pg_catalog.pg_advisory_xact_lock(485047, 1);

    select count(*) into remaining_super_admins
    from public.admin_profiles ap
    join public.roles r on r.id = ap.role_id
    where ap.id <> old.id
      and ap.is_active
      and r.is_active
      and r.role_key = 'super_admin';

    if remaining_super_admins = 0 then
      raise exception 'The final active Super Admin cannot be removed or deactivated.'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function private.audit_admin_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_action text;
begin
  event_action := case tg_op
    when 'INSERT' then 'admin_profile.created'
    when 'UPDATE' then 'admin_profile.updated'
    when 'DELETE' then 'admin_profile.deleted'
  end;

  insert into public.audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    metadata
  ) values (
    (select auth.uid()),
    event_action,
    'admin_profile',
    coalesce(new.id, old.id)::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    jsonb_build_object('database_operation', tg_op)
  );

  return coalesce(new, old);
end;
$$;

create or replace function private.prevent_audit_log_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Audit records are append-only.' using errcode = '42501';
end;
$$;

create trigger admin_profiles_stamp
before insert or update on public.admin_profiles
for each row execute function private.stamp_admin_profile();

create trigger admin_profiles_protect_last_super_admin
before update of role_id, is_active or delete on public.admin_profiles
for each row execute function private.protect_last_super_admin();

create trigger admin_profiles_audit
after insert or update or delete on public.admin_profiles
for each row execute function private.audit_admin_profile_change();

create trigger audit_log_append_only
before update or delete on public.audit_log
for each row execute function private.prevent_audit_log_mutation();

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.audit_log enable row level security;

revoke all on table public.roles from public, anon, authenticated;
revoke all on table public.permissions from public, anon, authenticated;
revoke all on table public.role_permissions from public, anon, authenticated;
revoke all on table public.admin_profiles from public, anon, authenticated;
revoke all on table public.audit_log from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

-- The Dashboard's "automatic RLS" option creates this event-trigger helper in
-- public. Keep the helper for future tables, but do not expose it as an RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

grant usage on schema public to authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_active_admin() to authenticated;
grant execute on function private.has_permission(text) to authenticated;
grant execute on function private.is_aal2() to authenticated;

grant select on table public.roles to authenticated;
grant select on table public.permissions to authenticated;
grant select on table public.role_permissions to authenticated;
grant select on table public.admin_profiles to authenticated;
grant insert (id, display_name, role_id, is_active) on table public.admin_profiles to authenticated;
grant update (display_name, role_id, is_active) on table public.admin_profiles to authenticated;
grant select on table public.audit_log to authenticated;

grant select on table public.roles, public.permissions, public.role_permissions to service_role;
grant select, insert, update on table public.admin_profiles to service_role;
grant select, insert on table public.audit_log to service_role;

create policy roles_active_admin_select
on public.roles
for select
to authenticated
using ((select private.is_active_admin()));

create policy permissions_active_admin_select
on public.permissions
for select
to authenticated
using ((select private.is_active_admin()));

create policy role_permissions_active_admin_select
on public.role_permissions
for select
to authenticated
using ((select private.is_active_admin()));

create policy admin_profiles_self_select
on public.admin_profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy admin_profiles_super_admin_select
on public.admin_profiles
for select
to authenticated
using (
  (select private.is_aal2())
  and (select private.has_permission('users.roles.manage'))
);

create policy admin_profiles_super_admin_insert
on public.admin_profiles
for insert
to authenticated
with check (
  (select private.is_aal2())
  and (select private.has_permission('users.roles.manage'))
);

create policy admin_profiles_super_admin_update
on public.admin_profiles
for update
to authenticated
using (
  (select private.is_aal2())
  and (select private.has_permission('users.roles.manage'))
)
with check (
  (select private.is_aal2())
  and (select private.has_permission('users.roles.manage'))
);

create policy audit_log_super_admin_select
on public.audit_log
for select
to authenticated
using (
  (select private.is_aal2())
  and (select private.has_permission('audit.view'))
);

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

comment on schema private is 'Non-exposed authorization and trigger helpers.';
comment on table public.roles is 'Named OPG administrator roles.';
comment on table public.permissions is 'Fine-grained administrator capabilities.';
comment on table public.role_permissions is 'Permission mapping for administrator roles.';
comment on table public.admin_profiles is 'Website administrator profile linked one-to-one to Supabase Auth.';
comment on table public.audit_log is 'Append-only governance events; direct client writes are prohibited.';
