'use client'

import { useState } from 'react'

import { Card } from '@/components/ui/card'
import type { MediaAsset } from '@/lib/content/media'

export function MediaItemCard({ asset }: { asset: MediaAsset }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(asset.public_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sizeKb = Math.round(asset.size_bytes / 1024)
  const sizeLabel = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`

  return (
    <Card eyebrow={`Category: ${asset.category} · ${sizeLabel}`}>
      <div
        style={{
          width: '100%',
          height: '180px',
          background: '#f1f5f9',
          borderRadius: 'var(--radius-small)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={asset.alt_text || asset.file_name}
          src={asset.public_url}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>

      <h3 style={{ fontSize: '1.05rem', wordBreak: 'break-all', marginBottom: '0.25rem' }}>
        {asset.file_name}
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', marginBottom: '0.75rem' }}>
        Alt: {asset.alt_text ? `"${asset.alt_text}"` : 'None specified'}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          className="button button--secondary"
          onClick={handleCopy}
          style={{ minHeight: '2.25rem', padding: '0.25rem 0.75rem', fontSize: '0.82rem' }}
          type="button"
        >
          {copied ? '✓ Copied!' : '📋 Copy URL'}
        </button>
        <a
          className="button-link button-link--secondary"
          href={asset.public_url}
          rel="noreferrer"
          style={{ minHeight: '2.25rem', padding: '0.25rem 0.75rem', fontSize: '0.82rem' }}
          target="_blank"
        >
          Open ↗
        </a>
      </div>
    </Card>
  )
}

