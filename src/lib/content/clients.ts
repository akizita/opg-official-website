import { createClient } from '@/lib/supabase/server'

export type Client = {
  created_at: string
  display_order: number
  display_permission: boolean
  id: string
  is_visible: boolean
  logo_url: string
  name: string
  updated_at: string
  website_url: string | null
}

export type Testimonial = {
  author_company: string | null
  author_name: string
  author_role: string
  consent_reference: string | null
  created_at: string
  display_order: number
  id: string
  quote: string
  status: 'draft' | 'in_review' | 'published' | 'archived'
  updated_at: string
}

export type ClientInput = {
  display_order?: number
  display_permission?: boolean
  is_visible?: boolean
  logo_url: string
  name: string
  website_url?: string | null
}

export type TestimonialInput = {
  author_company?: string | null
  author_name: string
  author_role: string
  consent_reference?: string | null
  display_order?: number
  quote: string
  status?: 'draft' | 'in_review' | 'published' | 'archived'
}

export function validateClientInput(raw: unknown): {
  data?: ClientInput
  errors?: Record<string, string>
  message?: string
  success: boolean
} {
  const errors: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') {
    return { success: false, message: 'Invalid data format.' }
  }

  const input = raw as Record<string, unknown>
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    errors.name = 'Client name is required.'
  }

  if (typeof input.logo_url !== 'string' || input.logo_url.trim() === '') {
    errors.logo_url = 'Logo URL is required.'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, message: Object.values(errors)[0] }
  }

  return {
    success: true,
    data: {
      name: (input.name as string).trim(),
      logo_url: (input.logo_url as string).trim(),
      website_url:
        typeof input.website_url === 'string' && input.website_url.trim()
          ? input.website_url.trim()
          : null,
      display_order:
        typeof input.display_order === 'number'
          ? input.display_order
          : parseInt(String(input.display_order || '0'), 10) || 0,
      display_permission: input.display_permission !== false,
      is_visible: input.is_visible !== false,
    },
  }
}

export function validateTestimonialInput(raw: unknown): {
  data?: TestimonialInput
  errors?: Record<string, string>
  message?: string
  success: boolean
} {
  const errors: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') {
    return { success: false, message: 'Invalid data format.' }
  }

  const input = raw as Record<string, unknown>
  if (typeof input.quote !== 'string' || input.quote.trim() === '') {
    errors.quote = 'Quote is required.'
  }

  if (
    typeof input.author_name !== 'string' ||
    input.author_name.trim() === ''
  ) {
    errors.author_name = 'Author name is required.'
  }

  if (
    typeof input.author_role !== 'string' ||
    input.author_role.trim() === ''
  ) {
    errors.author_role = 'Author role is required.'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, message: Object.values(errors)[0] }
  }

  return {
    success: true,
    data: {
      quote: (input.quote as string).trim(),
      author_name: (input.author_name as string).trim(),
      author_role: (input.author_role as string).trim(),
      author_company:
        typeof input.author_company === 'string' && input.author_company.trim()
          ? input.author_company.trim()
          : null,
      consent_reference:
        typeof input.consent_reference === 'string' &&
        input.consent_reference.trim()
          ? input.consent_reference.trim()
          : null,
      display_order:
        typeof input.display_order === 'number'
          ? input.display_order
          : parseInt(String(input.display_order || '0'), 10) || 0,
      status:
        (input.status as 'draft' | 'in_review' | 'published' | 'archived') ||
        'draft',
    },
  }
}

export async function getVisibleClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as Client[]
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as Testimonial[]
}
