export default function ArticlesLoading() {
  return (
    <main
      id="main-content"
      className="articles-page container"
      aria-busy="true"
    >
      <div
        className="skeleton-line skeleton-title"
        style={{ maxWidth: '24rem', height: '3.5rem' }}
      />
      <div
        className="skeleton-line skeleton-subtitle"
        style={{ maxWidth: '36rem', marginTop: '1rem' }}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBlock: '2rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton-line"
            style={{ width: '6rem', height: '2rem', borderRadius: '1rem' }}
          />
        ))}
      </div>

      <div className="articles-grid" style={{ marginTop: '2rem' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card skeleton-card">
            <div
              className="skeleton-line"
              style={{ height: '12rem', width: '100%', marginBottom: '1rem' }}
            />
            <div
              className="skeleton-line"
              style={{
                width: '40%',
                height: '1.25rem',
                marginBottom: '0.5rem',
              }}
            />
            <div
              className="skeleton-line"
              style={{
                width: '85%',
                height: '1.75rem',
                marginBottom: '0.75rem',
              }}
            />
            <div className="skeleton-paragraph" />
          </div>
        ))}
      </div>
    </main>
  )
}
