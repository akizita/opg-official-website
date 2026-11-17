import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canEditDraft } from '@/lib/auth/permissions'
import {
  getAdminArticleByIdOrSlug,
  getArticleCategories,
  getAuthors,
} from '@/lib/content/articles'

import { ArticleEditorForm } from '../../article-editor-form'

export const metadata: Metadata = {
  title: 'Edit Article | OPG Admin',
}

type EditArticlePageProps = {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role does not have permission to edit articles.
          </p>
          <Link className="button button--secondary" href="/admin/articles">
            ← Back to Articles
          </Link>
        </div>
      </section>
    )
  }

  const [article, authors, categories] = await Promise.all([
    getAdminArticleByIdOrSlug(id),
    getAuthors(),
    getArticleCategories(),
  ])

  if (!article) {
    notFound()
  }

  return (
    <ArticleEditorForm
      article={article}
      authors={authors}
      categories={categories}
      roleKey={profile.roleKey}
    />
  )
}
