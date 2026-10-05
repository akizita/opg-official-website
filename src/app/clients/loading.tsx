export default function ClientsLoading() {
  return (
    <div className="clients-page clients-loading" aria-busy="true">
      <span className="sr-only" role="status">
        Loading client partnerships
      </span>

      <section className="clients-loading__hero" aria-hidden="true">
        <div className="container clients-loading__hero-copy">
          <div className="clients-loading__block clients-loading__eyebrow" />
          <div className="clients-loading__block clients-loading__title" />
          <div className="clients-loading__block clients-loading__lead" />
          <div className="clients-loading__actions">
            <div className="clients-loading__block clients-loading__button" />
            <div className="clients-loading__block clients-loading__button" />
          </div>
        </div>
        <div className="container clients-loading__partner-strip">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              className="clients-loading__block clients-loading__partner"
              key={index}
            />
          ))}
        </div>
      </section>

      <section
        className="container clients-loading__editorial"
        aria-hidden="true"
      >
        <div className="clients-loading__block clients-loading__meta" />
        <div className="clients-loading__block clients-loading__heading" />
        <div className="clients-loading__block clients-loading__intro" />
        <div className="clients-loading__block clients-loading__media" />
        <div className="clients-loading__article-grid">
          <div className="clients-loading__block clients-loading__aside" />
          <div className="clients-loading__copy-lines">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                className="clients-loading__block clients-loading__line"
                key={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="clients-loading__testimonials" aria-hidden="true">
        <div className="container clients-loading__centered-heading">
          <div className="clients-loading__block clients-loading__eyebrow" />
          <div className="clients-loading__block clients-loading__heading" />
          <div className="clients-loading__block clients-loading__intro" />
        </div>
        <div className="clients-loading__block clients-loading__testimonial-card" />
      </section>

      <section
        className="container clients-loading__directory"
        aria-hidden="true"
      >
        <div className="clients-loading__block clients-loading__heading" />
        <div className="clients-loading__profile-layout">
          <div className="clients-loading__block clients-loading__profile-index" />
          <div className="clients-loading__profile-panels">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                className="clients-loading__block clients-loading__profile-panel"
                key={index}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
