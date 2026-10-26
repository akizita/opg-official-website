-- Show the complete approved collection in the public Testimonials tab.
create or replace function public.get_approved_candidate_testimonials()
returns table (
  id uuid,
  author_name text,
  relationship text,
  role_title text,
  quote text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.author_name, t.relationship, t.role_title, t.quote, t.published_at
  from public.candidate_testimonials as t
  where t.status = 'approved' and t.publication_consent = true
  order by t.published_at desc, t.submitted_at desc;
$$;
