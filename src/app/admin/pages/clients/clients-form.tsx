'use client'

import { useActionState } from 'react'

import {
  type ClientsActionState,
  saveClientsAction,
} from '@/app/admin/pages/clients/actions'
import {
  CharacterCounter,
  MediaPicker,
  PageEditorActions,
  PageDetailsCard,
  PageEditorToast,
  PageSectionNavigator,
  SearchSnippetPreview,
  SectionCard,
} from '@/components/admin/page-editor-ui'
import { PageCopyFields } from '@/components/admin/page-copy-fields'
import { usePageEditorForm } from '@/components/admin/use-page-editor-form'
import { Input, TextArea } from '@/components/ui/form-controls'
import { Notice } from '@/components/ui/notice'
import type { DocumentStatus } from '@/lib/content/page-documents'
import { CLIENTS_COPY_SECTIONS } from '@/lib/content/page-copy'

type ClientsFields = {
  canonicalUrl: string
  editorialLead: string
  editorialTitle: string
  ogImageUrl: string
  seoDescription: string
  seoTitle: string
  summary: string
  title: string
}

type ClientsFormProps = {
  initialData: ClientsFields & {
    copy: Record<string, string>
    editorName: string
    hasSavedDraft: boolean
    currentEditorName: string
    status: DocumentStatus
    updatedAt: string | null
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

export function ClientsForm({ initialData, permissions }: ClientsFormProps) {
  const [state, formAction] = useActionState<ClientsActionState, FormData>(
    saveClientsAction,
    { status: initialData.status, version: initialData.version },
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
      canonicalUrl: initialData.canonicalUrl,
      editorialLead: initialData.editorialLead,
      editorialTitle: initialData.editorialTitle,
      ogImageUrl: initialData.ogImageUrl,
      seoDescription: initialData.seoDescription,
      seoTitle: initialData.seoTitle,
      summary: initialData.summary,
      title: initialData.title,
    },
    result: state,
    status,
    tab: 'clients',
    updatedAt: state.updatedAt ?? initialData.updatedAt,
    version,
  })
  const copyNavigator = CLIENTS_COPY_SECTIONS.map((section) => ({
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
        <PageEditorToast
          key={state.updatedAt}
          message={state.message || 'Changes saved'}
        />
      ) : null}
      {state.message && !state.success ? (
        <PageEditorToast
          key={state.message}
          message={state.message}
          variant="error"
        />
      ) : null}
      {state.message && !state.success ? (
        <Notice title="Attention" variant="error">
          {state.message}
        </Notice>
      ) : null}

      <div className="pages-content-form__layout">
        <PageSectionNavigator
          page="clients"
          sections={[
            {
              id: 'clients-hero',
              label: 'Hero',
              status:
                fieldErrors.title || fieldErrors.summary
                  ? 'error'
                  : draft.title.trim() && draft.summary.trim()
                    ? 'complete'
                    : 'incomplete',
            },
            copyNavigator[0],
            {
              id: 'clients-editorial',
              label: 'Editorial intro',
              status:
                fieldErrors.editorialTitle || fieldErrors.editorialLead
                  ? 'error'
                  : draft.editorialTitle.trim() && draft.editorialLead.trim()
                    ? 'complete'
                    : 'incomplete',
            },
            ...copyNavigator.slice(1),
            {
              id: 'clients-seo',
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
            complete={Boolean(draft.title.trim() && draft.summary.trim())}
            description="The headline and introduction at the top of the public Clients page."
            eyebrow="Page content"
            icon="essentials"
            id="clients-hero"
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
                id="clients-title"
                label="Page title"
                maxLength={200}
                name="title"
                required
                aria-invalid={Boolean(fieldErrors.title || state.errors?.title)}
              />
              {fieldErrors.title || state.errors?.title ? (
                <p className="form-error" role="alert">
                  {fieldErrors.title || state.errors?.title}
                </p>
              ) : null}
              <div className="field-meta">
                <span>Main page heading</span>
                <CharacterCounter current={draft.title.length} maximum={200} />
              </div>
            </div>
            <div className="form-group">
              <TextArea
                defaultValue={initialData.summary}
                id="clients-summary"
                label="Intro summary"
                maxLength={500}
                name="summary"
                required
                rows={3}
                aria-invalid={Boolean(
                  fieldErrors.summary || state.errors?.summary,
                )}
              />
              {fieldErrors.summary || state.errors?.summary ? (
                <p className="form-error" role="alert">
                  {fieldErrors.summary || state.errors?.summary}
                </p>
              ) : null}
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
            section={CLIENTS_COPY_SECTIONS[0]}
            initial={initialData.copy}
            draft={draft}
            errors={{ ...state.errors, ...fieldErrors }}
          />

          <SectionCard
            complete={Boolean(
              draft.editorialTitle.trim() && draft.editorialLead.trim(),
            )}
            description="Introduce the partnership article below the featured client cards."
            eyebrow="Page content"
            icon="content"
            id="clients-editorial"
            errorCount={
              Number(
                Boolean(
                  fieldErrors.editorialTitle || state.errors?.editorialTitle,
                ),
              ) +
              Number(
                Boolean(
                  fieldErrors.editorialLead || state.errors?.editorialLead,
                ),
              )
            }
            summary={draft.editorialTitle.trim() || 'Add an article heading'}
            title="Editorial introduction"
          >
            <div className="form-group">
              <Input
                defaultValue={initialData.editorialTitle}
                id="clients-editorial-title"
                label="Article heading"
                maxLength={200}
                name="editorialTitle"
                required
                aria-invalid={Boolean(
                  fieldErrors.editorialTitle || state.errors?.editorialTitle,
                )}
              />
              {fieldErrors.editorialTitle || state.errors?.editorialTitle ? (
                <p className="form-error" role="alert">
                  {fieldErrors.editorialTitle || state.errors?.editorialTitle}
                </p>
              ) : null}
              <div className="field-meta">
                <span>Heading above the article</span>
                <CharacterCounter
                  current={draft.editorialTitle.length}
                  maximum={200}
                />
              </div>
            </div>
            <div className="form-group">
              <TextArea
                defaultValue={initialData.editorialLead}
                id="clients-editorial-lead"
                label="Article intro summary"
                maxLength={1000}
                name="editorialLead"
                required
                rows={3}
                aria-invalid={Boolean(
                  fieldErrors.editorialLead || state.errors?.editorialLead,
                )}
              />
              {fieldErrors.editorialLead || state.errors?.editorialLead ? (
                <p className="form-error" role="alert">
                  {fieldErrors.editorialLead || state.errors?.editorialLead}
                </p>
              ) : null}
              <div className="field-meta">
                <span>Introductory paragraph</span>
                <CharacterCounter
                  current={draft.editorialLead.length}
                  maximum={1000}
                />
              </div>
            </div>
          </SectionCard>

          {CLIENTS_COPY_SECTIONS.slice(1).map((section) => (
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
            description="Optional search result and social sharing overrides."
            eyebrow="Search appearance"
            icon="search"
            id="clients-seo"
            summary={draft.seoTitle.trim() || 'Search title uses page title'}
            title="SEO and social metadata"
          >
            <div className="content-form__field-grid">
              <div className="form-group">
                <Input
                  defaultValue={initialData.seoTitle}
                  id="clients-seo-title"
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
                  id="clients-seo-description"
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
                  id="clients-og-image"
                  label="Social image URL"
                  name="ogImageUrl"
                />
                <MediaPicker
                  inputId="clients-og-image"
                  value={draft.ogImageUrl}
                />
              </div>
              <div className="form-group">
                <Input
                  defaultValue={initialData.canonicalUrl}
                  id="clients-canonical-url"
                  label="Canonical URL override"
                  name="canonicalUrl"
                />
              </div>
            </div>
            <SearchSnippetPreview
              description={draft.seoDescription || draft.summary}
              title={draft.seoTitle || draft.title}
              url={draft.canonicalUrl || '/clients'}
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
              new CustomEvent('opg-editor-retry', {
                detail: { tab: 'clients' },
              }),
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
              : (initialData.publishedAt ?? null)
          }
          publishedUrl="/clients"
          updatedAt={state.updatedAt ?? initialData.updatedAt}
        />
      </div>
    </form>
  )
}
