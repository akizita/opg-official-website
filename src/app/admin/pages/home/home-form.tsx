'use client'

import { useActionState } from 'react'

import {
  saveHomeAction,
  type HomeActionState,
} from '@/app/admin/pages/home/actions'
import { PageCopyFields } from '@/components/admin/page-copy-fields'
import {
  CharacterCounter,
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
import { HOME_COPY_SECTIONS } from '@/lib/content/page-copy'
import type { DocumentStatus } from '@/lib/content/page-documents'

type HomeFormProps = {
  initialData: {
    title: string
    summary: string
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

export function HomeForm({ initialData, permissions }: HomeFormProps) {
  const [state, formAction] = useActionState<HomeActionState, FormData>(
    saveHomeAction,
    {
      status: initialData.status,
      version: initialData.version,
    },
  )
  const status = state.status ?? initialData.status
  const version = state.version ?? initialData.version
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
      title: initialData.title,
      summary: initialData.summary,
      seoTitle: initialData.seoTitle,
      seoDescription: initialData.seoDescription,
      ogImageUrl: initialData.ogImageUrl,
      canonicalUrl: initialData.canonicalUrl,
    },
    result: state,
    status,
    tab: 'home',
    updatedAt: state.updatedAt ?? initialData.updatedAt,
    version,
  })

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
          page="home"
          sections={[
            {
              id: 'home-hero',
              label: 'Hero',
              status:
                draft.title.trim() && draft.summary.trim()
                  ? 'complete'
                  : 'incomplete',
            },
            ...HOME_COPY_SECTIONS.map((section) => ({
              id: section.id,
              label: section.title,
              status: section.fields.every((field) =>
                (draft as Record<string, string>)[field.key]?.trim(),
              )
                ? ('complete' as const)
                : ('incomplete' as const),
            })),
            { id: 'home-seo', label: 'SEO & social', status: 'optional' },
          ]}
        />
        <div className="pages-content-form__main">
          <SectionCard
            complete={Boolean(draft.title.trim() && draft.summary.trim())}
            description="The live Home page headline and introduction."
            eyebrow="Page content"
            icon="essentials"
            id="home-hero"
            summary={draft.title || 'Add a page title'}
            title="Hero"
          >
            <div className="form-group">
              <Input
                defaultValue={initialData.title}
                id="home-title"
                label="Page title"
                maxLength={200}
                name="title"
                required
              />
              {(fieldErrors.title || state.errors?.title) && (
                <p className="form-error" role="alert">
                  {fieldErrors.title || state.errors?.title}
                </p>
              )}
              <div className="field-meta">
                <CharacterCounter current={draft.title.length} maximum={200} />
              </div>
            </div>
            <div className="form-group">
              <TextArea
                defaultValue={initialData.summary}
                id="home-summary"
                label="Intro summary"
                maxLength={500}
                name="summary"
                required
                rows={3}
              />
              {(fieldErrors.summary || state.errors?.summary) && (
                <p className="form-error" role="alert">
                  {fieldErrors.summary || state.errors?.summary}
                </p>
              )}
              <div className="field-meta">
                <CharacterCounter
                  current={draft.summary.length}
                  maximum={500}
                />
              </div>
            </div>
          </SectionCard>
          {HOME_COPY_SECTIONS.map((section) => (
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
            id="home-seo"
            summary={draft.seoTitle || 'Search title uses page title'}
            title="SEO and social metadata"
          >
            <div className="content-form__field-grid">
              <div className="form-group">
                <Input
                  defaultValue={initialData.seoTitle}
                  id="home-seo-title"
                  label="SEO title"
                  maxLength={100}
                  name="seoTitle"
                />
              </div>
              <div className="form-group">
                <TextArea
                  defaultValue={initialData.seoDescription}
                  id="home-seo-description"
                  label="SEO description"
                  maxLength={250}
                  name="seoDescription"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <Input
                  defaultValue={initialData.ogImageUrl}
                  id="home-og-image"
                  label="Social image URL"
                  name="ogImageUrl"
                />
                <MediaPicker inputId="home-og-image" value={draft.ogImageUrl} />
              </div>
              <div className="form-group">
                <Input
                  defaultValue={initialData.canonicalUrl}
                  id="home-canonical-url"
                  label="Canonical URL"
                  name="canonicalUrl"
                />
              </div>
            </div>
            <SearchSnippetPreview
              description={draft.seoDescription || draft.summary}
              title={draft.seoTitle || draft.title}
              url={draft.canonicalUrl || '/'}
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
              new CustomEvent('opg-editor-retry', { detail: { tab: 'home' } }),
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
          publishedUrl="/"
          updatedAt={state.updatedAt ?? initialData.updatedAt}
        />
      </div>
    </form>
  )
}
