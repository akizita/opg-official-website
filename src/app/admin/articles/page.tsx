import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { getAdminArticles } from '@/lib/content/articles'

import { ArticlesManager } from './articles-manager'

export const metadata: Metadata = {
  title: 'Articles & Insights | OPG Admin',
}

export default async function AdminArticlesPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have
            permission to view articles.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const articles = await getAdminArticles()

  return <ArticlesManager articles={articles} roleKey={profile.roleKey} />
}
