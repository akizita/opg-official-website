'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

const ALLOWED_AVATAR_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export type UploadAdminAvatarResult =
  | { avatarUrl: string; ok: true }
  | { error: string; ok: false }

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/sign-in')
}

export async function uploadAdminAvatarAction(
  formData: FormData,
): Promise<UploadAdminAvatarResult> {
  try {
    const { profile } = await requireAdminSession({ requireAal2: true })
    const file = formData.get('avatar')

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

    const storagePath = `avatars/${profile.id}-${Date.now()}.${ext}`
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

    const { data: adminUser } =
      await privilegedClient.auth.admin.getUserById(profile.id)
    const existingMetadata =
      (adminUser?.user?.user_metadata as Record<string, unknown> | undefined) ??
      {}

    const { error: updateAdminError } =
      await privilegedClient.auth.admin.updateUserById(profile.id, {
        user_metadata: {
          ...existingMetadata,
          avatar_url: avatarUrl,
        },
      })

    if (updateAdminError) {
      return { ok: false, error: 'Could not save profile photo.' }
    }

    const supabase = await createClient()
    await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } }).catch(() => {})

    revalidatePath('/admin', 'layout')
    return { ok: true, avatarUrl }
  } catch {
    return { ok: false, error: 'Could not update profile photo.' }
  }
}
