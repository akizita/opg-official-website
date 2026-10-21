-- Store named visual-editor revisions separately from the current page document.
-- The trigger writes the snapshot in the same transaction as the page save.

alter table public.page_documents
  add column visual_revision_id uuid,
  add column visual_revision_title text,
  add constraint page_documents_visual_revision_title_valid check (
    (visual_revision_id is null and visual_revision_title is null)
    or (
      visual_revision_id is not null
      and visual_revision_title is not null
      and length(btrim(visual_revision_title)) between 1 and 120
    )
  );

create table public.page_visual_versions (
  id uuid primary key,
  page_document_id uuid not null references public.page_documents(id) on delete cascade,
  page_slug text not null,
  page_version integer not null,
  version_title text not null,
  status text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text not null,
  created_at timestamptz not null,
  constraint page_visual_versions_page_version_unique unique (page_document_id, page_version),
  constraint page_visual_versions_title_valid check (length(btrim(version_title)) between 1 and 120),
  constraint page_visual_versions_status_valid check (
    status in ('draft', 'in_review', 'changes_requested', 'published', 'unpublished', 'archived')
  )
);

create index page_visual_versions_page_date_idx
  on public.page_visual_versions (page_slug, created_at desc);

create or replace function public.capture_visual_page_version()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  author_name text;
begin
  if new.visual_revision_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.visual_revision_id is not distinct from old.visual_revision_id then
      return new;
    end if;
  end if;

  select display_name into author_name
  from public.admin_profiles
  where id = new.updated_by;

  insert into public.page_visual_versions (
    id, page_document_id, page_slug, page_version, version_title,
    status, snapshot, created_by, created_by_name, created_at
  ) values (
    new.visual_revision_id, new.id, new.slug, new.version,
    new.visual_revision_title, new.status, to_jsonb(new),
    new.updated_by, coalesce(author_name, 'Unknown admin'), new.updated_at
  );
  return new;
end;
$$;

create trigger page_documents_capture_visual_version
  after insert or update on public.page_documents
  for each row execute function public.capture_visual_page_version();

create or replace function public.protect_visual_page_version()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.page_documents where id = old.page_document_id
  ) then
    return old;
  end if;
  if old.status <> 'draft' or exists (
    select 1 from public.page_documents
    where id = old.page_document_id and version <= old.page_version
  ) then
    raise exception 'Only older draft versions can be deleted';
  end if;
  return old;
end;
$$;

create trigger page_visual_versions_protect_delete
  before delete on public.page_visual_versions
  for each row execute function public.protect_visual_page_version();

alter table public.page_visual_versions enable row level security;

create policy page_visual_versions_admin_read
  on public.page_visual_versions for select to authenticated
  using (private.has_permission('content.view'));

create policy page_visual_versions_admin_delete
  on public.page_visual_versions for delete to authenticated
  using (
    status = 'draft'
    and private.has_permission('content.draft.write')
    and exists (
      select 1 from public.page_documents
      where id = page_document_id and version > page_version
    )
  );

grant select, delete on public.page_visual_versions to authenticated;
grant select, insert, update, delete on public.page_visual_versions to service_role;
