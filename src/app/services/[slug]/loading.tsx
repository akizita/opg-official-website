export default function ServiceDetailLoading() {
  return (
    <div
      className="container service-detail-page"
      aria-busy="true"
      aria-label="Loading Service"
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
    </div>
  )
}
