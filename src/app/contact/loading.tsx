export default function ContactLoading() {
  return (
    <main className="contact-page">
      <div className="container">
        <div className="skeleton-line" style={{ width: '120px', height: '1.25rem', marginBottom: '1.5rem' }} />
        <header className="contact-hero">
          <div className="skeleton-line" style={{ width: '160px', height: '1rem', marginBottom: '0.75rem' }} />
          <div className="skeleton-line" style={{ width: '60%', height: '2.5rem', marginBottom: '1rem' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '1.25rem' }} />
        </header>
        <div className="contact-layout-grid" style={{ marginTop: '2.5rem' }}>
          <div className="contact-info-column">
            <div className="skeleton-card" style={{ height: '260px', marginBottom: '1.5rem' }} />
            <div className="skeleton-card" style={{ height: '220px' }} />
          </div>
          <div className="contact-form-column">
            <div className="skeleton-card" style={{ height: '520px' }} />
          </div>
        </div>
      </div>
    </main>
  )
}

