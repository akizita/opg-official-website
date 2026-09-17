begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(28);

select has_table('public', 'roles', 'roles table exists');
select has_table('public', 'permissions', 'permissions table exists');
select has_table('public', 'role_permissions', 'role_permissions table exists');
select has_table('public', 'admin_profiles', 'admin_profiles table exists');
select has_table('public', 'audit_log', 'audit_log table exists');

select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.roles'::regclass),
  'roles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.permissions'::regclass),
  'permissions has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.role_permissions'::regclass),
  'role_permissions has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.admin_profiles'::regclass),
  'admin_profiles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.audit_log'::regclass),
  'audit_log has RLS enabled'
);

select results_eq(
  $$select count(*)::bigint from public.roles$$,
  $$values (4::bigint)$$,
  'four administrator roles are seeded'
);
select results_eq(
  $$select count(*)::bigint from public.permissions$$,
  $$values (14::bigint)$$,
  'fourteen permissions are seeded'
);
select results_eq(
  $$
    select count(*)::bigint
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    where r.role_key = 'editor'
  $$,
  $$values (4::bigint)$$,
  'Editor receives only draft-workflow permissions'
);
select results_eq(
  $$
    select count(*)::bigint
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    where r.role_key = 'publisher'
  $$,
  $$values (7::bigint)$$,
  'Publisher receives draft, review, publish, archive, and media permissions'
);
select results_eq(
  $$
    select count(*)::bigint
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    where r.role_key = 'inquiry_manager'
  $$,
  $$values (3::bigint)$$,
  'Inquiry Manager receives only inquiry/subscriber permissions'
);
select results_eq(
  $$
    select count(*)::bigint
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    where r.role_key = 'super_admin'
  $$,
  $$values (14::bigint)$$,
  'Super Admin receives every seeded permission'
);

-- Test identities are transaction-local and roll back with this test file.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'super-admin@test.invalid',
    '',
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'editor@test.invalid',
    '',
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'candidate@test.invalid',
    '',
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '40000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'unused@test.invalid',
    '',
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.admin_profiles (id, display_name, role_id)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Test Super Admin',
    (select id from public.roles where role_key = 'super_admin')
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Test Editor',
    (select id from public.roles where role_key = 'editor')
  );

set local role anon;
select throws_ok(
  $$select * from public.roles$$,
  '42501',
  'permission denied for table roles',
  'anonymous callers have no role-table grant'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}',
  true
);

select results_eq(
  $$select count(*)::bigint from public.admin_profiles where id = auth.uid()$$,
  $$values (1::bigint)$$,
  'an Editor can read their own profile'
);
select results_eq(
  $$select count(*)::bigint from public.admin_profiles$$,
  $$values (1::bigint)$$,
  'an Editor cannot enumerate other administrator profiles'
);
select throws_ok(
  $$
    insert into public.admin_profiles (id, display_name, role_id, is_active)
    values (
      '40000000-0000-0000-0000-000000000004',
      'Unauthorized Admin',
      (select id from public.roles where role_key = 'editor'),
      true
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "admin_profiles"',
  'an Editor cannot create administrator profiles'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    insert into public.admin_profiles (id, display_name, role_id, is_active)
    values (
      '30000000-0000-0000-0000-000000000003',
      'Second Super Admin',
      (select id from public.roles where role_key = 'super_admin'),
      true
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "admin_profiles"',
  'a Super Admin at aal1 cannot manage roles'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select lives_ok(
  $$
    insert into public.admin_profiles (id, display_name, role_id, is_active)
    values (
      '30000000-0000-0000-0000-000000000003',
      'Second Super Admin',
      (select id from public.roles where role_key = 'super_admin'),
      true
    )
  $$,
  'a Super Admin at aal2 can create a role assignment for an existing Auth user'
);
select lives_ok(
  $$
    update public.admin_profiles
    set role_id = (select id from public.roles where role_key = 'editor')
    where id = '30000000-0000-0000-0000-000000000003'
  $$,
  'one of two Super Admins can be demoted'
);
select throws_ok(
  $$
    update public.admin_profiles
    set role_id = (select id from public.roles where role_key = 'editor')
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  'The final active Super Admin cannot be removed or deactivated.',
  'the final active Super Admin cannot be demoted'
);
select cmp_ok(
  (select count(*) from public.audit_log where entity_type = 'admin_profile'),
  '>=',
  4::bigint,
  'administrator profile and role changes create audit events'
);
select throws_ok(
  $$update public.audit_log set metadata = '{}'::jsonb where id = (select min(id) from public.audit_log)$$,
  '42501',
  'permission denied for table audit_log',
  'authenticated clients cannot update audit records'
);

update public.admin_profiles
set is_active = false
where id = '20000000-0000-0000-0000-000000000002';
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}',
  true
);
select results_eq(
  $$select count(*)::bigint from public.roles$$,
  $$values (0::bigint)$$,
  'a disabled administrator cannot read role metadata'
);
select results_eq(
  $$select count(*)::bigint from public.admin_profiles where id = auth.uid()$$,
  $$values (1::bigint)$$,
  'a disabled administrator can read only their own disabled profile state'
);

reset role;
select * from finish();
rollback;
