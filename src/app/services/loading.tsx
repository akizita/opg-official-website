export default function ServicesLoading() {
  return (
    <div className="container services-page" aria-busy="true" aria-label="Loading Services">
      <div className="skeleton-breadcrumbs" />
      <div className="skeleton-hero">
        <div className="skeleton-eyebrow" />
        <div className="skeleton-title" />
        <div className="skeleton-lead" />
      </div>
      <div className="card-grid">
        <div className="skeleton-paragraph" style={{ height: '14rem' }} />
        <div className="skeleton-paragraph" style={{ height: '14rem' }} />
        <div className="skeleton-paragraph" style={{ height: '14rem' }} />
      </div>
    </div>
  )
}

