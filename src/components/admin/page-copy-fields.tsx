'use client'

import { SectionCard } from '@/components/admin/page-editor-ui'
import { Input, TextArea } from '@/components/ui/form-controls'
import type { CopySection } from '@/lib/content/page-copy'

export function PageCopyFields({
  section,
  initial,
  draft,
  errors,
}: {
  section: CopySection
  initial: Record<string, string>
  draft: Record<string, string>
  errors: Record<string, string>
}) {
  const complete = section.fields.every((field) => draft[field.key]?.trim())
  return (
    <SectionCard
      complete={complete}
      description={section.description}
      eyebrow="Page content"
      icon="content"
      id={section.id}
      errorCount={section.fields.filter((field) => errors[field.key]).length}
      summary={`${section.fields.filter((field) => draft[field.key]?.trim()).length} of ${section.fields.length} fields completed`}
      title={section.title}
    >
      <div className="content-form__field-grid">
        {section.fields.map((field) => {
          const maxLength =
            field.key === 'heroTitle' || field.key === 'pageTitle'
              ? 200
              : field.key === 'heroLead' || field.key === 'collectionLead'
                ? 500
                : 5000
          return (
            <div className="form-group" key={field.key}>
              {field.multiline ? (
                <TextArea
                  defaultValue={initial[field.key]}
                  id={`${section.id}-${field.key}`}
                  label={field.label}
                  maxLength={maxLength}
                  name={field.key}
                  required
                  rows={3}
                />
              ) : (
                <Input
                  defaultValue={initial[field.key]}
                  id={`${section.id}-${field.key}`}
                  label={field.label}
                  maxLength={maxLength}
                  name={field.key}
                  required
                  type={field.key.endsWith('Email') ? 'email' : 'text'}
                />
              )}
              {errors[field.key] ? (
                <p className="form-error" role="alert">
                  {errors[field.key]}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
