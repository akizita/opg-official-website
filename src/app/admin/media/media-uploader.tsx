'use client'

import { useRef, useState, useTransition } from 'react'

import { uploadMediaAction, type UploadMediaResult } from '@/app/admin/media/actions'

export function MediaUploader({ onUploaded }: { onUploaded?: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<UploadMediaResult | null>(null)
  const [copied, setCopied] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setResult(null)

    if (file) {
      const objUrl = URL.createObjectURL(file)
      setPreviewUrl(objUrl)
    } else {
      setPreviewUrl(null)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResult(null)

    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const res = await uploadMediaAction(formData)
        setResult(res)
        if (res.success) {
          formRef.current?.reset()
          setSelectedFile(null)
          setPreviewUrl(null)
          if (onUploaded) onUploaded()
        }
      } catch {
        setResult({
          success: false,
          error: 'A network error occurred while uploading. Please try again.',
        })
      }
    })
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ marginBottom: '2.5rem' }}>
      <p className="eyebrow">Asset Storage</p>
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Upload New Image</h2>
      <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        Store image assets for articles, team profiles, client logos, and site hero sections. Supported
        formats: JPEG, PNG, WebP, AVIF, SVG (max 5 MB).
      </p>

      {result?.error && (
        <div className="alert-banner alert-banner--error" role="alert">
          <p>{result.error}</p>
        </div>
      )}

      {result?.success && result.url && (
        <div className="notice notice--success" role="status" style={{ marginBottom: '1.5rem' }}>
          <div className="notice__icon">✓</div>
          <div className="notice__content">
            <p className="notice__title">Image uploaded successfully!</p>
            <p className="notice__body">
              URL: <code>{result.url}</code>
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              <button
                className="button button--secondary"
                onClick={() => handleCopy(result.url!)}
                style={{ minHeight: '2.25rem', padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                type="button"
              >
                {copied ? '✓ Copied URL!' : '📋 Copy Image URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="contact-form" noValidate onSubmit={handleSubmit} ref={formRef}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="form-field">
            <label htmlFor="media-category">
              Target Category <span className="field-required">*</span>
            </label>
            <select
              defaultValue="general"
              id="media-category"
              name="category"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-small)',
                minHeight: '2.75rem',
                padding: 'var(--space-3)',
                background: 'var(--color-surface)',
              }}
            >
              <option value="general">General Asset</option>
              <option value="team">Team Member Photos</option>
              <option value="articles">Article Cover & In-line Images</option>
              <option value="logos">Client & Partner Logos</option>
              <option value="hero">Hero & Institutional Banners</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="media-alt">
              Alternative Text (Alt text) <span className="field-required">*</span>
            </label>
            <input
              disabled={isPending}
              id="media-alt"
              maxLength={150}
              name="altText"
              placeholder="e.g. Eleanor Vance presenting at global summit"
              required
              type="text"
            />
            <span className="field-hint">Accurate descriptive text for accessibility & SEO.</span>
          </div>
        </div>

        <div className="form-field" style={{ marginTop: '0.5rem' }}>
          <label htmlFor="media-file">
            Image File <span className="field-required">*</span>
          </label>
          <input
            accept=".jpg,.jpeg,.png,.webp,.avif,.svg,image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
            disabled={isPending}
            id="media-file"
            name="file"
            onChange={handleFileChange}
            required
            type="file"
          />
        </div>

        {previewUrl && (
          <div style={{ marginBlock: '1rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Preview:
            </p>
            <div
              style={{
                maxWidth: '280px',
                borderRadius: 'var(--radius-small)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                background: '#f8fafc',
                padding: '0.5rem',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Selected preview"
                src={previewUrl}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <button
            className="button button--primary"
            disabled={isPending || !selectedFile}
            type="submit"
          >
            {isPending ? 'Uploading...' : 'Upload Image to Storage'}
          </button>
        </div>
      </form>
    </div>
  )
}

