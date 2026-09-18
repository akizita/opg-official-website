import type { Metadata } from 'next'
import Link from 'next/link'

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
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Edit Mission & Vision | OPG Admin',
}

export default async function AdminMissionVisionPage() {
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
    title: document?.title || 'Mission & Vision',
    summary:
      document?.summary ||
      'Empowering global organizations with exceptional talent, measurable delivery, and enduring human partnerships.',
    missionTitle: contentFields.missionTitle,
    missionBody:
      contentFields.missionBody ||
      'At Outsourced Pro Global, our mission is to connect ambitious enterprises with world-class talent, bridging international opportunities through integrity, transparent partnership, and operational excellence.',
    visionTitle: contentFields.visionTitle,
    visionBody:
      contentFields.visionBody ||
      'We envision a global workplace where borders do not limit capability, where companies scale seamlessly with dedicated teams, and where talent flourishes in high-trust, rewarding roles.',
    calloutText:
      contentFields.calloutText ||
      'Built on values of transparency, accountability, and sustainable partnership across all global client engagements.',
    calloutVariant: contentFields.calloutVariant,
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
