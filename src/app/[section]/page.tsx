import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  getPlaceholderSection,
  placeholderSections,
} from '@/lib/placeholder-sections'

type SectionProps = { params: Promise<{ section: string }> }

export function generateStaticParams() {
  return placeholderSections.map(({ slug }) => ({ section: slug }))
}

export async function generateMetadata({
  params,
}: SectionProps): Promise<Metadata> {
  const { section } = await params
  const content = getPlaceholderSection(section)

  if (!content) return { robots: { index: false, follow: false } }

  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false },
  }
}

export default async function PlaceholderPage({ params }: SectionProps) {
  const { section } = await params
  const content = getPlaceholderSection(section)

  if (!content) notFound()

  return (
    <div className="container status-page">
      <p className="eyebrow">{content.audience} · In development</p>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <p>
        This is a non-indexable structure preview, not an approved public page
        or a working conversion flow.
      </p>
      <Link className="button-link button-link--secondary" href="/">
        Return home
      </Link>
    </div>
  )
}
