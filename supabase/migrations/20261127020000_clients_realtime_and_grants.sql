-- Enable Postgres Changes realtime stream for public.clients and ensure service_role grants.

do $$
begin
  execute 'alter table public.clients replica identity full';
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'clients'
  ) then
    execute 'alter publication supabase_realtime add table public.clients';
  end if;
exception
  when undefined_object then
    null;
end
$$;

grant select on public.clients to anon, authenticated;
grant select, insert, update, delete on public.clients to service_role;
