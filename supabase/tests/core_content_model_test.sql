begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(38);

-- 1. Table existence tests
select has_table('public', 'page_documents', 'page_documents table exists');
select has_table('public', 'departments', 'departments table exists');
select has_table('public', 'team_members', 'team_members table exists');
select has_table('public', 'services', 'services table exists');
select has_table('public', 'clients', 'clients table exists');
select has_table('public', 'testimonials', 'testimonials table exists');
select has_table('public', 'job_openings', 'job_openings table exists');
select has_table('public', 'faq_categories', 'faq_categories table exists');
select has_table('public', 'faqs', 'faqs table exists');
select has_table('public', 'authors', 'authors table exists');
select has_table('public', 'article_categories', 'article_categories table exists');
select has_table('public', 'article_tags', 'article_tags table exists');
select has_table('public', 'articles', 'articles table exists');
select has_table('public', 'site_settings', 'site_settings table exists');
select has_table('public', 'navigation_items', 'navigation_items table exists');
select has_table('public', 'redirects', 'redirects table exists');
select has_table('public', 'search_documents', 'search_documents table exists');
select has_table('public', 'contact_inquiries', 'contact_inquiries table exists');
select has_table('public', 'newsletter_subscriptions', 'newsletter_subscriptions table exists');

-- 2. RLS enabled checks
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.page_documents'::regclass),
  'page_documents has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.departments'::regclass),
  'departments has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.team_members'::regclass),
  'team_members has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.services'::regclass),
  'services has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.clients'::regclass),
  'clients has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.testimonials'::regclass),
  'testimonials has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.job_openings'::regclass),
  'job_openings has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.faqs'::regclass),
  'faqs has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.articles'::regclass),
  'articles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.contact_inquiries'::regclass),
  'contact_inquiries has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.newsletter_subscriptions'::regclass),
  'newsletter_subscriptions has RLS enabled'
);

-- 3. Structure & Column checks
select has_column('public', 'page_documents', 'slug', 'page_documents has slug column');
select has_column('public', 'page_documents', 'content', 'page_documents has JSONB content column');
select has_column('public', 'services', 'slug', 'services has slug column');
select has_column('public', 'articles', 'slug', 'articles has slug column');
select has_column('public', 'job_openings', 'external_apply_url', 'job_openings has external_apply_url');
select has_column('public', 'contact_inquiries', 'retention_expires_at', 'contact_inquiries has retention tracking');
select has_column('public', 'search_documents', 'search_vector', 'search_documents has generated tsvector');
select has_column('public', 'newsletter_subscriptions', 'email_normalized', 'newsletter_subscriptions has normalized email');

select * from finish();
rollback;

