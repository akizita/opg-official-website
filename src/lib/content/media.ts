import fs from 'fs'
import path from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

export type MediaAsset = {
  id: string
  bucket_id: string
  file_path: string
  public_url: string
  file_name: string
  mime_type: string
  size_bytes: number
  alt_text: string
  caption?: string | null
  category: string
  created_at: string
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
]

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export function sanitizeFileName(name: string): string {
  const rawExt = path.extname(name)
  const ext = rawExt.toLowerCase()
  const base = path
    .basename(name, rawExt)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${base || 'image'}-${Date.now()}${ext}`
}

export async function uploadMediaAsset(
  file: File,
  meta: {
    altText: string
    category?: string
    caption?: string
  },
  client?: SupabaseClient,
): Promise<{ success: boolean; asset?: MediaAsset; error?: string }> {
  // Validate file presence
  if (!file || file.size === 0) {
    return { success: false, error: 'No image file provided.' }
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: 'File exceeds the 5 MB maximum size limit.',
    }
  }

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Unsupported image format (${file.type}). Allowed formats: JPEG, PNG, WebP, AVIF, SVG.`,
    }
  }

  const category = (meta.category || 'general').toLowerCase().trim()
  const fileName = sanitizeFileName(file.name)
  const filePath = `${category}/${fileName}`
  const altText = meta.altText?.trim() || ''

  const supabase = client ?? (await createClient())

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Attempt upload to Supabase Storage 'public-media' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('public-media')
        .getPublicUrl(uploadData.path)

      const publicUrl = urlData.publicUrl

      // Save metadata to media_assets table if available
      const { data: assetRow } = await supabase
        .from('media_assets')
        .insert({
          bucket_id: 'public-media',
          file_path: uploadData.path,
          public_url: publicUrl,
          file_name: fileName,
          mime_type: file.type,
          size_bytes: file.size,
          alt_text: altText,
          caption: meta.caption || null,
          category,
        })
        .select()
        .maybeSingle<MediaAsset>()

      return {
        success: true,
        asset: assetRow || {
          id: uploadData.path,
          bucket_id: 'public-media',
          file_path: uploadData.path,
          public_url: publicUrl,
          file_name: fileName,
          mime_type: file.type,
          size_bytes: file.size,
          alt_text: altText,
          caption: meta.caption || null,
          category,
          created_at: new Date().toISOString(),
        },
      }
    }

    // Fallback: If bucket is not yet created in remote Supabase, write to local public/uploads/
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', category)
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const localFilePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(localFilePath, buffer)

    const publicUrl = `/uploads/${category}/${fileName}`

    const localAsset: MediaAsset = {
      id: `local-${fileName}`,
      bucket_id: 'local',
      file_path: `${category}/${fileName}`,
      public_url: publicUrl,
      file_name: fileName,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText,
      caption: meta.caption || null,
      category,
      created_at: new Date().toISOString(),
    }

    return {
      success: true,
      asset: localAsset,
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Unknown storage error occurred',
    }
  }
}

export async function getMediaAssets(
  category?: string,
  client?: SupabaseClient,
): Promise<MediaAsset[]> {
  const supabase = client ?? (await createClient())
  const assets: MediaAsset[] = []

  // 1. Try fetching from public.media_assets table
  try {
    let query = supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data } = await query
    if (data && data.length > 0) {
      return data as MediaAsset[]
    }
  } catch {
    // Continue to storage bucket or local listing
  }

  // 2. Try listing from Supabase storage 'public-media' bucket
  try {
    const { data: files } = await supabase.storage
      .from('public-media')
      .list(category && category !== 'all' ? category : '', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (files && files.length > 0) {
      for (const f of files) {
        if (!f.name || f.name === '.emptyFolderPlaceholder') continue
        const fullPath =
          category && category !== 'all' ? `${category}/${f.name}` : f.name
        const { data: urlData } = supabase.storage
          .from('public-media')
          .getPublicUrl(fullPath)

        assets.push({
          id: f.id || fullPath,
          bucket_id: 'public-media',
          file_path: fullPath,
          public_url: urlData.publicUrl,
          file_name: f.name,
          mime_type: f.metadata?.mimetype || 'image/jpeg',
          size_bytes: f.metadata?.size || 0,
          alt_text: f.name.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, ''),
          category: category || 'general',
          created_at: f.created_at || new Date().toISOString(),
        })
      }
      return assets
    }
  } catch {
    // Continue to local directory check
  }

  // 3. Fallback: Check local public/uploads directory
  try {
    const uploadsBase = path.join(process.cwd(), 'public', 'uploads')
    if (fs.existsSync(uploadsBase)) {
      const categories =
        category && category !== 'all'
          ? [category]
          : fs.readdirSync(uploadsBase)
      for (const cat of categories) {
        const catDir = path.join(uploadsBase, cat)
        if (fs.statSync(catDir).isDirectory()) {
          const fileNames = fs.readdirSync(catDir)
          for (const fn of fileNames) {
            const stat = fs.statSync(path.join(catDir, fn))
            assets.push({
              id: `local-${cat}-${fn}`,
              bucket_id: 'local',
              file_path: `${cat}/${fn}`,
              public_url: `/uploads/${cat}/${fn}`,
              file_name: fn,
              mime_type: fn.endsWith('.svg')
                ? 'image/svg+xml'
                : fn.endsWith('.png')
                  ? 'image/png'
                  : fn.endsWith('.webp')
                    ? 'image/webp'
                    : 'image/jpeg',
              size_bytes: stat.size,
              alt_text: fn.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, ''),
              category: cat,
              created_at: stat.birthtime.toISOString(),
            })
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return assets
}
