-- Small server-normalized WebP thumbnails also work without a storage secret.
alter table public.candidate_testimonials
  add column profile_photo_data text
  check (
    profile_photo_data is null
    or (
      char_length(profile_photo_data) <= 80000
      and char_length(profile_photo_data) % 4 = 0
      and profile_photo_data ~ '^[A-Za-z0-9+/]+={0,2}$'
    )
  );

grant insert (profile_photo_data) on public.candidate_testimonials to anon, authenticated;

create function public.get_approved_candidate_testimonials_with_photo()
returns table (
  id uuid,
  author_name text,
  relationship text,
  role_title text,
  rating smallint,
  quote text,
  published_at timestamptz,
  profile_photo_path text,
  profile_photo_data text
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.author_name, t.relationship, t.role_title, t.rating,
    t.quote, t.published_at, t.profile_photo_path, t.profile_photo_data
  from public.candidate_testimonials as t
  where t.status = 'approved' and t.publication_consent = true
  order by t.published_at desc, t.submitted_at desc;
$$;

revoke all on function public.get_approved_candidate_testimonials_with_photo() from public;
grant execute on function public.get_approved_candidate_testimonials_with_photo()
  to anon, authenticated;
