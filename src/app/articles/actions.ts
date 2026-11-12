'use server'

import { createClient } from '@/lib/supabase/server'

export type EngagementResult = {
  success: boolean
  view_count: number
  like_count: number
  error?: string
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Record an authentic view for an article in Supabase and return the latest counts.
 */
export async function recordArticleViewAction(
  slug: string,
): Promise<EngagementResult> {
  if (!slug || !isValidSlug(slug)) {
    return { success: false, view_count: 0, like_count: 0, error: 'Invalid article slug' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .rpc('record_article_view', { p_article_slug: slug })
      .single()

    if (error || !data) {
      // Fallback: query existing counts if RPC failed
      const { data: existing } = await supabase
        .from('article_engagement')
        .select('view_count, like_count')
        .eq('article_slug', slug)
        .maybeSingle()

      return {
        success: !error,
        view_count: Number(existing?.view_count ?? 0),
        like_count: Number(existing?.like_count ?? 0),
        error: error?.message,
      }
    }

    const row = data as { view_count: number; like_count: number }
    return {
      success: true,
      view_count: Number(row.view_count ?? 0),
      like_count: Number(row.like_count ?? 0),
    }
  } catch (err) {
    return {
      success: false,
      view_count: 0,
      like_count: 0,
      error: err instanceof Error ? err.message : 'Unknown error recording view',
    }
  }
}

/**
 * Persist or remove an idempotent like for an article in Supabase.
 */
export async function setArticleLikeAction(
  slug: string,
  visitorId: string,
  liked: boolean,
): Promise<EngagementResult> {
  if (!slug || !isValidSlug(slug)) {
    return { success: false, view_count: 0, like_count: 0, error: 'Invalid article slug' }
  }

  if (!visitorId || !isValidUuid(visitorId)) {
    return { success: false, view_count: 0, like_count: 0, error: 'Invalid visitor ID' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .rpc('set_article_like', {
        p_article_slug: slug,
        p_visitor_id: visitorId,
        p_liked: liked,
      })
      .single()

    if (error || !data) {
      return {
        success: false,
        view_count: 0,
        like_count: 0,
        error: error?.message,
      }
    }

    const row = data as { view_count: number; like_count: number }
    return {
      success: true,
      view_count: Number(row.view_count ?? 0),
      like_count: Number(row.like_count ?? 0),
    }
  } catch (err) {
    return {
      success: false,
      view_count: 0,
      like_count: 0,
      error: err instanceof Error ? err.message : 'Unknown error updating like',
    }
  }
}

/**
 * Fetch the current first-party engagement counts for an article.
 */
export async function getArticleEngagementAction(
  slug: string,
): Promise<EngagementResult> {
  if (!slug || !isValidSlug(slug)) {
    return { success: false, view_count: 0, like_count: 0, error: 'Invalid article slug' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('article_engagement')
      .select('view_count, like_count')
      .eq('article_slug', slug)
      .maybeSingle()

    if (error || !data) {
      return {
        success: !error,
        view_count: 0,
        like_count: 0,
        error: error?.message,
      }
    }

    return {
      success: true,
      view_count: Number(data.view_count ?? 0),
      like_count: Number(data.like_count ?? 0),
    }
  } catch (err) {
    return {
      success: false,
      view_count: 0,
      like_count: 0,
      error: err instanceof Error ? err.message : 'Unknown error loading engagement',
    }
  }
}
