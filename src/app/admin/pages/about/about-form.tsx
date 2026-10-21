'use client'

import { useActionState } from 'react'

import {
  type AboutActionState,
  saveAboutAction,
} from '@/app/admin/pages/about/actions'
import {
  CharacterCounter,
  MediaPicker,
  PageEditorActions,
  PageSectionNavigator,
  PageDetailsCard,
  PageEditorToast,
  SearchSnippetPreview,
  SectionCard,
} from '@/components/admin/page-editor-ui'
import { PageCopyFields } from '@/components/admin/page-copy-fields'
import { usePageEditorForm } from '@/components/admin/use-page-editor-form'
import { Input, TextArea } from '@/components/ui/form-controls'
import { Notice } from '@/components/ui/notice'
import type { DocumentStatus } from '@/lib/content/page-documents'
import { ABOUT_COPY_SECTIONS } from '@/lib/content/page-copy'

type AboutFormProps = {
  initialData: {
    copy: Record<string, string>
    body: string
    canonicalUrl: string
    ogImageUrl: string
    seoDescription: string
    seoTitle: string
    status: DocumentStatus
    summary: string
    title: string
    updatedAt: string | null
    editorName: string
    currentEditorName?: string
    hasSavedDraft: boolean
    publishedAt?: string | null
    version: number
  }
  permissions: {
    canEditDraft: boolean
    canPublish: boolean
    canRequestChanges: boolean
    canSubmitReview: boolean
  }
}

export function AboutForm({ initialData, permissions }: AboutFormProps) {
  const [state, formAction] = useActionState<AboutActionState, FormData>(
    saveAboutAction,
    {
      status: initialData.status,
      version: initialData.version,
    },
  )

  const currentStatus = state.status ?? initialData.status
  const currentVersion = state.version ?? initialData.version
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
      body: initialData.body,
      canonicalUrl: initialData.canonicalUrl,
      ogImageUrl: initialData.ogImageUrl,
      seoDescription: initialData.seoDescription,
      seoTitle: initialData.seoTitle,
      summary: initialData.summary,
      title: initialData.title,
    },
    result: state,
    status: currentStatus,
    tab: 'about',
    updatedAt: state.updatedAt ?? initialData.updatedAt,
    version: currentVersion,
  })

  const successMessage =
    state.status === 'published'
      ? 'Page published'
      : state.status === 'in_review'
        ? 'Submitted for review'
        : state.status === 'unpublished'
          ? 'Page unpublished'
          : 'Draft saved'
  const copyNavigator = ABOUT_COPY_SECTIONS.map((section) => ({
    id: section.id,
    label: section.title,
    status: section.fields.every((field) =>
      (draft as Record<string, string>)[field.key]?.trim(),
    )
      ? ('complete' as const)
      : ('incomplete' as const),
  }))

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
        <PageEditorToast key={state.updatedAt} message={successMessage} />
      ) : null}
      {state.message && !state.success && (
        <PageEditorToast
          key={state.message}
          message={state.message}
          variant="error"
        />
      )}
      {state.message && !state.success && (
        <Notice
          title={state.success ? 'Success' : 'Attention'}
          variant={state.success ? 'success' : 'error'}
        >
          {state.message}
        </Notice>
      )}

      <div className="pages-content-form__layout">
        <PageSectionNavigator
          page="about"
          sections={[
            {
              id: 'about-hero',
              label: 'Hero',
              status:
                fieldErrors.title || fieldErrors.summary
                  ? 'error'
                  : draft.title.trim()
                    ? 'complete'
                    : 'incomplete',
            },
            copyNavigator[0],
            {
              id: 'about-narrative',
              label: 'Who we are',
              status: fieldErrors.body
                ? 'error'
                : draft.body.trim()
                  ? 'complete'
                  : 'incomplete',
            },
            ...copyNavigator.slice(1),
            {
              id: 'about-seo',
              label: 'SEO & social',
              status:
                draft.seoTitle.trim() && draft.seoDescription.trim()
                  ? 'complete'
                  : 'optional',
            },
          ]}
        />
        <div className="pages-content-form__main">
          <SectionCard
            complete={Boolean(draft.title.trim())}
            description="Set the title and introductory copy shown in the public About hero."
            eyebrow="Page content"
            icon="essentials"
            id="about-hero"
            errorCount={
              Number(Boolean(fieldErrors.title || state.errors?.title)) +
              Number(Boolean(fieldErrors.summary || state.errors?.summary))
            }
            summary={draft.title.trim() || 'Add a page title'}
            title="Hero"
          >
            <div className="form-group">
              <Input
                defaultValue={initialData.title}
                id="about-title"
                label="Page title"
                maxLength={200}
                name="title"
                required
                aria-invalid={Boolean(fieldErrors.title || state.errors?.title)}
              />
              {(fieldErrors.title || state.errors?.title) && (
                <p className="form-error" role="alert">
                  {fieldErrors.title || state.errors?.title}
                </p>
              )}
              <div className="field-meta">
                <span>Primary page heading</span>
                <CharacterCounter current={draft.title.length} maximum={200} />
              </div>
            </div>

            <div className="form-group">
              <TextArea
                defaultValue={initialData.summary}
                id="about-summary"
                label="Intro summary"
                maxLength={500}
                name="summary"
                rows={3}
                aria-invalid={Boolean(
                  fieldErrors.summary || state.errors?.summary,
                )}
              />
              {(fieldErrors.summary || state.errors?.summary) && (
                <p className="form-error" role="alert">
                  {fieldErrors.summary || state.errors?.summary}
                </p>
              )}
              <div className="field-meta">
                <span>Appears below the page heading</span>
                <CharacterCounter
                  current={draft.summary.length}
                  maximum={500}
                />
              </div>
            </div>
          </SectionCard>
          <PageCopyFields
            section={ABOUT_COPY_SECTIONS[0]}
            initial={initialData.copy}
            draft={draft}
            errors={{ ...state.errors, ...fieldErrors }}
          />

          <SectionCard
            complete={Boolean(draft.body.trim())}
            description="Maintain the company story and capabilities backed by the current About document."
            eyebrow="Page content"
            icon="content"
            id="about-narrative"
            errorCount={Number(Boolean(fieldErrors.body))}
            summary={
              draft.body.trim()
                ? `${draft.body.trim().split(/\s+/).length} words of story`
                : 'Story missing'
            }
            title="Who we are"
          >
            <div className="form-group">
              <TextArea
                defaultValue={initialData.body}
                id="about-body"
                label="Company story and capabilities"
                name="body"
                required
                rows={3}
                aria-invalid={Boolean(fieldErrors.body)}
              />
              {fieldErrors.body ? (
                <p className="form-error" role="alert">
                  {fieldErrors.body}
                </p>
              ) : null}
              <div className="field-meta">
                <span>Separate paragraphs with a blank line</span>
              </div>
            </div>
          </SectionCard>

          {ABOUT_COPY_SECTIONS.slice(1).map((section) => (
            <PageCopyFields
              key={section.id}
              section={section}
              initial={initialData.copy}
              draft={draft}
              errors={{ ...state.errors, ...fieldErrors }}
            />
          ))}

          <SectionCard
            complete={Boolean(
              draft.seoTitle.trim() && draft.seoDescription.trim(),
            )}
            description="Control optional search-result and social-sharing overrides."
            eyebrow="Optional content"
            icon="search"
            id="about-seo"
            summary={draft.seoTitle.trim() || 'Search title uses page title'}
            title="SEO and social metadata"
          >
            <div className="content-form__field-grid">
              <div className="form-group">
                <Input
                  defaultValue={initialData.seoTitle}
                  id="about-seoTitle"
                  label="SEO title"
                  maxLength={100}
                  name="seoTitle"
                />
                <div className="field-meta">
                  <span>Recommended: 50–60 characters · Max 100</span>
                  <CharacterCounter
                    current={draft.seoTitle.length}
                    maximum={100}
                    recommended={60}
                  />
                </div>
              </div>

              <div className="form-group">
                <TextArea
                  defaultValue={initialData.seoDescription}
                  id="about-seoDescription"
                  label="SEO description"
                  maxLength={250}
                  name="seoDescription"
                  rows={2}
                />
                <div className="field-meta">
                  <span>Recommended: 140–155 characters · Max 250</span>
                  <CharacterCounter
                    current={draft.seoDescription.length}
                    maximum={250}
                    recommended={155}
                  />
                </div>
              </div>

              <div className="form-group">
                <Input
                  defaultValue={initialData.ogImageUrl}
                  id="about-ogImageUrl"
                  label="Social image URL"
                  name="ogImageUrl"
                />
                <MediaPicker
                  inputId="about-ogImageUrl"
                  value={draft.ogImageUrl}
                />
              </div>

              <div className="form-group">
                <Input
                  defaultValue={initialData.canonicalUrl}
                  id="about-canonicalUrl"
                  label="Canonical URL"
                  name="canonicalUrl"
                />
              </div>
            </div>
            <SearchSnippetPreview
              description={draft.seoDescription || draft.summary}
              title={draft.seoTitle || draft.title}
              url={draft.canonicalUrl || '/about'}
            />
          </SectionCard>
          <PageEditorActions
            dirty={dirty}
            onDiscard={discard}
            permissions={permissions}
            status={currentStatus}
          />
        </div>

        <PageDetailsCard
          dirty={dirty}
          hasSavedDraft={
            state.status ? state.status === 'draft' : initialData.hasSavedDraft
          }
          onRetry={() =>
            window.dispatchEvent(
              new CustomEvent('opg-editor-retry', { detail: { tab: 'about' } }),
            )
          }
          saveState={saveState}
          status={currentStatus}
          version={currentVersion}
          editorName={
            state.success
              ? (initialData.currentEditorName ?? initialData.editorName)
              : initialData.editorName
          }
          publishedAt={
            state.success && state.status === 'published'
              ? (state.updatedAt ?? null)
              : (initialData.publishedAt ?? null)
          }
          publishedUrl="/about"
          updatedAt={state.updatedAt ?? initialData.updatedAt}
        />
      </div>
    </form>
  )
}
