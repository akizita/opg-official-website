-- Allow anonymous RLS evaluations of public articles/authors/categories policies
-- to call private.has_permission cleanly (returns false when auth.uid() is null),
-- and grant service_role privileges on article and site_settings tables.

grant usage on schema private to anon;
grant execute on function private.has_permission(text) to anon;

grant select, insert, update, delete on
  public.authors,
  public.article_categories,
  public.article_tags,
  public.articles,
  public.article_category_mappings,
  public.article_tag_mappings,
  public.site_settings
to service_role;
