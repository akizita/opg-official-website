-- Store the authenticated submitter's profile photo URL with contact inquiries
-- and candidate testimonials so admin inboxes and public stories retain it.
alter table public.contact_inquiries
  add column if not exists avatar_url text;

alter table public.candidate_testimonials
  add column if not exists avatar_url text;

grant insert (avatar_url) on public.candidate_testimonials to anon, authenticated;
