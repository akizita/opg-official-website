import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

import {
  getPublishedFaqsByCategory,
  validateFaqInput,
} from '@/lib/content/faqs'
import { createClient } from '@/lib/supabase/server'

describe('faqs schema & validation', () => {
  it('validates a correct faq input', () => {
    const valid = {
      faq_category_id: 1,
      question: 'How does OPG ensure talent quality?',
      answer: 'We rigorously vet talent across technical and communication competencies.',
      display_order: 1,
      status: 'published',
    }

    const { data, errors } = validateFaqInput(valid)
    expect(errors).toEqual({})
    expect(data).not.toBeNull()
    expect(data?.question).toBe(valid.question)
  })

  it('rejects empty question and answer', () => {
    const invalid = {
      faq_category_id: 0,
      question: '',
      answer: '',
    }

    const { data, errors } = validateFaqInput(invalid)
    expect(data).toBeNull()
    expect(errors.question).toBe('Question is required')
    expect(errors.answer).toBe('Answer is required')
    expect(errors.faq_category_id).toBe('A valid FAQ category is required')
  })
})

describe('faqs data queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches published faqs grouped by category', async () => {
    const mockCategories = [
      { id: 1, name: 'Hiring', slug: 'hiring', display_order: 1, is_active: true, created_at: '' },
    ]
    const mockFaqs = [
      {
        id: 'faq-1',
        faq_category_id: 1,
        question: 'How fast to onboard?',
        answer: '2-3 weeks.',
        display_order: 1,
        status: 'published',
        created_at: '',
        updated_at: '',
      },
    ]

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'faq_categories' ? mockCategories : mockFaqs,
              error: null,
            }),
          }),
        }),
      })),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const categoriesWithFaqs = await getPublishedFaqsByCategory()
    expect(categoriesWithFaqs).toHaveLength(1)
    expect(categoriesWithFaqs[0].faqs).toHaveLength(1)
    expect(categoriesWithFaqs[0].faqs[0].question).toBe('How fast to onboard?')
  })
})

