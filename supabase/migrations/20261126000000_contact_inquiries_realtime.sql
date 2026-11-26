-- Enable Postgres Changes realtime stream for contact_inquiries when present
do $$
begin
  alter table public.contact_inquiries replica identity full;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contact_inquiries'
  ) then
    alter publication supabase_realtime add table public.contact_inquiries;
  end if;
exception
  when undefined_object then
    null;
end
$$;
