import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

export type SearchEntityType =
  'article' | 'service' | 'faq' | 'job_opening' | 'page_document'

export type SearchResult = {
  id: string
  entity_type: SearchEntityType
  entity_id: string
  title: string
  excerpt: string | null
  url_path: string
  created_at: string
}

export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return ''
  // 100 char limit per Section 6.3 of architecture baseline
  return query
    .slice(0, 100)
    .replace(/[^\w\s-]/g, ' ')
    .trim()
}

export async function searchPublishedDocuments(
  query: string,
  options?: {
    limit?: number
    offset?: number
    client?: SupabaseClient
  },
): Promise<{
  results: SearchResult[]
  total: number
  sanitizedQuery: string
}> {
  const sanitized = sanitizeSearchQuery(query)
  if (!sanitized) {
    return { results: [], total: 0, sanitizedQuery: '' }
  }

  const limit = Math.max(1, Math.min(50, options?.limit ?? 10))
  const offset = Math.max(0, options?.offset ?? 0)
  const supabase = options?.client ?? (await createClient())

  // Search using textSearch on search_vector, falling back to title/excerpt ilike
  const { data, error, count } = await supabase
    .from('search_documents')
    .select('*', { count: 'exact' })
    .textSearch('search_vector', sanitized, {
      type: 'websearch',
      config: 'english',
    })
    .range(offset, offset + limit - 1)

  if (!error && data && data.length > 0) {
    return {
      results: data as SearchResult[],
      total: count ?? data.length,
      sanitizedQuery: sanitized,
    }
  }

  // Fallback to title/excerpt ilike if websearch returns 0 results
  const terms = sanitized.split(/\s+/).filter(Boolean)
  const pattern = `%${terms.join('%')}%`

  const { data: fallbackData, count: fallbackCount } = await supabase
    .from('search_documents')
    .select('*', { count: 'exact' })
    .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
    .range(offset, offset + limit - 1)

  return {
    results: (fallbackData as SearchResult[]) || [],
    total: fallbackCount ?? fallbackData?.length ?? 0,
    sanitizedQuery: sanitized,
  }
}
