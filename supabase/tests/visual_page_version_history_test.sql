begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(8);

select has_table('public', 'page_visual_versions', 'visual versions table exists');
select has_column('public', 'page_documents', 'visual_revision_title', 'page documents store a revision title');
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.page_visual_versions'::regclass),
  'visual versions have RLS enabled'
);

insert into public.page_documents (
  id, slug, title, content, status, version, updated_at,
  visual_revision_id, visual_revision_title
) values (
  '2c0cd47a-5723-4cbb-98f3-754f23028100', 'visual-history-test',
  'Original content', '[]'::jsonb, 'draft', 1, now(),
  '2c0cd47a-5723-4cbb-98f3-754f23028101', 'Initial draft'
);

select is(
  (select snapshot->>'title' from public.page_visual_versions
   where id = '2c0cd47a-5723-4cbb-98f3-754f23028101'),
  'Original content',
  'the first save creates an atomic content snapshot'
);

select throws_ok(
  $$delete from public.page_visual_versions
    where id = '2c0cd47a-5723-4cbb-98f3-754f23028101'$$,
  'P0001', 'Only older draft versions can be deleted',
  'the current draft version cannot be deleted'
);

update public.page_documents
set title = 'Published content', status = 'published', version = 2,
    updated_at = now(),
    visual_revision_id = '2c0cd47a-5723-4cbb-98f3-754f23028102',
    visual_revision_title = 'Publish updated page'
where id = '2c0cd47a-5723-4cbb-98f3-754f23028100';

select is(
  (select count(*)::integer from public.page_visual_versions
   where page_slug = 'visual-history-test'),
  2, 'publishing creates a second named version'
);

select lives_ok(
  $$delete from public.page_visual_versions
    where id = '2c0cd47a-5723-4cbb-98f3-754f23028101'$$,
  'an older draft version can be deleted'
);

select throws_ok(
  $$delete from public.page_visual_versions
    where id = '2c0cd47a-5723-4cbb-98f3-754f23028102'$$,
  'P0001', 'Only older draft versions can be deleted',
  'a published version cannot be deleted'
);

select * from finish();
rollback;
