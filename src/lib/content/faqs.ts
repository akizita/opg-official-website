import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

export type FaqCategory = {
  id: number
  name: string
  slug: string
  display_order: number
  is_active: boolean
  created_at: string
}

export type Faq = {
  id: string
  faq_category_id: number
  question: string
  answer: string
  display_order: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

export type FaqCategoryWithFaqs = FaqCategory & {
  faqs: Faq[]
}

export type FaqInput = {
  faq_category_id: number
  question: string
  answer: string
  display_order?: number
  status?: Faq['status']
}

export function validateFaqInput(input: unknown): {
  data: FaqInput | null
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  if (!input || typeof input !== 'object') {
    return { data: null, errors: { form: 'Invalid FAQ input' } }
  }

  const raw = input as Record<string, unknown>
  const question = typeof raw.question === 'string' ? raw.question.trim() : ''
  const answer = typeof raw.answer === 'string' ? raw.answer.trim() : ''
  const categoryId =
    typeof raw.faq_category_id === 'number'
      ? raw.faq_category_id
      : Number(raw.faq_category_id)

  if (!question) {
    errors.question = 'Question is required'
  } else if (question.length > 300) {
    errors.question = 'Question must be 300 characters or fewer'
  }

  if (!answer) {
    errors.answer = 'Answer is required'
  } else if (answer.length > 3000) {
    errors.answer = 'Answer must be 3,000 characters or fewer'
  }

  if (isNaN(categoryId) || categoryId <= 0) {
    errors.faq_category_id = 'A valid FAQ category is required'
  }

  return {
    data:
      Object.keys(errors).length === 0
        ? {
            faq_category_id: categoryId,
            question,
            answer,
            display_order:
              typeof raw.display_order === 'number' ? raw.display_order : 0,
            status: (typeof raw.status === 'string'
              ? raw.status
              : 'draft') as Faq['status'],
          }
        : null,
    errors,
  }
}

export async function getPublishedFaqsByCategory(
  client?: SupabaseClient,
): Promise<FaqCategoryWithFaqs[]> {
  const supabase = client ?? (await createClient())

  const { data: categories, error: catError } = await supabase
    .from('faq_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (catError || !categories) return []

  const { data: faqs, error: faqsError } = await supabase
    .from('faqs')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true })

  if (faqsError || !faqs) return categories.map((cat) => ({ ...cat, faqs: [] }))

  return categories.map((cat) => ({
    ...cat,
    faqs: faqs.filter((faq) => faq.faq_category_id === cat.id),
  }))
}
