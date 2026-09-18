import type { SupabaseClient } from '@supabase/supabase-js'

import type { RichTextBlock } from '@/lib/content/page-documents'
import { createClient } from '@/lib/supabase/server'

export type Author = {
  id: string
  slug: string
  full_name: string
  bio: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export type ArticleCategory = {
  id: number
  slug: string
  name: string
  description: string | null
  is_active: boolean
}

export type ArticleTag = {
  id: number
  slug: string
  name: string
  is_active: boolean
}

export type Article = {
  id: string
  slug: string
  title: string
  author_id: string | null
  author?: Author | null
  categories?: ArticleCategory[]
  tags?: ArticleTag[]
  excerpt: string
  content: RichTextBlock[]
  cover_image_url: string | null
  reading_time_minutes: number
  status:
    | 'draft'
    | 'in_review'
    | 'changes_requested'
    | 'published'
    | 'unpublished'
    | 'archived'
  seo_title: string | null
  seo_description: string | null
  created_by: string | null
  updated_by: string | null
  published_by: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export type ArticleInput = {
  title: string
  slug?: string
  excerpt: string
  content: RichTextBlock[]
  author_id?: string | null
  cover_image_url?: string | null
  reading_time_minutes?: number
  seo_title?: string | null
  seo_description?: string | null
  status?: Article['status']
}

export function validateArticleInput(input: unknown): {
  data: ArticleInput | null
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  if (!input || typeof input !== 'object') {
    return { data: null, errors: { form: 'Invalid article input' } }
  }

  const raw = input as Record<string, unknown>
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const excerpt = typeof raw.excerpt === 'string' ? raw.excerpt.trim() : ''
  const slug =
    typeof raw.slug === 'string' ? raw.slug.trim().toLowerCase() : undefined

  if (!title) {
    errors.title = 'Title is required'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer'
  }

  if (slug !== undefined && slug !== '') {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      errors.slug =
        'Slug must contain only lowercase letters, numbers, and single hyphens'
    }
  }

  if (!excerpt) {
    errors.excerpt = 'Excerpt is required'
  } else if (excerpt.length > 500) {
    errors.excerpt = 'Excerpt must be 500 characters or fewer'
  }

  let content: RichTextBlock[] = []
  if (Array.isArray(raw.content)) {
    content = raw.content as RichTextBlock[]
  }

  return {
    data:
      Object.keys(errors).length === 0
        ? {
            title,
            slug,
            excerpt,
            content,
            author_id: typeof raw.author_id === 'string' ? raw.author_id : null,
            cover_image_url:
              typeof raw.cover_image_url === 'string'
                ? raw.cover_image_url
                : null,
            reading_time_minutes:
              typeof raw.reading_time_minutes === 'number' &&
              raw.reading_time_minutes > 0
                ? raw.reading_time_minutes
                : 3,
            seo_title:
              typeof raw.seo_title === 'string' ? raw.seo_title.trim() : null,
            seo_description:
              typeof raw.seo_description === 'string'
                ? raw.seo_description.trim()
                : null,
            status: (typeof raw.status === 'string'
              ? raw.status
              : 'draft') as Article['status'],
          }
        : null,
    errors,
  }
}

export async function getPublishedArticles(options?: {
  page?: number
  pageSize?: number
  categorySlug?: string
  tagSlug?: string
  client?: SupabaseClient
}): Promise<{
  articles: Article[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.max(1, Math.min(50, options?.pageSize ?? 6))
  const supabase = options?.client ?? (await createClient())

  let query = supabase
    .from('articles')
    .select(
      `
      *,
      author:authors(*),
      category_mappings:article_category_mappings(
        category:article_categories(*)
      ),
      tag_mappings:article_tag_mappings(
        tag:article_tags(*)
      )
    `,
      { count: 'exact' },
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('article_categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single()

    if (cat) {
      const { data: mappings } = await supabase
        .from('article_category_mappings')
        .select('article_id')
        .eq('category_id', cat.id)

      const articleIds = mappings?.map((m) => m.article_id) ?? []
      query = query.in(
        'id',
        articleIds.length > 0
          ? articleIds
          : ['00000000-0000-0000-0000-000000000000'],
      )
    }
  }

  if (options?.tagSlug) {
    const { data: tag } = await supabase
      .from('article_tags')
      .select('id')
      .eq('slug', options.tagSlug)
      .single()

    if (tag) {
      const { data: mappings } = await supabase
        .from('article_tag_mappings')
        .select('article_id')
        .eq('tag_id', tag.id)

      const articleIds = mappings?.map((m) => m.article_id) ?? []
      query = query.in(
        'id',
        articleIds.length > 0
          ? articleIds
          : ['00000000-0000-0000-0000-000000000000'],
      )
    }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query.range(from, to)

  if (error || !data) {
    return { articles: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const articles: Article[] = data.map((row: Record<string, unknown>) => {
    const categoryMappings =
      (row.category_mappings as Array<{ category: ArticleCategory }>) || []
    const tagMappings = (row.tag_mappings as Array<{ tag: ArticleTag }>) || []

    return {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      author_id: row.author_id as string | null,
      author: (row.author as Author) || null,
      categories: categoryMappings.map((cm) => cm.category).filter(Boolean),
      tags: tagMappings.map((tm) => tm.tag).filter(Boolean),
      excerpt: row.excerpt as string,
      content: (row.content as RichTextBlock[]) || [],
      cover_image_url: row.cover_image_url as string | null,
      reading_time_minutes: (row.reading_time_minutes as number) || 3,
      status: row.status as Article['status'],
      seo_title: row.seo_title as string | null,
      seo_description: row.seo_description as string | null,
      created_by: row.created_by as string | null,
      updated_by: row.updated_by as string | null,
      published_by: row.published_by as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      published_at: row.published_at as string | null,
    }
  })

  const total = count ?? articles.length
  return {
    articles,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getArticleBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<Article | null> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      author:authors(*),
      category_mappings:article_category_mappings(
        category:article_categories(*)
      ),
      tag_mappings:article_tag_mappings(
        tag:article_tags(*)
      )
    `,
    )
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  const categoryMappings =
    (data.category_mappings as Array<{ category: ArticleCategory }>) || []
  const tagMappings = (data.tag_mappings as Array<{ tag: ArticleTag }>) || []

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    author_id: data.author_id,
    author: data.author || null,
    categories: categoryMappings.map((cm) => cm.category).filter(Boolean),
    tags: tagMappings.map((tm) => tm.tag).filter(Boolean),
    excerpt: data.excerpt,
    content: (data.content as RichTextBlock[]) || [],
    cover_image_url: data.cover_image_url,
    reading_time_minutes: data.reading_time_minutes || 3,
    status: data.status,
    seo_title: data.seo_title,
    seo_description: data.seo_description,
    created_by: data.created_by,
    updated_by: data.updated_by,
    published_by: data.published_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    published_at: data.published_at,
  }
}

export async function getArticleCategories(
  client?: SupabaseClient,
): Promise<ArticleCategory[]> {
  const supabase = client ?? (await createClient())
  const { data } = await supabase
    .from('article_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return data || []
}

export async function getArticleTags(
  client?: SupabaseClient,
): Promise<ArticleTag[]> {
  const supabase = client ?? (await createClient())
  const { data } = await supabase
    .from('article_tags')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return data || []
}
