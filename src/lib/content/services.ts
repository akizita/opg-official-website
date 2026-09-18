import type { RichTextBlock } from '@/components/ui/rich-text'
import type { DocumentStatus } from '@/lib/content/page-documents'
import { createClient } from '@/lib/supabase/server'

export type Service = {
  content: RichTextBlock[]
  created_at: string
  created_by: string | null
  cta_text: string | null
  cta_url: string | null
  display_order: number
  icon_url: string | null
  id: string
  published_at: string | null
  published_by: string | null
  seo_description: string | null
  seo_title: string | null
  slug: string
  status: DocumentStatus
  summary: string
  title: string
  updated_at: string
  updated_by: string | null
}

export type ServiceInput = {
  content: RichTextBlock[]
  cta_text?: string | null
  cta_url?: string | null
  display_order?: number
  icon_url?: string | null
  seo_description?: string | null
  seo_title?: string | null
  slug: string
  status?: DocumentStatus
  summary: string
  title: string
}

export type ServiceValidationResult =
  | { data: ServiceInput; success: true }
  | { errors: Record<string, string>; message: string; success: false }

export function validateServiceInput(raw: unknown): ServiceValidationResult {
  const errors: Record<string, string> = {}

  if (!raw || typeof raw !== 'object') {
    return {
      success: false,
      errors: { form: 'Invalid input data.' },
      message: 'Input data must be an object.',
    }
  }

  const input = raw as Record<string, unknown>

  // Title
  if (typeof input.title !== 'string' || input.title.trim() === '') {
    errors.title = 'Title is required.'
  } else if (input.title.trim().length > 150) {
    errors.title = 'Title cannot exceed 150 characters.'
  }

  // Slug
  if (typeof input.slug !== 'string' || input.slug.trim() === '') {
    errors.slug = 'Slug is required.'
  } else {
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!slugPattern.test(input.slug.trim())) {
      errors.slug = 'Slug must be lowercase alphanumeric with hyphens.'
    }
  }

  // Summary
  if (typeof input.summary !== 'string' || input.summary.trim() === '') {
    errors.summary = 'Summary is required.'
  } else if (input.summary.trim().length > 500) {
    errors.summary = 'Summary cannot exceed 500 characters.'
  }

  // Content
  let content: RichTextBlock[] = []
  if (input.content !== undefined && input.content !== null) {
    if (!Array.isArray(input.content)) {
      errors.content = 'Content must be an array of blocks.'
    } else {
      content = input.content as RichTextBlock[]
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
      message: Object.values(errors)[0],
    }
  }

  return {
    success: true,
    data: {
      title: (input.title as string).trim(),
      slug: (input.slug as string).trim(),
      summary: (input.summary as string).trim(),
      content,
      icon_url:
        typeof input.icon_url === 'string' && input.icon_url.trim()
          ? input.icon_url.trim()
          : null,
      cta_text:
        typeof input.cta_text === 'string' && input.cta_text.trim()
          ? input.cta_text.trim()
          : null,
      cta_url:
        typeof input.cta_url === 'string' && input.cta_url.trim()
          ? input.cta_url.trim()
          : null,
      display_order:
        typeof input.display_order === 'number'
          ? input.display_order
          : parseInt(String(input.display_order || '0'), 10) || 0,
      seo_title:
        typeof input.seo_title === 'string' && input.seo_title.trim()
          ? input.seo_title.trim()
          : null,
      seo_description:
        typeof input.seo_description === 'string' && input.seo_description.trim()
          ? input.seo_description.trim()
          : null,
      status: (input.status as DocumentStatus) || 'draft',
    },
  }
}

type QueryClient = Awaited<ReturnType<typeof createClient>>

export async function getPublishedServices(
  client?: QueryClient
): Promise<Service[]> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as Service[]
}

export async function getServiceBySlug(
  slug: string,
  client?: QueryClient
): Promise<Service | null> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as Service
}

