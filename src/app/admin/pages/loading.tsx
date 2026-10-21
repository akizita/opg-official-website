export default function AdminPagesLoading() {
  return (
    <section
      aria-label="Loading page editor"
      className="admin-page pages-workspace"
    >
      <div className="container pages-workspace-skeleton">
        <span className="pages-skeleton pages-skeleton--crumb" />
        <span className="pages-skeleton pages-skeleton--title" />
        <span className="pages-skeleton pages-skeleton--subtitle" />
        <span className="pages-skeleton pages-skeleton--tabs" />
        <div className="pages-workspace-skeleton__layout">
          <div>
            <span className="pages-skeleton pages-skeleton--panel" />
            <span className="pages-skeleton pages-skeleton--panel" />
          </div>
          <div>
            <span className="pages-skeleton pages-skeleton--rail" />
            <span className="pages-skeleton pages-skeleton--rail" />
          </div>
        </div>
      </div>
    </section>
  )
}
