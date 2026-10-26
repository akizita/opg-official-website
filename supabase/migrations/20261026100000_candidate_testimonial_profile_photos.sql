-- Keep submitted photos private; only approved stories receive temporary URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-profile-photos',
  'candidate-profile-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.candidate_testimonials
  add column if not exists profile_photo_path text;

-- Only the server's privileged client may attach a stored photo to a story.
revoke insert (profile_photo_path) on public.candidate_testimonials from anon, authenticated;

create function public.get_approved_candidate_testimonials_with_profile()
returns table (
  id uuid,
  author_name text,
  relationship text,
  role_title text,
  rating smallint,
  quote text,
  published_at timestamptz,
  profile_photo_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.author_name, t.relationship, t.role_title, t.rating,
    t.quote, t.published_at, t.profile_photo_path
  from public.candidate_testimonials as t
  where t.status = 'approved' and t.publication_consent = true
  order by t.published_at desc, t.submitted_at desc;
$$;

revoke all on function public.get_approved_candidate_testimonials_with_profile() from public;
grant execute on function public.get_approved_candidate_testimonials_with_profile()
  to anon, authenticated;
