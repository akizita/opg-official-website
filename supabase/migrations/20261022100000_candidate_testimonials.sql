-- Candidate stories are separate from client endorsements. Public visitors can
-- read only the curated fields returned by the approved-stories function.
create table public.candidate_testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(btrim(author_name)) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  relationship text not null check (relationship in ('prospective', 'past')),
  role_title text check (role_title is null or char_length(role_title) <= 120),
  quote text not null check (char_length(btrim(quote)) between 20 and 1200),
  publication_consent boolean not null check (publication_consent),
  submission_fingerprint text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  constraint candidate_testimonials_approved_date check (status <> 'approved' or published_at is not null)
);

create index candidate_testimonials_review_idx
  on public.candidate_testimonials (status, submitted_at desc);
create index candidate_testimonials_email_limit_idx
  on public.candidate_testimonials (lower(email), submitted_at desc);

create function private.limit_candidate_testimonial_submissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(pg_catalog.lower(new.email)));
  if (
    select count(*)
    from public.candidate_testimonials as t
    where pg_catalog.lower(t.email) = pg_catalog.lower(new.email)
      and t.submitted_at > pg_catalog.now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Candidate testimonial submission limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger candidate_testimonials_submission_limit
  before insert on public.candidate_testimonials
  for each row execute function private.limit_candidate_testimonial_submissions();

alter table public.candidate_testimonials enable row level security;
revoke all on public.candidate_testimonials from public, anon, authenticated;
grant select, update on public.candidate_testimonials to authenticated;
grant insert (author_name, email, relationship, role_title, quote, publication_consent, submission_fingerprint)
  on public.candidate_testimonials to anon, authenticated;
grant insert, select on public.candidate_testimonials to service_role;

create policy candidate_testimonials_public_submit on public.candidate_testimonials
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and published_at is null
    and publication_consent = true
  );

create policy candidate_testimonials_admin_read on public.candidate_testimonials
  for select to authenticated
  using (private.has_permission('content.view'));

create policy candidate_testimonials_admin_review on public.candidate_testimonials
  for update to authenticated
  using (private.has_permission('content.publish'))
  with check (private.has_permission('content.publish'));

create function public.get_approved_candidate_testimonials()
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
  order by t.published_at desc, t.submitted_at desc
  limit 200;
$$;

revoke all on function public.get_approved_candidate_testimonials() from public;
grant execute on function public.get_approved_candidate_testimonials() to anon, authenticated;
