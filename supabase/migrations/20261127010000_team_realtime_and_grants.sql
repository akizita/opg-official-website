-- Enable Postgres Changes realtime stream for team_members and departments,
-- and grant service_role privileges on team management tables.

do $$
declare
  tbl text;
begin
  foreach tbl in array array['team_members', 'departments']
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

grant select, insert, update, delete on
  public.departments,
  public.team_members
to service_role;
