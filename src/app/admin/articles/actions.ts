'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canEditDraft, canPublish } from '@/lib/auth/permissions'
import {
  type Article,
  markdownToRichTextBlocks,
} from '@/lib/content/articles'
import { createClient } from '@/lib/supabase/server'
import type { ArticleActionState } from './types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function saveArticleAction(
  _prevState: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return {
      status: 'error',
      message: 'You do not have permission to create or edit articles.',
    }
  }

  const rawId = (formData.get('id') as string | null)?.trim() || ''
  const title = (formData.get('title') as string | null)?.trim() || ''
  let slug = (formData.get('slug') as string | null)?.trim().toLowerCase() || ''
  const excerpt = (formData.get('excerpt') as string | null)?.trim() || ''
  const markdownContent =
    (formData.get('markdownContent') as string | null)?.trim() || ''
  const coverImageUrl =
    (formData.get('cover_image_url') as string | null)?.trim() || null
  const status = (
    (formData.get('status') as string | null)?.trim() || 'draft'
  ) as Article['status']
  const authorIdRaw =
    (formData.get('author_id') as string | null)?.trim() || null
  const categoryIdRaw =
    (formData.get('category_id') as string | null)?.trim() || null
  const seoTitle =
    (formData.get('seo_title') as string | null)?.trim() || null
  const seoDescription =
    (formData.get('seo_description') as string | null)?.trim() || null

  const errors: Record<string, string> = {}

  if (!title) {
    errors.title = 'Title is required.'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  }

  if (!slug) {
    slug = slugify(title)
  }

  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      'Slug must contain only lowercase letters, numbers, and hyphens.'
  }

  if (!excerpt) {
    errors.excerpt = 'Excerpt/summary is required.'
  } else if (excerpt.length > 500) {
    errors.excerpt = 'Excerpt must be 500 characters or fewer.'
  }

  if (status === 'published' && !canPublish(profile.roleKey)) {
    errors.status = 'Your role cannot directly publish articles.'
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      errors,
      message: 'Please review and fix the validation errors.',
    }
  }

  const contentBlocks = markdownToRichTextBlocks(markdownContent)
  const wordCount = markdownContent
    .split(/\s+/)
    .filter(Boolean).length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  const authorId =
    authorIdRaw && UUID_REGEX.test(authorIdRaw) ? authorIdRaw : null
  const categoryId = categoryIdRaw ? Number.parseInt(categoryIdRaw, 10) : null

  const supabase = await createClient()

  const isExistingUuid = UUID_REGEX.test(rawId)
  let targetArticleId = isExistingUuid ? rawId : null

  const nowIso = new Date().toISOString()
  const articlePayload = {
    title,
    slug,
    excerpt,
    content: contentBlocks,
    cover_image_url: coverImageUrl,
    reading_time_minutes: readingTimeMinutes,
    status,
    author_id: authorId,
    seo_title: seoTitle || title,
    seo_description: seoDescription || excerpt,
    updated_at: nowIso,
    updated_by: profile.id,
    ...(status === 'published' ? { published_at: nowIso, published_by: profile.id } : {}),
  }

  if (targetArticleId) {
    // Update existing article by UUID
    const { error: updateError } = await supabase
      .from('articles')
      .update(articlePayload)
      .eq('id', targetArticleId)

    if (updateError) {
      return {
        status: 'error',
        message: `Failed to update article: ${updateError.message}`,
      }
    }
  } else {
    // Check if an article with this slug already exists (e.g. from featured articles seed)
    const { data: existingBySlug } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingBySlug) {
      targetArticleId = existingBySlug.id
      const { error: updateError } = await supabase
        .from('articles')
        .update(articlePayload)
        .eq('id', targetArticleId)

      if (updateError) {
        return {
          status: 'error',
          message: `Failed to update article: ${updateError.message}`,
        }
      }
    } else {
      // Insert new article
      const { data: inserted, error: insertError } = await supabase
        .from('articles')
        .insert({
          ...articlePayload,
          created_at: nowIso,
          created_by: profile.id,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        return {
          status: 'error',
          message: `Failed to create article: ${insertError?.message || 'Unknown database error'}`,
        }
      }

      targetArticleId = inserted.id
    }
  }

  // Handle Category Mapping
  if (targetArticleId && Number.isInteger(categoryId) && categoryId! > 0) {
    await supabase
      .from('article_category_mappings')
      .delete()
      .eq('article_id', targetArticleId)

    await supabase.from('article_category_mappings').insert({
      article_id: targetArticleId,
      category_id: categoryId!,
    })
  }

  // Ensure an engagement row exists for telemetry
  await supabase.from('article_engagement').upsert(
    {
      article_slug: slug,
      view_count: 0,
      like_count: 0,
      updated_at: nowIso,
    },
    { onConflict: 'article_slug', ignoreDuplicates: true },
  )

  revalidatePath('/admin/articles')
  revalidatePath('/admin')
  revalidatePath('/articles')
  revalidatePath(`/articles/${slug}`)

  return {
    status: 'success',
    articleId: targetArticleId || undefined,
    slug,
    message:
      status === 'published'
        ? 'Article published successfully and live on the website!'
        : 'Article saved successfully.',
  }
}

export async function deleteArticleAction(formData: FormData) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to delete articles.')
  }

  const articleId = (formData.get('articleId') as string | null)?.trim() || ''
  const slug = (formData.get('slug') as string | null)?.trim() || ''

  if (!articleId && !slug) {
    throw new Error('Article identifier is required.')
  }

  const supabase = await createClient()

  if (UUID_REGEX.test(articleId)) {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId)

    if (error) {
      throw new Error(`Failed to delete article: ${error.message}`)
    }
  } else if (slug) {
    // Delete by slug if ID is non-UUID
    await supabase.from('articles').delete().eq('slug', slug)
  }

  revalidatePath('/admin/articles')
  revalidatePath('/admin')
  revalidatePath('/articles')
  if (slug) {
    revalidatePath(`/articles/${slug}`)
  }

  return { success: true }
}

export async function updateArticleStatusAction(
  articleId: string,
  newStatus: Article['status'],
  slug?: string,
) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (newStatus === 'published' && !canPublish(profile.roleKey)) {
    throw new Error('Unauthorized to publish articles.')
  } else if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to modify article status.')
  }

  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const payload: Record<string, unknown> = {
    status: newStatus,
    updated_at: nowIso,
    updated_by: profile.id,
  }

  if (newStatus === 'published') {
    payload.published_at = nowIso
    payload.published_by = profile.id
  }

  if (UUID_REGEX.test(articleId)) {
    const { error } = await supabase
      .from('articles')
      .update(payload)
      .eq('id', articleId)

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`)
    }
  } else if (slug) {
    await supabase.from('articles').update(payload).eq('slug', slug)
  }

  revalidatePath('/admin/articles')
  revalidatePath('/admin')
  revalidatePath('/articles')
  if (slug) {
    revalidatePath(`/articles/${slug}`)
  }

  return { success: true }
}
