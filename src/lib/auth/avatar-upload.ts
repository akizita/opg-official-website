import { createPrivilegedClient } from '@/lib/supabase/server'

export const ALLOWED_AVATAR_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export type UploadProfileAvatarResult =
  | { avatarUrl: string; ok: true }
  | { error: string; ok: false }

/**
 * Validates and uploads a user profile image into the `public-media` bucket.
 */
export async function uploadProfileAvatarFile(
  file: File,
  pathPrefix: string,
): Promise<UploadProfileAvatarResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Please select an image file.' }
  }

  const ext = ALLOWED_AVATAR_TYPES.get(file.type.toLowerCase())
  if (!ext) {
    return {
      ok: false,
      error: 'Please upload a PNG, JPG, WebP, or GIF image.',
    }
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Profile image must be 2 MB or smaller.' }
  }

  const privilegedClient = createPrivilegedClient()
  if (!privilegedClient) {
    return {
      ok: false,
      error: 'Storage service is unavailable right now.',
    }
  }

  const storagePath = `avatars/${pathPrefix}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await privilegedClient.storage
    .from('public-media')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return { ok: false, error: 'Could not upload profile photo.' }
  }

  const { data: publicUrlData } = privilegedClient.storage
    .from('public-media')
    .getPublicUrl(storagePath)

  const avatarUrl = publicUrlData?.publicUrl
  if (!avatarUrl) {
    return { ok: false, error: 'Could not resolve uploaded photo URL.' }
  }

  return { ok: true, avatarUrl }
}
