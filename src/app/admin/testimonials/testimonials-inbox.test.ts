import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import {
  TestimonialsInbox,
  type CandidateSubmission,
} from './testimonials-inbox'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}))

const submission: CandidateSubmission = {
  id: 'sample-id',
  author_name: 'Jordan Lee',
  email: 'jordan@example.com',
  relationship: 'past',
  role_title: 'Designer',
  rating: 5,
  quote: 'The team helped me find a role that fits my work.',
  publication_consent: true,
  status: 'pending',
  submitted_at: '2026-10-27T03:00:00Z',
  submitted_at_list_label: '27 Oct 2026',
  submitted_at_label: '27 Oct 2026, 11:00 am',
  reviewed_at: null,
  reviewed_at_label: 'Not reviewed',
  profile_photo_url: null,
}

describe('TestimonialsInbox', () => {
  it('renders a labelled, sortable table with row actions and a descriptive avatar', () => {
    const html = renderToString(
      createElement(TestimonialsInbox, {
        submissions: [submission],
        canReview: true,
        canDelete: true,
        filters: [
          {
            value: 'pending',
            label: 'Pending',
            count: 1,
            href: '/admin/testimonials?status=pending',
          },
        ],
        status: 'pending',
      }),
    )

    expect(html).toContain('<table>')
    expect(html).toContain(
      '<caption class="sr-only">Candidate testimonial submissions on the loaded page</caption>',
    )
    expect(html).toContain('scope="col"')
    expect(html).toContain('aria-sort="descending"')
    expect(html).toContain('scope="row"')
    expect(html).toContain('Select testimonial from Jordan Lee')
    expect(html).toContain('>JL</span>')
    expect(html).toContain('Role / Company')
    expect(html).toContain('Row actions for Jordan Lee')
    expect(html).toContain('aria-label="Open testimonial from Jordan Lee"')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('<thead class="sr-only">')
    expect(html).not.toContain('>View</button>')
    expect(html).not.toContain('type="checkbox"')
    expect(html).not.toContain('candidate-review-inbox__bulk-toolbar')
    expect(html).toContain('27 Oct 2026, 11:00 am SGT')
  })
})
