'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  type AboutActionState,
  saveAboutAction,
} from '@/app/admin/pages/about/actions'
import { Input, TextArea } from '@/components/ui/form-controls'
import { Notice } from '@/components/ui/notice'
import { StatusBadge } from '@/components/ui/status-badge'
import type { DocumentStatus } from '@/lib/content/page-documents'

type AboutFormProps = {
  initialData: {
    body: string
    canonicalUrl: string
    ogImageUrl: string
    seoDescription: string
    seoTitle: string
    status: DocumentStatus
    summary: string
    title: string
    version: number
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

export function AboutForm({ initialData, permissions }: AboutFormProps) {
  const [state, formAction] = useActionState<AboutActionState, FormData>(
    saveAboutAction,
    {
      status: initialData.status,
      version: initialData.version,
    }
  )

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
            href="/about"
            target="_blank"
          >
            View Live Page ↗
          </Link>
        </div>
      </div>

      {state.message && (
        <Notice
          title={state.success ? 'Success' : 'Attention'}
          variant={state.success ? 'success' : 'error'}
        >
          {state.message}
        </Notice>
      )}

      {/* Basic Page Info */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Page Title & Summary</legend>
        <div className="form-group">
          <Input
            defaultValue={initialData.title}
            id="title"
            label="Page Title *"
            maxLength={200}
            name="title"
            required
          />
          {state.errors?.title && (
            <p className="form-error" role="alert">
              {state.errors.title}
            </p>
          )}
        </div>

        <div className="form-group">
          <TextArea
            defaultValue={initialData.summary}
            id="summary"
            label="Executive Summary Deck"
            maxLength={500}
            name="summary"
            rows={3}
          />
          {state.errors?.summary && (
            <p className="form-error" role="alert">
              {state.errors.summary}
            </p>
          )}
        </div>
      </fieldset>

      {/* Narrative Body */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">About Us Narrative</legend>
        <div className="form-group">
          <TextArea
            defaultValue={initialData.body}
            id="body"
            label="Story & Capabilities (Paragraphs separated by blank lines)"
            name="body"
            required
            rows={8}
          />
        </div>
      </fieldset>

      {/* SEO & Previews */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Search & Social Sharing</legend>
        <div className="form-group">
          <Input
            defaultValue={initialData.seoTitle}
            id="seoTitle"
            label="SEO Meta Title"
            maxLength={100}
            name="seoTitle"
          />
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
        </div>

        <div className="form-group">
          <Input
            defaultValue={initialData.ogImageUrl}
            id="ogImageUrl"
            label="OG Social Image URL"
            name="ogImageUrl"
          />
        </div>

        <div className="form-group">
          <Input
            defaultValue={initialData.canonicalUrl}
            id="canonicalUrl"
            label="Canonical URL Override"
            name="canonicalUrl"
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

