export default function Loading() {
  return (
    <section
      className="admin-page candidate-review-page"
      aria-label="Loading testimonial management"
      role="status"
    >
      <div className="container">
        <div className="candidate-review-skeleton__heading" aria-hidden="true">
          <span className="candidate-review-skeleton__line" />
          <span className="candidate-review-skeleton__line candidate-review-skeleton__line--wide" />
        </div>
        <div className="candidate-review-analytics" aria-hidden="true">
          <div className="candidate-review-analytics__card candidate-review-skeleton__card">
            <span className="candidate-review-skeleton__line" />
            <span className="candidate-review-skeleton__chart" />
          </div>
          <div className="candidate-review-analytics__card candidate-review-skeleton__card">
            <span className="candidate-review-skeleton__line" />
            <span className="candidate-review-skeleton__ring" />
          </div>
        </div>
        <div
          className="candidate-review-table-card candidate-review-skeleton__table"
          aria-hidden="true"
        >
          <span className="candidate-review-skeleton__line" />
          {Array.from({ length: 5 }, (_, index) => (
            <span className="candidate-review-skeleton__row" key={index} />
          ))}
        </div>
        <span className="sr-only">Loading testimonials…</span>
      </div>
    </section>
  )
}
