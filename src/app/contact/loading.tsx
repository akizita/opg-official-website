export default function ContactLoading() {
  return (
    <main className="contact-page">
      <div className="container">
        <div className="contact-layout-grid">
          <div className="contact-info-column">
            <header aria-label="Loading contact page" className="contact-hero">
              <div
                className="skeleton-line"
                style={{
                  width: 'min(90%, 22rem)',
                  height: '3.2rem',
                  marginBottom: '1rem',
                }}
              />
              <div
                className="skeleton-line"
                style={{ width: 'min(95%, 27rem)', height: '4rem' }}
              />
            </header>
            <div className="contact-details">
              <div
                className="skeleton-line"
                style={{
                  width: 'min(90%, 22rem)',
                  height: '2.5rem',
                  marginBottom: '1.5rem',
                }}
              />
              <div
                className="skeleton-line"
                style={{ width: 'min(75%, 18rem)', height: '19rem' }}
              />
            </div>
          </div>
          <div className="contact-form-column">
            <div className="skeleton-card" style={{ height: '35rem' }} />
          </div>
        </div>
      </div>
    </main>
  )
}
