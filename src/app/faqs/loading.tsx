export default function FaqsLoading() {
  return (
    <main id="main-content" className="faqs-page container" aria-busy="true">
      <div className="skeleton-line skeleton-title" style={{ maxWidth: '24rem', height: '3.5rem' }} />
      <div className="skeleton-line skeleton-subtitle" style={{ maxWidth: '36rem', marginTop: '1rem' }} />

      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '3rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card skeleton-card" style={{ height: '5rem' }} />
        ))}
      </div>
    </main>
  )
}

