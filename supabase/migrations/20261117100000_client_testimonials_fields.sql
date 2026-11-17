-- Migration: Enhance public.testimonials with Client Association, Headline, and Photo
-- Adds client_id foreign key, headline, photo_url, and rating to public.testimonials

alter table public.testimonials
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists headline text,
  add column if not exists photo_url text,
  add column if not exists rating smallint not null default 5;

-- Helpful index for joining testimonials to client organizations
create index if not exists testimonials_client_id_idx
  on public.testimonials (client_id);

-- Optimized index for published endorsements carousel query
create index if not exists testimonials_status_order_idx
  on public.testimonials (status, display_order)
  where status = 'published';

-- Ensure authenticated administrators with content permissions can manage testimonials
grant select, insert, update, delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
