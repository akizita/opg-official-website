import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canEditDraft } from '@/lib/auth/permissions'
import { getArticleCategories, getAuthors } from '@/lib/content/articles'

import { ArticleEditorForm } from '../article-editor-form'

export const metadata: Metadata = {
  title: 'Create Article | OPG Admin',
}

export default async function NewArticlePage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role does not have permission to create articles.
          </p>
          <Link className="button button--secondary" href="/admin/articles">
            ← Back to Articles
          </Link>
        </div>
      </section>
    )
  }

  const [authors, categories] = await Promise.all([
    getAuthors(),
    getArticleCategories(),
  ])

  return (
    <ArticleEditorForm
      authors={authors}
      categories={categories}
      roleKey={profile.roleKey}
    />
  )
}
