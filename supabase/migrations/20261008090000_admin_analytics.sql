-- Privacy-conscious first-party analytics for the OPG administration overview.
-- Only aggregate daily counts are retained; no IP address or visitor profile is stored.

create table if not exists public.site_visit_daily (
  visit_date date primary key default current_date,
  visit_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint site_visit_daily_count_nonnegative check (visit_count >= 0)
);

create table if not exists public.article_engagement_daily (
  article_slug text not null,
  engagement_date date not null default current_date,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (article_slug, engagement_date),
  constraint article_engagement_daily_slug_format
    check (article_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint article_engagement_daily_views_nonnegative check (view_count >= 0),
  constraint article_engagement_daily_likes_nonnegative check (like_count >= 0)
);

create index if not exists article_engagement_daily_date_idx
  on public.article_engagement_daily (engagement_date desc);

alter table public.site_visit_daily enable row level security;
alter table public.article_engagement_daily enable row level security;

create policy site_visit_daily_admin_read
  on public.site_visit_daily
  for select
  to authenticated
  using (private.has_permission('content.view'));

create policy article_engagement_daily_admin_read
  on public.article_engagement_daily
  for select
  to authenticated
  using (private.has_permission('content.view'));

grant select on public.site_visit_daily to authenticated;
grant select on public.article_engagement_daily to authenticated;

create or replace function public.record_site_visit()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.site_visit_daily (visit_date, visit_count)
  values (current_date, 1)
  on conflict (visit_date) do update
    set visit_count = public.site_visit_daily.visit_count + 1,
        updated_at = now();
end;
$$;

revoke all on function public.record_site_visit() from public;
grant execute on function public.record_site_visit() to anon, authenticated;

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

  insert into public.article_engagement_daily (
    article_slug,
    engagement_date,
    view_count
  )
  values (p_article_slug, current_date, 1)
  on conflict (article_slug, engagement_date) do update
    set view_count = public.article_engagement_daily.view_count + 1,
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

      insert into public.article_engagement_daily (
        article_slug,
        engagement_date,
        like_count
      )
      values (p_article_slug, current_date, 1)
      on conflict (article_slug, engagement_date) do update
        set like_count = public.article_engagement_daily.like_count + 1,
            updated_at = now();
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

comment on table public.site_visit_daily is
  'Aggregate first-party website visits recorded once per browser session.';

comment on table public.article_engagement_daily is
  'Daily first-party article views and newly recorded likes for CMS analytics.';
