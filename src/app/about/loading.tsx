export default function AboutLoading() {
  return (
    <div
      className="container about-page"
      aria-busy="true"
      aria-label="Loading About page"
    >
      <div className="skeleton-breadcrumbs" />
      <div className="skeleton-hero">
        <div className="skeleton-eyebrow" />
        <div className="skeleton-title" />
        <div className="skeleton-lead" />
      </div>
      <div className="skeleton-content">
        <div className="skeleton-paragraph" />
        <div className="skeleton-paragraph" />
      </div>
      <div className="card-grid" style={{ marginTop: '3rem' }}>
        <div className="skeleton-paragraph" style={{ height: '12rem' }} />
        <div className="skeleton-paragraph" style={{ height: '12rem' }} />
      </div>
    </div>
  )
}
