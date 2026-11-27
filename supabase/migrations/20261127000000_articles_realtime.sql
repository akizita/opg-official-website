-- Enable Postgres Changes realtime stream for articles, site_settings, authors, and category mappings
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'articles',
    'site_settings',
    'authors',
    'article_category_mappings'
  ]
  loop
    execute format('alter table public.%I replica identity full', tbl);
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
exception
  when undefined_object then
    null;
end
$$;
