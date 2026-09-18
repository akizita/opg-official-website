export default function MissionAndVisionLoading() {
  return (
    <div
      className="container mission-page"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="skeleton-breadcrumbs" />
      <div className="skeleton-hero">
        <div className="skeleton-eyebrow" />
        <div className="skeleton-title" />
        <div className="skeleton-lead" />
      </div>
      <div className="skeleton-content">
        <div className="skeleton-heading" />
        <div className="skeleton-paragraph" />
        <div className="skeleton-paragraph" />
        <div className="skeleton-heading" />
        <div className="skeleton-paragraph" />
      </div>
    </div>
  )
}
