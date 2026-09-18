export default function CareersLoading() {
  return (
    <main id="main-content" className="careers-page container" aria-busy="true">
      <div
        className="skeleton-line skeleton-title"
        style={{ maxWidth: '28rem', height: '3.5rem' }}
      />
      <div
        className="skeleton-line skeleton-subtitle"
        style={{ maxWidth: '38rem', marginTop: '1rem' }}
      />

      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '3rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card skeleton-card"
            style={{ height: '8rem' }}
          />
        ))}
      </div>
    </main>
  )
}
