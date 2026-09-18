import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  searchPublishedDocuments,
  type SearchEntityType,
} from '@/lib/content/search'
import { siteConfig } from '@/lib/site-config'

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export function generateMetadata(): Metadata {
  return {
    title: `Search Results | ${siteConfig.shortName}`,
    description: `Search all published services, articles, open roles, and resources on ${siteConfig.name}.`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

function getEntityBadgeLabel(type: SearchEntityType): string {
  switch (type) {
    case 'service':
      return 'Service'
    case 'article':
      return 'Article'
    case 'job_opening':
      return 'Career Opening'
    case 'faq':
      return 'FAQ'
    case 'page_document':
      return 'Page'
    default:
      return 'Content'
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = (params.q || '').trim()

  const { results, total, sanitizedQuery } = query
    ? await searchPublishedDocuments(query, { limit: 20 })
    : { results: [], total: 0, sanitizedQuery: '' }

  return (
    <main id="main-content" className="search-page container">
      <header className="search-hero">
        <h1 className="search-hero__title">Search Site Content</h1>
        <p className="search-hero__lead">
          Find services, insights, open career positions, and answers across
          Outsourced Pro Global.
        </p>

        <form
          method="GET"
          action="/search"
          className="search-form"
          role="search"
        >
          <label htmlFor="search-input" className="sr-only">
            Search keywords
          </label>
          <input
            id="search-input"
            type="search"
            name="q"
            defaultValue={query}
            maxLength={100}
            placeholder="e.g. engineering, dedicated teams, remote, compliance..."
            className="search-input"
            required
          />
          <button type="submit" className="button search-submit-btn">
            Search
          </button>
        </form>
      </header>

      <section className="search-results-section" aria-label="Search results">
        {query && (
          <p className="search-query-summary">
            {total === 0 ? (
              <>
                No results found for &ldquo;<strong>{sanitizedQuery}</strong>
                &rdquo;
              </>
            ) : (
              <>
                Showing <strong>{total}</strong>{' '}
                {total === 1 ? 'result' : 'results'} for &ldquo;
                <strong>{sanitizedQuery}</strong>&rdquo;
              </>
            )}
          </p>
        )}

        {!query ? (
          <div style={{ marginTop: '2rem' }}>
            <Card className="spotlight-card">
              <div>
                <h2>Looking for something specific?</h2>
                <p>
                  Try searching for specialized delivery models like{' '}
                  <em>Dedicated Teams</em>, exploring open jobs in{' '}
                  <em>Engineering</em>, or reading insights on{' '}
                  <em>Compliance</em>.
                </p>
              </div>
            </Card>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="No matching content found"
            message="Try searching with different keywords or check our directory pages below."
          />
        ) : (
          <div className="search-results-list">
            {results.map((item) => (
              <Card key={item.id} className="search-result-card">
                <div className="search-result-card__header">
                  <span
                    className={`search-badge search-badge--${item.entity_type}`}
                  >
                    {getEntityBadgeLabel(item.entity_type)}
                  </span>
                  <span className="search-result-card__url">
                    {item.url_path}
                  </span>
                </div>

                <h2 className="search-result-card__title">
                  <Link href={item.url_path}>{item.title}</Link>
                </h2>

                {item.excerpt && (
                  <p className="search-result-card__excerpt">{item.excerpt}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
