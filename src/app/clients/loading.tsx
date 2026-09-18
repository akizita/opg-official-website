export default function ClientsLoading() {
  return (
    <div
      className="container clients-page"
      aria-busy="true"
      aria-label="Loading Clients"
    >
      <div className="skeleton-breadcrumbs" />
      <div className="skeleton-hero">
        <div className="skeleton-eyebrow" />
        <div className="skeleton-title" />
        <div className="skeleton-lead" />
      </div>
      <div className="clients-grid">
        <div className="skeleton-paragraph" style={{ height: '8rem' }} />
        <div className="skeleton-paragraph" style={{ height: '8rem' }} />
        <div className="skeleton-paragraph" style={{ height: '8rem' }} />
        <div className="skeleton-paragraph" style={{ height: '8rem' }} />
      </div>
    </div>
  )
}
