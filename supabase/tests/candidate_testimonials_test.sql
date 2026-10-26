begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(24);

select has_table('public', 'candidate_testimonials', 'candidate testimonial submissions have a dedicated table');
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.candidate_testimonials'::regclass),
  'candidate submissions have RLS enabled'
);
select ok(
  not has_table_privilege('anon', 'public.candidate_testimonials', 'SELECT'),
  'anonymous visitors cannot read private submission fields'
);
select ok(
  has_column_privilege('anon', 'public.candidate_testimonials', 'quote', 'INSERT'),
  'anonymous visitors can submit a story'
);
select ok(
  has_column_privilege('anon', 'public.candidate_testimonials', 'rating', 'INSERT'),
  'anonymous visitors can submit a rating'
);
select has_column('public', 'candidate_testimonials', 'profile_photo_path', 'submitted photos have a private storage reference');
select ok(
  not has_column_privilege('anon', 'public.candidate_testimonials', 'profile_photo_path', 'INSERT'),
  'anonymous visitors cannot attach arbitrary private photo paths'
);
select ok(
  (select not public from storage.buckets where id = 'candidate-profile-photos'),
  'candidate profile photos are stored in a private bucket'
);
select ok(
  has_function_privilege('anon', 'public.get_approved_candidate_testimonials_with_profile()', 'EXECUTE'),
  'anonymous visitors can read approved profile references through the curated function'
);
select has_column('public', 'candidate_testimonials', 'profile_photo_data', 'small profile thumbnails can be stored with submissions');
select ok(
  has_column_privilege('anon', 'public.candidate_testimonials', 'profile_photo_data', 'INSERT'),
  'anonymous submissions can include a bounded profile thumbnail'
);
select ok(
  has_function_privilege('anon', 'public.get_approved_candidate_testimonials_with_photo()', 'EXECUTE'),
  'anonymous visitors can read approved thumbnails through the curated function'
);
select ok(
  not has_column_privilege('anon', 'public.candidate_testimonials', 'status', 'INSERT'),
  'anonymous visitors cannot choose an approval status'
);
select ok(
  not has_table_privilege('authenticated', 'public.candidate_testimonials', 'UPDATE'),
  'administrators cannot update testimonials directly'
);
select ok(
  not has_function_privilege('anon', 'public.review_candidate_testimonial(uuid,text)', 'EXECUTE'),
  'anonymous visitors cannot call the review function'
);
select ok(
  has_function_privilege('authenticated', 'public.review_candidate_testimonial(uuid,text)', 'EXECUTE'),
  'authenticated reviewers can call the permission-checked review function'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'realtime'
      and tablename = 'messages'
      and policyname = 'candidate_testimonial_admin_broadcast_read'
  ),
  'admin live updates use a scoped Realtime read policy'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.candidate_testimonials'::regclass
      and tgname = 'candidate_testimonial_realtime_change'
      and not tgisinternal
  ),
  'candidate submission and review changes have a broadcast trigger'
);

insert into public.candidate_testimonials (
  author_name, email, relationship, quote, publication_consent, submission_fingerprint, status
) values (
  'Pending Candidate', 'pending@example.com', 'prospective',
  'This candidate story has not yet been approved by the team.', true,
  'test-pending-story', 'pending'
);

insert into public.candidate_testimonials (
  author_name, email, relationship, rating, quote, publication_consent, submission_fingerprint, status, published_at, profile_photo_path, profile_photo_data
) values (
  'Approved Candidate', 'approved@example.com', 'past', 4,
  'This candidate story was reviewed and approved for publication.', true,
  'test-approved-story', 'approved', now(), 'test-profile.jpg', 'd2VicA=='
);

select is(
  (select count(*)::integer from public.get_approved_candidate_testimonials()),
  1,
  'only approved stories are returned publicly'
);
select is(
  (select author_name from public.get_approved_candidate_testimonials() limit 1),
  'Approved Candidate',
  'the approved public story is returned'
);
select is(
  (select count(*)::integer from public.get_approved_candidate_testimonials_with_rating()),
  1,
  'only approved stories and ratings are returned publicly'
);
select is(
  (select rating from public.get_approved_candidate_testimonials_with_rating() limit 1),
  4::smallint,
  'the public rating matches the reviewed submission'
);
select is(
  (select profile_photo_path from public.get_approved_candidate_testimonials_with_profile() limit 1),
  'test-profile.jpg',
  'the approved public story includes its profile photo reference'
);
select is(
  (select profile_photo_data from public.get_approved_candidate_testimonials_with_photo() limit 1),
  'd2VicA==',
  'the approved public story includes its small profile thumbnail'
);

select * from finish();
rollback;
