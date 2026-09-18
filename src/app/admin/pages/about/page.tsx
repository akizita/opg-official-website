import type { Metadata } from 'next'
import Link from 'next/link'

import { AboutForm } from '@/app/admin/pages/about/about-form'
import {
  canEditDraft,
  canPublish,
  canRequestChanges,
  canSubmitReview,
} from '@/lib/auth/permissions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import type { PageDocument } from '@/lib/content/page-documents'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Edit About Us | OPG Admin',
}

export default async function AdminAboutPage() {
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
  if (Array.isArray(document?.content)) {
    body = document.content
      .filter((b) => b.type === 'paragraph')
      .map((b) => b.content)
      .join('\n\n')
  }

  const initialData = {
    title: document?.title || 'About Outsourced Pro Global',
    summary:
      document?.summary ||
      'Delivering elite remote team capabilities and global talent solutions across industries.',
    body:
      body ||
      'Outsourced Pro Global is a premier international talent solutions partner. We combine deep recruitment expertise with dedicated account support to deliver talent that integrates directly into your business culture.',
    seoTitle: document?.seo_title || '',
    seoDescription: document?.seo_description || '',
    ogImageUrl: document?.og_image_url || '',
    canonicalUrl: document?.canonical_url || '',
    status: document?.status || 'draft',
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
