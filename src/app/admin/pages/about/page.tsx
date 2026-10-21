import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AboutForm } from '@/app/admin/pages/about/about-form'
import {
  canEditDraft,
  canPublish,
  canRequestChanges,
  canSubmitReview,
} from '@/lib/auth/permissions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import type { PageDocument } from '@/lib/content/page-documents'
import { ABOUT_COPY_SECTIONS, getPageCopy } from '@/lib/content/page-copy'
import { ABOUT_PAGE_DEFAULTS } from '@/lib/content/site-page-defaults'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Edit About Us | OPG Admin',
}

export default async function AdminAboutPage() {
  redirect('/admin/pages?tab=about')

  const session = await requireAdminSession({ requireAal2: true })
  const roleKey = session.profile.roleKey

  const supabase = await createClient()
  const { data: document } = await supabase
    .from('page_documents')
    .select('*')
    .eq('slug', 'about')
    .maybeSingle<PageDocument>()

  // Extract plain text paragraphs from content blocks
  let body = ''
  const documentContent = document?.content ?? []
  if (Array.isArray(documentContent)) {
    body = documentContent
      .flatMap((b) => (b.type === 'paragraph' && !b.key ? [b.content] : []))
      .join('\n\n')
  }

  const initialData = {
    copy: getPageCopy(document?.content, ABOUT_COPY_SECTIONS),
    title: document?.title ?? ABOUT_PAGE_DEFAULTS.title,
    summary: document?.summary ?? ABOUT_PAGE_DEFAULTS.summary,
    body: body || ABOUT_PAGE_DEFAULTS.body,
    seoTitle: document?.seo_title || '',
    seoDescription: document?.seo_description || '',
    ogImageUrl: document?.og_image_url || '',
    canonicalUrl: document?.canonical_url || '',
    status: document?.status || 'draft',
    updatedAt: document?.updated_at || null,
    editorName: session.profile.displayName,
    hasSavedDraft: document?.status === 'draft',
    version: document?.version || 1,
  }

  const permissions = {
    canEditDraft: canEditDraft(roleKey),
    canSubmitReview: canSubmitReview(roleKey),
    canRequestChanges: canRequestChanges(roleKey),
    canPublish: canPublish(roleKey),
  }

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span>Pages</span>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">About Us</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Content Workspace</p>
            <h1>Edit About Us</h1>
            <p>
              Manage official company background, capability narrative, and
              metadata.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        <div className="admin-content-card">
          <AboutForm initialData={initialData} permissions={permissions} />
        </div>
      </div>
    </section>
  )
}
