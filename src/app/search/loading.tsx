export default function SearchLoading() {
  return (
    <main id="main-content" className="search-page container" aria-busy="true">
      <div className="skeleton-line skeleton-title" style={{ maxWidth: '20rem', height: '3.5rem' }} />
      <div className="skeleton-line" style={{ height: '3rem', maxWidth: '40rem', marginBlock: '2rem' }} />

      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card skeleton-card" style={{ height: '6rem' }} />
        ))}
      </div>
    </main>
  )
}

