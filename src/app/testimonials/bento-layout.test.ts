import { describe, expect, it } from 'vitest'

import { distributeTestimonialsBento } from '@/app/testimonials/bento-layout'
import type { CandidateTestimonial } from '@/lib/content/candidate-testimonials'

function makeItem(id: string, quoteLength: number): CandidateTestimonial {
  return {
    author_name: `Candidate ${id}`,
    id,
    published_at: '2026-11-25T00:00:00.000Z',
    quote: 'x'.repeat(quoteLength),
    rating: 5,
    relationship: 'past',
    role_title: 'Analyst',
  }
}

describe('distributeTestimonialsBento', () => {
  it('balances short cards alongside tall cards so columns stay compact without gaps', () => {
    const items = [
      makeItem('tall-1', 720),
      makeItem('short-2', 65),
      makeItem('short-3', 75),
      makeItem('short-4', 80),
      makeItem('short-5', 70),
      makeItem('med-6', 240),
    ]

    const columns = distributeTestimonialsBento(items, 3)

    expect(columns).toHaveLength(3)
    // Tall card stays in col 0 while shorter cards stack together in cols 1 & 2
    expect(columns[0]?.map((entry) => entry.item.id)).toEqual(['tall-1'])
    expect(columns[1]?.length).toBeGreaterThanOrEqual(2)
    expect(columns[2]?.length).toBeGreaterThanOrEqual(2)
    expect(columns[0]?.[0]?.isFeatured).toBe(true)
  })

  it('caps active columns at item count and collapses cleanly to 1 column', () => {
    const twoItems = [makeItem('1', 120), makeItem('2', 140)]
    expect(distributeTestimonialsBento(twoItems, 3)).toHaveLength(2)

    const singleCol = distributeTestimonialsBento(twoItems, 1)
    expect(singleCol).toHaveLength(1)
    expect(singleCol[0]?.map((entry) => entry.item.id)).toEqual(['1', '2'])
  })
})
