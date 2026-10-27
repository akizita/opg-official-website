import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TestimonialAnalytics } from './testimonial-analytics'

describe('TestimonialAnalytics', () => {
  it('shows the exact status totals and links to the matching filters', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialAnalytics, {
        activeStatus: 'pending',
        counts: { approved: 1250, pending: 3, rejected: 8 },
      }),
    )

    expect(html.match(/class="candidate-review-stats__card /g)).toHaveLength(3)
    expect(html).toContain('href="/admin/testimonials?status=approved"')
    expect(html).toContain('href="/admin/testimonials?status=pending"')
    expect(html).toContain('href="/admin/testimonials?status=rejected"')
    expect(html).toContain('1,250')
    expect(html).toMatch(/aria-current="page"[^>]*>\s*<span[^>]*>pending/)
    expect(html).not.toContain('<svg')
  })

  it('does not show zero when the status counts are unavailable', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialAnalytics, {
        activeStatus: 'all',
        counts: null,
      }),
    )

    expect(html).toContain('approved count unavailable')
    expect(html).not.toContain('>0</strong>')
  })
})
