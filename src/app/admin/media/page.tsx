import type { Metadata } from 'next'
import Link from 'next/link'

import { MediaItemCard } from '@/app/admin/media/media-item-card'
import { MediaUploader } from '@/app/admin/media/media-uploader'
import { EmptyState } from '@/components/ui/empty-state'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canManageMedia } from '@/lib/auth/permissions'
import { getMediaAssets } from '@/lib/content/media'

export const metadata: Metadata = {
  title: 'Media Assets & Storage | OPG Admin',
}

type MediaPageProps = {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function AdminMediaPage({ searchParams }: MediaPageProps) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageMedia(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have
            permission to manage media assets.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const { category } = await searchParams
  const activeCategory = category || 'all'

  const assets = await getMediaAssets(
    activeCategory === 'all' ? undefined : activeCategory,
  )

  const categories = [
    { label: 'All Media', value: 'all' },
    { label: 'Hero & Banners', value: 'hero' },
    { label: 'Team Photos', value: 'team' },
    { label: 'Article Covers', value: 'articles' },
    { label: 'Client Logos', value: 'logos' },
    { label: 'General', value: 'general' },
  ]

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Media & Assets</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Asset Management</p>
            <h1>Media Storage & Assets</h1>
            <p>
              Upload and manage photographic assets, corporate logos, and
              article illustrations.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Upload Form */}
        <div style={{ marginTop: '2rem' }}>
          <MediaUploader />
        </div>

        {/* Category Filters */}
        <div className="articles-filter-nav" style={{ marginTop: '2rem' }}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.value
            return (
              <Link
                className={`articles-filter-chip ${
                  isSelected ? 'articles-filter-chip--active' : ''
                }`}
                href={
                  cat.value === 'all'
                    ? '/admin/media'
                    : `/admin/media?category=${cat.value}`
                }
                key={cat.value}
              >
                {cat.label}
              </Link>
            )
          })}
        </div>

        {/* Media Gallery */}
        <div style={{ marginTop: '2rem' }}>
          {assets.length > 0 ? (
            <div className="card-grid">
              {assets.map((asset) => (
                <MediaItemCard asset={asset} key={asset.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              description="No media assets have been uploaded in this category yet. Use the uploader above to store images."
              title="No Images Found"
            />
          )}
        </div>
      </div>
    </section>
  )
}
