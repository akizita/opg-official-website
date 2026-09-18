import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Manage Articles | OPG Admin',
}

type ArticleRow = {
  id: string
  slug: string
  title: string
  summary: string
  status: 'draft' | 'review' | 'published' | 'archived'
  published_at: string | null
  reading_time_minutes: number
  author?: { display_name: string } | null
  category?: { name: string } | null
}

export default async function AdminArticlesPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have permission to view articles.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      id,
      slug,
      title,
      summary,
      status,
      published_at,
      reading_time_minutes,
      author:authors(display_name),
      category:article_categories(name)
    `)
    .order('published_at', { ascending: false, nullsFirst: false })

  const articleList = (articles as unknown as ArticleRow[]) || []

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Articles</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Publishing & Editorial</p>
            <h1>Articles & Insights</h1>
            <p>
              Manage thought leadership publications, editorial reviews, and article taxonomy.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        <div className="admin-services-list" style={{ marginTop: '2rem' }}>
          {articleList.length > 0 ? (
            <div className="card-grid">
              {articleList.map((art) => (
                <Card
                  eyebrow={`${art.category?.name || 'Uncategorized'} · ${art.reading_time_minutes} min read`}
                  key={art.id}
                  title={art.title}
                >
                  <p>{art.summary}</p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <StatusBadge status={art.status === 'review' ? 'in_review' : art.status} />
                      {art.author && (
                        <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-subtle)' }}>
                          By {art.author.display_name}
                        </span>
                      )}
                    </div>
                    {art.status === 'published' && (
                      <Link
                        className="button-link button-link--secondary"
                        href={`/articles/${art.slug}`}
                        target="_blank"
                      >
                        View Live ↗
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              description="No articles have been created yet."
              title="No Articles Found"
            />
          )}
        </div>
      </div>
    </section>
  )
}
