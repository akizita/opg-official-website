alter table public.articles
  add column if not exists source_url text,
  add column if not exists view_count bigint,
  add column if not exists like_count integer,
  add column if not exists comment_count integer;

alter table public.articles
  add constraint articles_view_count_nonnegative
    check (view_count is null or view_count >= 0),
  add constraint articles_like_count_nonnegative
    check (like_count is null or like_count >= 0),
  add constraint articles_comment_count_nonnegative
    check (comment_count is null or comment_count >= 0);

comment on column public.articles.source_url is
  'Optional canonical source URL when an article was first published externally.';

comment on column public.articles.view_count is
  'Publisher-supplied article view count; null when the source does not expose it publicly.';

comment on column public.articles.like_count is
  'Latest verified public reaction or like count from the source platform.';

comment on column public.articles.comment_count is
  'Latest verified public comment count from the source platform.';
