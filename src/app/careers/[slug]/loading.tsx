export default function JobDetailLoading() {
  return (
    <main id="main-content" className="job-detail-page container" aria-busy="true">
      <div className="skeleton-line" style={{ width: '12rem', height: '1.25rem', marginBottom: '2rem' }} />
      <div className="skeleton-line skeleton-title" style={{ maxWidth: '38rem', height: '3.5rem', marginBottom: '1rem' }} />
      <div className="skeleton-line skeleton-subtitle" style={{ maxWidth: '24rem', marginBottom: '2rem' }} />

      <div style={{ maxWidth: '48rem', display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="skeleton-paragraph" />
        <div className="skeleton-paragraph" />
      </div>
    </main>
  )
}

