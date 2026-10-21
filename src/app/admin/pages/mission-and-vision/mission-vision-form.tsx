'use client'

import { useActionState, useEffect, useState } from 'react'

import {
  type MissionVisionActionState,
  saveMissionVisionAction,
} from '@/app/admin/pages/mission-and-vision/actions'
import {
  CharacterCounter,
  InheritedSections,
  MediaPicker,
  PageEditorActions,
  PageSectionNavigator,
  PageDetailsCard,
  PageEditorToast,
  SearchSnippetPreview,
  SectionCard,
} from '@/components/admin/page-editor-ui'
import { usePageEditorForm } from '@/components/admin/use-page-editor-form'
import { Input, TextArea } from '@/components/ui/form-controls'
import { Notice } from '@/components/ui/notice'
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
    updatedAt: string | null
    editorName: string
    currentEditorName?: string
    hasSavedDraft: boolean
    publishedAt?: string | null
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
  const [purposeTab, setPurposeTab] = useState<'mission' | 'vision'>('mission')

  useEffect(() => {
    const revealPurpose = (event: Event) => {
      const targetId = (event as CustomEvent<{ targetId: string }>).detail
        ?.targetId
      if (targetId?.startsWith('home-mission')) setPurposeTab('mission')
      if (targetId?.startsWith('home-vision')) setPurposeTab('vision')
    }
    window.addEventListener('opg-editor-reveal', revealPurpose)
    return () => window.removeEventListener('opg-editor-reveal', revealPurpose)
  }, [])
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
      calloutText: initialData.calloutText,
      calloutVariant: initialData.calloutVariant,
      canonicalUrl: initialData.canonicalUrl,
      missionBody: initialData.missionBody,
      missionTitle: initialData.missionTitle,
      ogImageUrl: initialData.ogImageUrl,
      seoDescription: initialData.seoDescription,
      seoTitle: initialData.seoTitle,
      summary: initialData.summary,
      title: initialData.title,
      visionBody: initialData.visionBody,
      visionTitle: initialData.visionTitle,
    },
    result: state,
    status: currentStatus,
    tab: 'home',
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
          page="home"
          sections={[
            {
              id: 'home-hero',
              label: 'Hero',
              status:
                fieldErrors.title || fieldErrors.summary
                  ? 'error'
                  : draft.title.trim()
                    ? 'complete'
                    : 'incomplete',
            },
            {
              id: 'home-purpose',
              label: 'Mission & vision',
              status:
                fieldErrors.missionBody || fieldErrors.visionBody
                  ? 'error'
                  : draft.missionBody.trim() && draft.visionBody.trim()
                    ? 'complete'
                    : 'incomplete',
            },
            {
              id: 'home-inherited',
              label: 'Managed elsewhere',
              status: 'optional',
            },
            {
              id: 'home-values',
              label: 'Core values',
              status: draft.calloutText.trim() ? 'complete' : 'optional',
            },
            {
              id: 'home-seo',
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
            description="Edit the title and summary stored by the current page document."
            eyebrow="Page content"
            icon="essentials"
            id="home-hero"
            errorCount={
              Number(Boolean(fieldErrors.title || state.errors?.title)) +
              Number(Boolean(fieldErrors.summary || state.errors?.summary))
            }
            summary={draft.title.trim() || 'Add a page title'}
            title="Hero"
          >
            <div className="form-group">
              <Input
                aria-invalid={Boolean(fieldErrors.title || state.errors?.title)}
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
                <span>Primary heading shown on the public page</span>
                <CharacterCounter current={draft.title.length} maximum={200} />
              </div>
            </div>

            <div className="form-group">
              <TextArea
                aria-invalid={Boolean(
                  fieldErrors.summary || state.errors?.summary,
                )}
                defaultValue={initialData.summary}
                id="home-summary"
                label="Intro summary"
                maxLength={500}
                name="summary"
                rows={3}
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

          <SectionCard
            complete={Boolean(
              draft.missionBody.trim() && draft.visionBody.trim(),
            )}
            description="Define the formal mission and vision declarations."
            eyebrow="Page content"
            icon="content"
            id="home-purpose"
            errorCount={
              Number(
                Boolean(fieldErrors.missionBody || state.errors?.missionBody),
              ) +
              Number(
                Boolean(fieldErrors.visionBody || state.errors?.visionBody),
              )
            }
            summary={
              draft.missionBody.trim() && draft.visionBody.trim()
                ? 'Mission and vision added'
                : `${Number(!draft.missionBody.trim()) + Number(!draft.visionBody.trim())} fields missing`
            }
            title="Mission and vision"
          >
            <div
              aria-label="Mission and vision editor"
              className="cms-purpose-tabs"
              role="tablist"
            >
              {(['mission', 'vision'] as const).map((tab) => (
                <button
                  aria-controls={`home-${tab}-panel`}
                  aria-selected={purposeTab === tab}
                  id={`home-${tab}-tab`}
                  key={tab}
                  onClick={() => setPurposeTab(tab)}
                  onKeyDown={(event) => {
                    if (
                      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                        event.key,
                      )
                    )
                      return
                    event.preventDefault()
                    const next =
                      event.key === 'Home'
                        ? 'mission'
                        : event.key === 'End'
                          ? 'vision'
                          : purposeTab === 'mission'
                            ? 'vision'
                            : 'mission'
                    setPurposeTab(next)
                    document.getElementById(`home-${next}-tab`)?.focus()
                  }}
                  role="tab"
                  tabIndex={purposeTab === tab ? 0 : -1}
                  type="button"
                >
                  {tab === 'mission' ? 'Mission' : 'Vision'}
                  <span>
                    {tab === 'mission'
                      ? draft.missionBody.trim()
                        ? 'Complete'
                        : 'Needs content'
                      : draft.visionBody.trim()
                        ? 'Complete'
                        : 'Needs content'}
                  </span>
                </button>
              ))}
            </div>
            <div
              className="cms-purpose-panel"
              hidden={purposeTab !== 'mission'}
              id="home-mission-panel"
              role="tabpanel"
              aria-labelledby="home-mission-tab"
            >
              <div className="content-form__column">
                <h3>Mission declaration</h3>
                <div className="form-group">
                  <Input
                    defaultValue={initialData.missionTitle}
                    id="home-missionTitle"
                    label="Mission heading"
                    name="missionTitle"
                  />
                </div>
                <div className="form-group">
                  <TextArea
                    defaultValue={initialData.missionBody}
                    id="home-missionBody"
                    label="Mission statement"
                    aria-invalid={Boolean(
                      fieldErrors.missionBody || state.errors?.missionBody,
                    )}
                    name="missionBody"
                    required={purposeTab === 'mission'}
                    rows={3}
                  />
                  {fieldErrors.missionBody || state.errors?.missionBody ? (
                    <p className="form-error" role="alert">
                      {fieldErrors.missionBody || state.errors?.missionBody}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div
              className="cms-purpose-panel"
              hidden={purposeTab !== 'vision'}
              id="home-vision-panel"
              role="tabpanel"
              aria-labelledby="home-vision-tab"
            >
              <div className="content-form__column">
                <h3>Vision declaration</h3>
                <div className="form-group">
                  <Input
                    defaultValue={initialData.visionTitle}
                    id="home-visionTitle"
                    label="Vision heading"
                    name="visionTitle"
                  />
                </div>
                <div className="form-group">
                  <TextArea
                    defaultValue={initialData.visionBody}
                    id="home-visionBody"
                    label="Vision statement"
                    aria-invalid={Boolean(
                      fieldErrors.visionBody || state.errors?.visionBody,
                    )}
                    name="visionBody"
                    required={purposeTab === 'vision'}
                    rows={3}
                  />
                  {fieldErrors.visionBody || state.errors?.visionBody ? (
                    <p className="form-error" role="alert">
                      {fieldErrors.visionBody || state.errors?.visionBody}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </SectionCard>

          <InheritedSections
            id="home-inherited"
            sections={[
              'Key highlights and statistics',
              'About preview',
              'Global offshore network',
              'Client stories and testimonials',
              'Final call to action',
            ]}
          />

          <SectionCard
            complete={Boolean(draft.calloutText.trim())}
            description="Maintain the values callout stored with this page document."
            eyebrow="Optional content"
            icon="values"
            id="home-values"
            summary={draft.calloutText.trim() || 'No values highlight yet'}
            title="Core values and callout"
          >
            <div className="form-group">
              <TextArea
                defaultValue={initialData.calloutText}
                id="home-calloutText"
                label="Values highlight"
                name="calloutText"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="field" htmlFor="home-calloutVariant">
                <span>Highlight style</span>
                <select
                  defaultValue={initialData.calloutVariant}
                  id="home-calloutVariant"
                  name="calloutVariant"
                >
                  <option value="info">Info (Brand Accent)</option>
                  <option value="warning">Warning / Notice</option>
                </select>
              </label>
            </div>
          </SectionCard>

          <SectionCard
            complete={Boolean(
              draft.seoTitle.trim() && draft.seoDescription.trim(),
            )}
            description="Control optional search-result and social-sharing overrides."
            eyebrow="Optional content"
            icon="search"
            id="home-seo"
            summary={draft.seoTitle.trim() || 'Search title uses page title'}
            title="SEO and social metadata"
          >
            <div className="content-form__field-grid">
              <div className="form-group">
                <Input
                  defaultValue={initialData.seoTitle}
                  id="home-seoTitle"
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
                  id="home-seoDescription"
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
                  id="home-ogImageUrl"
                  label="Social image URL"
                  name="ogImageUrl"
                  placeholder="https://example.com/og-image.jpg or /images/..."
                />
                <MediaPicker
                  inputId="home-ogImageUrl"
                  value={draft.ogImageUrl}
                />
              </div>

              <div className="form-group">
                <Input
                  defaultValue={initialData.canonicalUrl}
                  id="home-canonicalUrl"
                  label="Canonical URL"
                  name="canonicalUrl"
                  placeholder="https://opglobal.com.hk/mission-and-vision"
                />
              </div>
            </div>
            <SearchSnippetPreview
              description={draft.seoDescription || draft.summary}
              title={draft.seoTitle || draft.title}
              url={draft.canonicalUrl || '/mission-and-vision'}
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
              new CustomEvent('opg-editor-retry', { detail: { tab: 'home' } }),
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
          publishedUrl="/mission-and-vision"
          updatedAt={state.updatedAt ?? initialData.updatedAt}
        />
      </div>
    </form>
  )
}
