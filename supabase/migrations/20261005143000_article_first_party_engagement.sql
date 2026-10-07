alter table public.authors
  add column if not exists role_title text;

comment on column public.authors.role_title is
  'Public-facing position or editorial role displayed with published articles.';

create table if not exists public.article_engagement (
  article_slug text primary key,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint article_engagement_slug_format
    check (article_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint article_engagement_views_nonnegative check (view_count >= 0),
  constraint article_engagement_likes_nonnegative check (like_count >= 0)
);

create table if not exists public.article_likes (
  article_slug text not null references public.article_engagement(article_slug) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (article_slug, visitor_id)
);

alter table public.article_engagement enable row level security;
alter table public.article_likes enable row level security;

create policy article_engagement_public_read
  on public.article_engagement
  for select
  to anon, authenticated
  using (true);

grant select on public.article_engagement to anon, authenticated;
revoke all on public.article_likes from anon, authenticated;

create or replace function public.record_article_view(p_article_slug text)
returns table(view_count bigint, like_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_article_slug is null
    or p_article_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid article slug';
  end if;

  insert into public.article_engagement (article_slug, view_count)
  values (p_article_slug, 1)
  on conflict (article_slug) do update
    set view_count = public.article_engagement.view_count + 1,
        updated_at = now();

  return query
    select engagement.view_count, engagement.like_count
    from public.article_engagement as engagement
    where engagement.article_slug = p_article_slug;
end;
$$;

create or replace function public.set_article_like(
  p_article_slug text,
  p_visitor_id uuid,
  p_liked boolean
)
returns table(view_count bigint, like_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_rows integer;
begin
  if p_article_slug is null
    or p_article_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or p_visitor_id is null
    or p_liked is null then
    raise exception 'Invalid article engagement request';
  end if;

  insert into public.article_engagement (article_slug)
  values (p_article_slug)
  on conflict (article_slug) do nothing;

  if p_liked then
    insert into public.article_likes (article_slug, visitor_id)
    values (p_article_slug, p_visitor_id)
    on conflict do nothing;

    get diagnostics affected_rows = row_count;

    if affected_rows > 0 then
      update public.article_engagement
      set like_count = public.article_engagement.like_count + 1,
          updated_at = now()
      where article_slug = p_article_slug;
    end if;
  else
    delete from public.article_likes
    where article_slug = p_article_slug
      and visitor_id = p_visitor_id;

    get diagnostics affected_rows = row_count;

    if affected_rows > 0 then
      update public.article_engagement
      set like_count = greatest(public.article_engagement.like_count - 1, 0),
          updated_at = now()
      where article_slug = p_article_slug;
    end if;
  end if;

  return query
    select engagement.view_count, engagement.like_count
    from public.article_engagement as engagement
    where engagement.article_slug = p_article_slug;
end;
$$;

revoke all on function public.record_article_view(text) from public;
revoke all on function public.set_article_like(text, uuid, boolean) from public;
grant execute on function public.record_article_view(text) to anon, authenticated;
grant execute on function public.set_article_like(text, uuid, boolean) to anon, authenticated;

comment on table public.article_engagement is
  'First-party OPG website views and likes, separate from external publishing metrics.';

comment on table public.article_likes is
  'Anonymous visitor like records used to keep website article likes idempotent.';
