import Link from 'next/link'

type ReviewStatus = 'approved' | 'pending' | 'rejected'

const statuses: ReviewStatus[] = ['approved', 'pending', 'rejected']

const number = new Intl.NumberFormat('en-SG')

export function TestimonialAnalytics({
  counts,
  activeStatus,
}: {
  counts: Record<ReviewStatus, number> | null
  activeStatus: ReviewStatus | 'all'
}) {
  return (
    <section className="candidate-review-stats" aria-label="Testimonial totals">
      {statuses.map((status) => (
        <Link
          aria-current={activeStatus === status ? 'page' : undefined}
          className={`candidate-review-stats__card candidate-review-stats__card--${status}`}
          href={`/admin/testimonials?status=${status}`}
          key={status}
        >
          <span className="candidate-review-stats__label">{status}</span>
          <strong
            aria-label={counts ? undefined : `${status} count unavailable`}
            className="candidate-review-stats__count"
          >
            {counts ? number.format(counts[status]) : '—'}
          </strong>
        </Link>
      ))}
    </section>
  )
}
