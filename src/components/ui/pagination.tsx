import Link from 'next/link'

type PaginationProps = {
  className?: string
  currentPage: number
  getPageUrl?: (page: number) => string
  basePath?: string
  totalPages: number
  totalResults?: number
  pageSize?: number
}

export function Pagination({
  className = '',
  currentPage,
  getPageUrl,
  basePath,
  totalPages,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const resolveUrl =
    getPageUrl ??
    ((page: number) => {
      const base = basePath || ''
      const separator = base.includes('?') ? '&' : '?'
      return `${base}${separator}page=${page}`
    })

  // Calculate pages to show: current, up to 2 before, up to 2 after, first, last
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      (p >= currentPage - 2 && p <= currentPage + 2),
  )

  const pagesWithGaps: (number | 'ellipsis')[] = []
  pages.forEach((p, idx) => {
    if (idx > 0 && p - pages[idx - 1] > 1) {
      pagesWithGaps.push('ellipsis')
    }
    pagesWithGaps.push(p)
  })

  return (
    <nav aria-label="Pagination" className={`pagination ${className}`.trim()}>
      <ul className="pagination__list">
        {currentPage > 1 ? (
          <li>
            <Link
              aria-label="Go to previous page"
              className="pagination__link pagination__link--prev"
              href={resolveUrl(currentPage - 1)}
            >
              ← Previous
            </Link>
          </li>
        ) : null}

        {pagesWithGaps.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <li
                key={`gap-${index}`}
                aria-hidden="true"
                className="pagination__gap"
              >
                …
              </li>
            )
          }

          const isCurrent = item === currentPage
          return (
            <li key={item}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className={`pagination__link ${isCurrent ? 'pagination__link--current' : ''}`}
                href={resolveUrl(item)}
              >
                {item}
              </Link>
            </li>
          )
        })}

        {currentPage < totalPages ? (
          <li>
            <Link
              aria-label="Go to next page"
              className="pagination__link pagination__link--next"
              href={resolveUrl(currentPage + 1)}
            >
              Next →
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
