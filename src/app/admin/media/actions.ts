'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canManageMedia } from '@/lib/auth/permissions'
import { uploadMediaAsset } from '@/lib/content/media'

export type UploadMediaResult = {
  success: boolean
  url?: string
  altText?: string
  fileName?: string
  error?: string
}

export async function uploadMediaAction(
  formData: FormData,
): Promise<UploadMediaResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageMedia(profile.roleKey)) {
    return {
      success: false,
      error: 'Unauthorized: Media write permission required.',
    }
  }

  const file = formData.get('file') as File | null
  const altText = String(formData.get('altText') || '').trim()
  const category = String(formData.get('category') || 'general').trim()

  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Please choose an image file to upload.' }
  }

  if (!altText) {
    return {
      success: false,
      error: 'Please enter descriptive alternative text (alt text).',
    }
  }

  const res = await uploadMediaAsset(file, { altText, category })

  if (!res.success || !res.asset) {
    return {
      success: false,
      error: res.error || 'Failed to process media upload.',
    }
  }

  revalidatePath('/admin/media')
  return {
    success: true,
    url: res.asset.public_url,
    altText: res.asset.alt_text,
    fileName: res.asset.file_name,
  }
}
