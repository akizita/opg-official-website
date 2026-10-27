begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(5);

-- A transaction-local editor can inspect aggregates without revealing stories.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '60000000-0000-0000-0000-000000000006',
  'authenticated', 'authenticated', 'trend-test@test.invalid', '', now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  now(), now()
);

insert into public.admin_profiles (id, display_name, role_id)
values (
  '60000000-0000-0000-0000-000000000006',
  'Trend Test Editor',
  (select id from public.roles where role_key = 'editor')
);

insert into public.candidate_testimonials (
  author_name, email, relationship, quote, publication_consent,
  submission_fingerprint, status, submitted_at
) values (
  'Trend Test Candidate', 'trend-candidate@test.invalid', 'prospective',
  'A test story to verify calendar bucket totals.', true,
  'trend-chart-60000000-0000-0000-0000-000000000006', 'pending', now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000006', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000006","role":"authenticated","aal":"aal1"}',
  true
);

select is(
  (select count(*)::integer from public.get_candidate_testimonial_trend() where period = 'week'),
  7,
  'weekly trend includes all seven Singapore calendar days'
);
select is(
  (select count(*)::integer from public.get_candidate_testimonial_trend() where period = 'month'),
  pg_catalog.date_part(
    'day',
    pg_catalog.date_trunc('month', pg_catalog.timezone('Asia/Singapore', now()))
      + interval '1 month' - interval '1 day'
  )::integer,
  'monthly trend includes the correct number of days'
);
select is(
  (select count(*)::integer from public.get_candidate_testimonial_trend() where period = 'year'),
  12,
  'yearly trend includes all twelve months'
);
select results_eq(
  $$
    select period, sum(submission_count)::bigint
    from public.get_candidate_testimonial_trend()
    group by period
    order by period
  $$,
  $$
    select period, submission_count
    from public.get_candidate_testimonial_analytics()
    order by period
  $$,
  'trend totals match the existing analytics totals'
);
select ok(
  coalesce((
    select bool_and(submission_count is null)
    from public.get_candidate_testimonial_trend()
    where bucket_start > now()
  ), true),
  'future dates are not plotted as zero-activity days'
);

reset role;
select * from finish();
rollback;
