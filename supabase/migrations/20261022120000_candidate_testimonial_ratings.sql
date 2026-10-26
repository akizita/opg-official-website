-- Keep ratings private until review, alongside the candidate's story.
alter table public.candidate_testimonials
  add column rating smallint check (rating between 1 and 5);

grant insert (rating) on public.candidate_testimonials to anon, authenticated;

-- A new RPC keeps the existing public reader usable during deployment.
create function public.get_approved_candidate_testimonials_with_rating()
returns table (
  id uuid,
  author_name text,
  relationship text,
  role_title text,
  rating smallint,
  quote text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.author_name, t.relationship, t.role_title, t.rating,
    t.quote, t.published_at
  from public.candidate_testimonials as t
  where t.status = 'approved' and t.publication_consent = true
  order by t.published_at desc, t.submitted_at desc;
$$;

revoke all on function public.get_approved_candidate_testimonials_with_rating() from public;
grant execute on function public.get_approved_candidate_testimonials_with_rating()
  to anon, authenticated;
