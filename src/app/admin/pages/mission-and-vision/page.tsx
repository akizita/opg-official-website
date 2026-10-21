import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { MissionVisionForm } from '@/app/admin/pages/mission-and-vision/mission-vision-form'
import {
  canEditDraft,
  canPublish,
  canRequestChanges,
  canSubmitReview,
} from '@/lib/auth/permissions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import {
  extractMissionVisionContent,
  type PageDocument,
} from '@/lib/content/page-documents'
import { HOME_EDITOR_DEFAULTS } from '@/lib/content/site-page-defaults'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Edit Mission & Vision | OPG Admin',
}

export default async function AdminMissionVisionPage() {
  redirect('/admin/pages?tab=home')

  const session = await requireAdminSession({ requireAal2: true })
  const roleKey = session.profile.roleKey

  const supabase = await createClient()
  const { data: document } = await supabase
    .from('page_documents')
    .select('*')
    .eq('slug', 'mission-and-vision')
    .maybeSingle<PageDocument>()

  const contentFields = extractMissionVisionContent(document?.content)

  const initialData = {
    title: document?.title ?? HOME_EDITOR_DEFAULTS.title,
    summary: document?.summary ?? HOME_EDITOR_DEFAULTS.summary,
    missionTitle: document
      ? contentFields.missionTitle
      : HOME_EDITOR_DEFAULTS.missionTitle,
    missionBody:
      document && contentFields.missionBody
        ? contentFields.missionBody
        : HOME_EDITOR_DEFAULTS.missionBody,
    visionTitle: document
      ? contentFields.visionTitle
      : HOME_EDITOR_DEFAULTS.visionTitle,
    visionBody:
      document && contentFields.visionBody
        ? contentFields.visionBody
        : HOME_EDITOR_DEFAULTS.visionBody,
    calloutText:
      document && contentFields.calloutText
        ? contentFields.calloutText
        : HOME_EDITOR_DEFAULTS.calloutText,
    calloutVariant: document
      ? contentFields.calloutVariant
      : HOME_EDITOR_DEFAULTS.calloutVariant,
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
        {/* Navigation Breadcrumb */}
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
            <li aria-current="page">Mission & Vision</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Content Workspace · Vertical Slice</p>
            <h1>Edit Mission & Vision</h1>
            <p>
              Manage official company purpose statements, values highlights, and
              search preview metadata.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Content Editor Form */}
        <div className="admin-content-card">
          <MissionVisionForm
            initialData={initialData}
            permissions={permissions}
          />
        </div>
      </div>
    </section>
  )
}
