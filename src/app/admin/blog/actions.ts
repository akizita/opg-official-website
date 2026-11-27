'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canEditDraft } from '@/lib/auth/permissions'
import {
  CLIENTS_BLOG_SETTING_KEY,
  type ClientsBlogConfig,
  cloneDefaultClientsBlogConfig,
  normalizeClientsBlogConfig,
} from '@/lib/content/clients-blog'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export type BlogStudioActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  updatedAt?: string
  savedConfig?: ClientsBlogConfig
}

const MAX_BLOG_IMAGE_BYTES = 5 * 1024 * 1024 // Matches public-media bucket limit (5 MB)
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/gif',
])

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
}

function revalidateBlogSurfaces() {
  revalidatePath('/clients')
  revalidatePath('/admin/blog')
  revalidatePath('/admin')
}

export async function saveClientsBlogAction(
  _prevState: BlogStudioActionState,
  formData: FormData,
): Promise<BlogStudioActionState> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return {
      status: 'error',
      message: 'You do not have permission to edit the Clients Blog section.',
    }
  }

  const rawPayload = formData.get('payload')
  if (typeof rawPayload !== 'string' || !rawPayload.trim()) {
    return {
      status: 'error',
      message: 'Missing blog canvas configuration payload.',
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawPayload)
  } catch {
    return {
      status: 'error',
      message: 'Invalid blog configuration format.',
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      status: 'error',
      message: 'Invalid blog configuration object.',
    }
  }

  const rawObj = parsed as Record<string, unknown>
  if (typeof rawObj.title !== 'string' || !rawObj.title.trim()) {
    return {
      status: 'error',
      message: 'Editorial title cannot be blank.',
    }
  }
  if (typeof rawObj.authorName !== 'string' || !rawObj.authorName.trim()) {
    return {
      status: 'error',
      message: 'Written By author name cannot be blank.',
    }
  }

  const nowIso = new Date().toISOString()
  const normalized = normalizeClientsBlogConfig({
    ...rawObj,
    updatedAt: nowIso,
  })

  if (normalized.blocks.length === 0) {
    return {
      status: 'error',
      message: 'Keep at least one text or photo block in the blog body.',
    }
  }

  const db = createPrivilegedClient() ?? (await createClient())

  const { error } = await db.from('site_settings').upsert(
    {
      setting_key: CLIENTS_BLOG_SETTING_KEY,
      setting_value: normalized,
      description:
        'Live configuration for the Editorial Blog section on /clients',
      updated_at: nowIso,
      updated_by: profile.id,
    },
    { onConflict: 'setting_key' },
  )

  if (error) {
    return {
      status: 'error',
      message: `Could not publish blog changes: ${error.message}`,
    }
  }

  revalidateBlogSurfaces()

  return {
    status: 'success',
    message: 'Blog changes published live to /clients.',
    updatedAt: nowIso,
    savedConfig: normalized,
  }
}

export async function resetClientsBlogAction(): Promise<{
  success: boolean
  config?: ClientsBlogConfig
  error?: string
}> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to reset the Clients Blog section.',
    }
  }

  const db = createPrivilegedClient() ?? (await createClient())
  const { error } = await db
    .from('site_settings')
    .delete()
    .eq('setting_key', CLIENTS_BLOG_SETTING_KEY)

  if (error) {
    return {
      success: false,
      error: `Failed to reset blog layout: ${error.message}`,
    }
  }

  revalidateBlogSurfaces()
  return { success: true, config: cloneDefaultClientsBlogConfig() }
}

export async function uploadClientsBlogImageAction(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to upload blog images.',
    }
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Select an image file to upload.' }
  }

  if (file.size > MAX_BLOG_IMAGE_BYTES) {
    return { success: false, error: 'Image must be 5 MB or smaller.' }
  }

  const mime = file.type.toLowerCase()
  const extFromName = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedExt = new Set([
    'jpg',
    'jpeg',
    'png',
    'webp',
    'avif',
    'svg',
    'gif',
  ])

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mime) && !allowedExt.has(extFromName)) {
    return {
      success: false,
      error: 'Upload a PNG, JPG, WEBP, AVIF, GIF, or SVG image.',
    }
  }

  const ext = EXTENSION_BY_MIME[mime] || extFromName || 'png'
  const baseName = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  const objectPath = `blog/${baseName || 'visual'}-${Date.now()}.${ext}`

  const db = createPrivilegedClient() ?? (await createClient())
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await db.storage
    .from('public-media')
    .upload(objectPath, buffer, {
      contentType: file.type || 'image/png',
      upsert: true,
    })

  if (uploadError) {
    return {
      success: false,
      error: `Upload failed: ${uploadError.message}`,
    }
  }

  const { data: publicUrlData } = db.storage
    .from('public-media')
    .getPublicUrl(objectPath)

  return {
    success: true,
    url: publicUrlData.publicUrl,
  }
}
