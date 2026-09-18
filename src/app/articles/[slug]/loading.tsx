export default function ArticleDetailLoading() {
  return (
    <main id="main-content" className="article-detail-page container" aria-busy="true">
      <div className="skeleton-line" style={{ width: '12rem', height: '1.25rem', marginBottom: '2rem' }} />
      <div className="skeleton-line skeleton-title" style={{ maxWidth: '44rem', height: '3.5rem', marginBottom: '1rem' }} />
      <div className="skeleton-line skeleton-subtitle" style={{ maxWidth: '20rem', marginBottom: '2rem' }} />

      <div style={{ maxWidth: '48rem', display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="skeleton-paragraph" />
        <div className="skeleton-paragraph" />
        <div className="skeleton-paragraph" />
      </div>
    </main>
  )
}

