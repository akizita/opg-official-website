-- OPG Storage Buckets and Media Access Policies
-- Version: 1.0 (Phase 1 Baseline)

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
create policy public_media_select on storage.objects
  for select using (bucket_id = 'public-media');

-- Public Media: Publishers & Super Admins can upload/manage published media
create policy public_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (select private.has_permission('content.publish'))
  );

create policy public_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'public-media'
    and (select private.has_permission('content.publish'))
  )
  with check (
    bucket_id = 'public-media'
    and (select private.has_permission('content.publish'))
  );

create policy public_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'public-media'
    and (select private.has_permission('content.publish'))
  );

-- Draft Media: Only authenticated staff with media.draft.write can read/write drafts
create policy draft_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  );

create policy draft_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  );

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

create policy draft_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'draft-media'
    and (select private.has_permission('media.draft.write'))
  );

