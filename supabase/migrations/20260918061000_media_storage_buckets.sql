-- OPG Storage Buckets and Media Access Policies
-- Version: 1.1 (Storage Buckets, RLS, and Media Assets Table)

-- =============================================================================
-- 1. Create Media Buckets
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'draft-media',
    'draft-media',
    false,
    5242880, -- 5 MB
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml'
    ]::text[]
  ),
  (
    'public-media',
    'public-media',
    true,
    5242880, -- 5 MB
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml'
    ]::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =============================================================================
-- 2. Storage Objects Access Policies
-- =============================================================================

-- Public Media: Anyone can view published media
drop policy if exists public_media_select on storage.objects;
create policy public_media_select on storage.objects
  for select using (bucket_id = 'public-media');

-- Public Media: Staff with media.draft.write or content.publish can upload/manage
drop policy if exists public_media_insert on storage.objects;
create policy public_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (
      (select private.has_permission('media.draft.write'))
      or (select private.has_permission('content.publish'))
    )
  );

drop policy if exists public_media_update on storage.objects;
create policy public_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'public-media'
    and (
      (select private.has_permission('media.draft.write'))
      or (select private.has_permission('content.publish'))
    )
  )
  with check (
    bucket_id = 'public-media'
    and (
      (select private.has_permission('media.draft.write'))
      or (select private.has_permission('content.publish'))
    )
  );

drop policy if exists public_media_delete on storage.objects;
create policy public_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'public-media'
    and (
      (select private.has_permission('media.draft.write'))
      or (select private.has_permission('content.publish'))
    )
  );

-- Draft Media: Only authenticated staff with media.draft.write can read/write drafts
drop policy if exists draft_media_select on storage.objects;
create policy draft_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  );

drop policy if exists draft_media_insert on storage.objects;
create policy draft_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  );

drop policy if exists draft_media_update on storage.objects;
create policy draft_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  )
  with check (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  );

drop policy if exists draft_media_delete on storage.objects;
create policy draft_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  );

-- =============================================================================
-- 3. Media Assets Metadata Table
-- =============================================================================

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'public-media',
  file_path text not null unique,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  alt_text text not null default '',
  caption text,
  category text not null default 'general',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.media_assets enable row level security;

-- Public can view media assets records for public-media
drop policy if exists media_assets_select_public on public.media_assets;
create policy media_assets_select_public on public.media_assets
  for select using (bucket_id = 'public-media');

-- Authenticated staff can insert/update media assets
drop policy if exists media_assets_insert_staff on public.media_assets;
create policy media_assets_insert_staff on public.media_assets
  for insert to authenticated
  with check (
    (select private.has_permission('media.draft.write'))
    or (select private.has_permission('content.publish'))
  );

drop policy if exists media_assets_update_staff on public.media_assets;
create policy media_assets_update_staff on public.media_assets
  for update to authenticated
  using (
    (select private.has_permission('media.draft.write'))
    or (select private.has_permission('content.publish'))
  );

drop policy if exists media_assets_delete_staff on public.media_assets;
create policy media_assets_delete_staff on public.media_assets
  for delete to authenticated
  using (
    (select private.has_permission('media.draft.write'))
    or (select private.has_permission('content.publish'))
  );

grant select on public.media_assets to anon, authenticated;
grant insert, update, delete on public.media_assets to authenticated;
