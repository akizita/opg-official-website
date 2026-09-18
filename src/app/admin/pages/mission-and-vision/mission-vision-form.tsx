'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  type MissionVisionActionState,
  saveMissionVisionAction,
} from '@/app/admin/pages/mission-and-vision/actions'
import { Input, TextArea } from '@/components/ui/form-controls'
import { Notice } from '@/components/ui/notice'
import { StatusBadge } from '@/components/ui/status-badge'
import type { DocumentStatus } from '@/lib/content/page-documents'

type MissionVisionFormProps = {
  initialData: {
    calloutText: string
    calloutVariant: 'info' | 'warning'
    canonicalUrl: string
    missionBody: string
    missionTitle: string
    ogImageUrl: string
    seoDescription: string
    seoTitle: string
    status: DocumentStatus
    summary: string
    title: string
    version: number
    visionBody: string
    visionTitle: string
  }
  permissions: {
    canEditDraft: boolean
    canPublish: boolean
    canRequestChanges: boolean
    canSubmitReview: boolean
  }
}

function ActionButton({
  children,
  className = 'button',
  intent,
  pendingLabel,
}: {
  children: string
  className?: string
  intent: string
  pendingLabel: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      className={className}
      disabled={pending}
      name="intent"
      type="submit"
      value={intent}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}

export function MissionVisionForm({
  initialData,
  permissions,
}: MissionVisionFormProps) {
  const [state, formAction] = useActionState<
    MissionVisionActionState,
    FormData
  >(saveMissionVisionAction, {
    status: initialData.status,
    version: initialData.version,
  })

  const currentStatus = state.status ?? initialData.status
  const currentVersion = state.version ?? initialData.version

  return (
    <form action={formAction} className="content-form">
      {/* Live Status Header */}
      <div className="content-form__status-bar">
        <div className="content-form__status-meta">
          <span className="status-meta__label">Current Status:</span>
          <StatusBadge status={currentStatus} />
          <span className="status-meta__version">
            Version <strong>{currentVersion}</strong>
          </span>
        </div>
        <div className="content-form__status-actions">
          <Link
            className="button-link button-link--secondary"
            href="/mission-and-vision"
            target="_blank"
          >
            View Live Page ↗
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {state.message && (
        <Notice
          title={state.success ? 'Success' : 'Attention'}
          variant={state.success ? 'success' : 'error'}
        >
          {state.message}
        </Notice>
      )}

      {/* Section 1: Basic Page Info */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Basic Page Information</legend>
        <p className="form-fieldset__desc">
          Sets the main header and executive summary displayed on the public
          page.
        </p>

        <div className="form-group">
          <Input
            aria-describedby="title-help"
            defaultValue={initialData.title}
            id="title"
            label="Page Title *"
            maxLength={200}
            name="title"
            required
          />
          <p className="form-help" id="title-help">
            The primary H1 title displayed on the public page (1–200
            characters).
          </p>
          {state.errors?.title && (
            <p className="form-error" role="alert">
              {state.errors.title}
            </p>
          )}
        </div>

        <div className="form-group">
          <TextArea
            aria-describedby="summary-help"
            defaultValue={initialData.summary}
            id="summary"
            label="Summary Deck / Lead Paragraph"
            maxLength={500}
            name="summary"
            rows={3}
          />
          <p className="form-help" id="summary-help">
            A concise lead paragraph introducing the purpose of the organization
            (max 500 characters).
          </p>
          {state.errors?.summary && (
            <p className="form-error" role="alert">
              {state.errors.summary}
            </p>
          )}
        </div>
      </fieldset>

      {/* Section 2: Core Mission & Vision */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Mission & Vision Statements</legend>
        <p className="form-fieldset__desc">
          Define the formal mission and vision declarations. Paragraphs will be
          formatted cleanly on the public page.
        </p>

        <div className="form-grid">
          <div className="form-panel">
            <h3 className="form-panel__title">Mission Declaration</h3>
            <div className="form-group">
              <Input
                defaultValue={initialData.missionTitle}
                id="missionTitle"
                label="Mission Heading"
                name="missionTitle"
              />
            </div>
            <div className="form-group">
              <TextArea
                defaultValue={initialData.missionBody}
                id="missionBody"
                label="Mission Statement *"
                name="missionBody"
                required
                rows={6}
              />
            </div>
          </div>

          <div className="form-panel">
            <h3 className="form-panel__title">Vision Declaration</h3>
            <div className="form-group">
              <Input
                defaultValue={initialData.visionTitle}
                id="visionTitle"
                label="Vision Heading"
                name="visionTitle"
              />
            </div>
            <div className="form-group">
              <TextArea
                defaultValue={initialData.visionBody}
                id="visionBody"
                label="Vision Statement *"
                name="visionBody"
                required
                rows={6}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section 3: Values Callout */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Core Values & Highlights</legend>
        <p className="form-fieldset__desc">
          Highlight key commitments or organizational values shown in an
          accented callout box.
        </p>

        <div className="form-group">
          <TextArea
            defaultValue={initialData.calloutText}
            id="calloutText"
            label="Values Highlight Callout"
            name="calloutText"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="field" htmlFor="calloutVariant">
            <span>Callout Style</span>
            <select
              defaultValue={initialData.calloutVariant}
              id="calloutVariant"
              name="calloutVariant"
            >
              <option value="info">Info (Brand Accent)</option>
              <option value="warning">Warning / Notice</option>
            </select>
          </label>
        </div>
      </fieldset>

      {/* Section 4: SEO & Social Previews */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Search Engine & Social Sharing</legend>
        <p className="form-fieldset__desc">
          Optional overrides for Google search snippets and social media cards
          (OpenGraph).
        </p>

        <div className="form-group">
          <Input
            defaultValue={initialData.seoTitle}
            id="seoTitle"
            label="SEO Meta Title"
            maxLength={100}
            name="seoTitle"
          />
          <p className="form-help">
            Defaults to &quot;{initialData.title} | Outsourced Pro Global&quot;
            if blank.
          </p>
        </div>

        <div className="form-group">
          <TextArea
            defaultValue={initialData.seoDescription}
            id="seoDescription"
            label="SEO Meta Description"
            maxLength={250}
            name="seoDescription"
            rows={2}
          />
          <p className="form-help">
            Defaults to the summary deck if left empty.
          </p>
        </div>

        <div className="form-group">
          <Input
            defaultValue={initialData.ogImageUrl}
            id="ogImageUrl"
            label="OpenGraph Social Image URL"
            name="ogImageUrl"
            placeholder="https://example.com/og-image.jpg or /images/..."
          />
        </div>

        <div className="form-group">
          <Input
            defaultValue={initialData.canonicalUrl}
            id="canonicalUrl"
            label="Canonical URL Override"
            name="canonicalUrl"
            placeholder="https://opglobal.com.hk/mission-and-vision"
          />
        </div>
      </fieldset>

      {/* Action Bar */}
      <div className="content-form__actions">
        <div className="actions-left">
          {permissions.canEditDraft && (
            <ActionButton intent="save_draft" pendingLabel="Saving draft...">
              Save Draft
            </ActionButton>
          )}

          {permissions.canSubmitReview && currentStatus !== 'in_review' && (
            <ActionButton
              className="button button--secondary"
              intent="submit_review"
              pendingLabel="Submitting..."
            >
              Submit for Review
            </ActionButton>
          )}

          {permissions.canRequestChanges && currentStatus === 'in_review' && (
            <ActionButton
              className="button button--secondary"
              intent="request_changes"
              pendingLabel="Returning..."
            >
              Request Changes
            </ActionButton>
          )}
        </div>

        <div className="actions-right">
          {permissions.canPublish && (
            <>
              {currentStatus === 'published' ? (
                <ActionButton
                  className="button button--secondary"
                  intent="unpublish"
                  pendingLabel="Unpublishing..."
                >
                  Unpublish
                </ActionButton>
              ) : null}

              <ActionButton
                className="button button--primary"
                intent="publish"
                pendingLabel="Publishing..."
              >
                {currentStatus === 'published'
                  ? 'Update Live Page'
                  : 'Publish Page'}
              </ActionButton>
            </>
          )}
        </div>
      </div>
    </form>
  )
}

