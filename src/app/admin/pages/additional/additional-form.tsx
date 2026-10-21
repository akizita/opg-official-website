'use client'

import { useActionState } from 'react'

import {
  saveAdditionalPageAction,
  type AdditionalPageActionState,
} from '@/app/admin/pages/additional/actions'
import { PageCopyFields } from '@/components/admin/page-copy-fields'
import {
  MediaPicker,
  PageDetailsCard,
  PageEditorActions,
  PageEditorToast,
  PageSectionNavigator,
  SearchSnippetPreview,
  SectionCard,
} from '@/components/admin/page-editor-ui'
import { usePageEditorForm } from '@/components/admin/use-page-editor-form'
import { Input, TextArea } from '@/components/ui/form-controls'
import { Notice } from '@/components/ui/notice'
import {
  ADDITIONAL_PAGE_COPY,
  type AdditionalPage,
} from '@/lib/content/page-copy'
import type { DocumentStatus } from '@/lib/content/page-documents'

type Props = {
  page: AdditionalPage
  initialData: {
    copy: Record<string, string>
    seoTitle: string
    seoDescription: string
    ogImageUrl: string
    canonicalUrl: string
    status: DocumentStatus
    updatedAt: string | null
    publishedAt: string | null
    editorName: string
    currentEditorName: string
    hasSavedDraft: boolean
    version: number
  }
  permissions: {
    canEditDraft: boolean
    canPublish: boolean
    canRequestChanges: boolean
    canSubmitReview: boolean
  }
}

export function AdditionalPageForm({ page, initialData, permissions }: Props) {
  const [state, formAction] = useActionState<
    AdditionalPageActionState,
    FormData
  >(saveAdditionalPageAction.bind(null, page), {
    status: initialData.status,
    version: initialData.version,
  })
  const status = state.status ?? initialData.status
  const version = state.version ?? initialData.version
  const sections = ADDITIONAL_PAGE_COPY[page]
  const {
    dirty,
    discard,
    draft,
    fieldErrors,
    formRef,
    handleBlur,
    handleInput,
    handleSubmit,
    saveDraftRef,
    saveState,
  } = usePageEditorForm({
    initialValues: {
      ...initialData.copy,
      seoTitle: initialData.seoTitle,
      seoDescription: initialData.seoDescription,
      ogImageUrl: initialData.ogImageUrl,
      canonicalUrl: initialData.canonicalUrl,
    },
    result: state,
    status,
    tab: page,
    updatedAt: state.updatedAt ?? initialData.updatedAt,
    version,
  })
  const first = page === 'articles' ? 'pageTitle' : 'heroTitle'
  const summary = page === 'articles' ? 'collectionLead' : 'heroLead'
  return (
    <form
      action={formAction}
      className="content-form pages-content-form"
      onBlurCapture={handleBlur}
      onInput={handleInput}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <button
        hidden
        name="intent"
        ref={saveDraftRef}
        type="submit"
        value="save_draft"
      />
      {state.success && state.updatedAt ? (
        <PageEditorToast
          key={state.updatedAt}
          message={state.message || 'Changes saved'}
        />
      ) : null}
      {state.message && !state.success ? (
        <Notice title="Attention" variant="error">
          {state.message}
        </Notice>
      ) : null}
      <div className="pages-content-form__layout">
        <PageSectionNavigator
          page={page}
          sections={[
            ...sections.map((section) => ({
              id: section.id,
              label: section.title,
              status: section.fields.every((field) =>
                (draft as Record<string, string>)[field.key]?.trim(),
              )
                ? ('complete' as const)
                : ('incomplete' as const),
            })),
            { id: `${page}-seo`, label: 'SEO & social', status: 'optional' },
          ]}
        />
        <div className="pages-content-form__main">
          {sections.map((section) => (
            <PageCopyFields
              key={section.id}
              section={section}
              initial={initialData.copy}
              draft={draft}
              errors={{ ...state.errors, ...fieldErrors }}
            />
          ))}
          <SectionCard
            complete={Boolean(draft.seoTitle && draft.seoDescription)}
            description="Optional search and social sharing overrides."
            eyebrow="Search appearance"
            icon="search"
            id={`${page}-seo`}
            summary={draft.seoTitle || 'Search title uses page title'}
            title="SEO and social metadata"
          >
            <div className="content-form__field-grid">
              <div className="form-group">
                <Input
                  defaultValue={initialData.seoTitle}
                  id={`${page}-seo-title`}
                  label="SEO title"
                  maxLength={100}
                  name="seoTitle"
                />
              </div>
              <div className="form-group">
                <TextArea
                  defaultValue={initialData.seoDescription}
                  id={`${page}-seo-description`}
                  label="SEO description"
                  maxLength={250}
                  name="seoDescription"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <Input
                  defaultValue={initialData.ogImageUrl}
                  id={`${page}-og-image`}
                  label="Social image URL"
                  name="ogImageUrl"
                />
                <MediaPicker
                  inputId={`${page}-og-image`}
                  value={draft.ogImageUrl}
                />
              </div>
              <div className="form-group">
                <Input
                  defaultValue={initialData.canonicalUrl}
                  id={`${page}-canonical-url`}
                  label="Canonical URL"
                  name="canonicalUrl"
                />
              </div>
            </div>
            <SearchSnippetPreview
              description={
                draft.seoDescription ||
                (draft as Record<string, string>)[summary]
              }
              title={draft.seoTitle || (draft as Record<string, string>)[first]}
              url={draft.canonicalUrl || `/${page}`}
            />
          </SectionCard>
          <PageEditorActions
            dirty={dirty}
            onDiscard={discard}
            permissions={permissions}
            status={status}
          />
        </div>
        <PageDetailsCard
          dirty={dirty}
          hasSavedDraft={
            state.status ? state.status === 'draft' : initialData.hasSavedDraft
          }
          onRetry={() =>
            window.dispatchEvent(
              new CustomEvent('opg-editor-retry', { detail: { tab: page } }),
            )
          }
          saveState={saveState}
          status={status}
          version={version}
          editorName={
            state.success
              ? initialData.currentEditorName
              : initialData.editorName
          }
          publishedAt={
            state.success && state.status === 'published'
              ? (state.updatedAt ?? null)
              : initialData.publishedAt
          }
          publishedUrl={`/${page}`}
          updatedAt={state.updatedAt ?? initialData.updatedAt}
        />
      </div>
    </form>
  )
}
