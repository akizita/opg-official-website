import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TestimonialAnalytics } from './testimonial-analytics'

describe('TestimonialAnalytics', () => {
  it('includes chart point titles in server HTML for hydration', () => {
    const html = renderToString(
      createElement(TestimonialAnalytics, {
        summaries: [
          {
            period: 'month',
            submissions: 4,
            previous: 0,
            prospective: 3,
            past: 1,
            pending: 2,
            approved: 1,
            rejected: 1,
          },
        ],
        trends: [{ period: 'month', index: 0, label: '1', count: 4 }],
      }),
    )

    expect(html).toContain(
      '<title>1: 4 submissions (100% of this month)</title>',
    )
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>month<\/button>/)
    expect(html.match(/<article /g)).toHaveLength(2)
    expect(html).toContain('candidate-review-analytics__status-strip')
    expect(html).toContain('href="/admin/testimonials?status=pending"')
    expect(html).toContain('aria-label="2 this month">2</strong>')
    expect(html).toContain('href="/admin/testimonials?status=rejected"')
    expect(html).toContain('▲ 4 vs last month')
    expect(html).toContain('candidate-review-analytics__connection-legend')
    expect(html).toContain(
      'aria-label="3 prospective candidates (75%) and 1 past candidate (25%)"',
    )
  })
})
