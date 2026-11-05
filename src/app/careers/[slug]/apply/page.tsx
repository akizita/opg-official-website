import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { getCareerJobBySlug } from '@/lib/jazzhr/client'
import { siteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ApplyPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ApplyPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await getCareerJobBySlug(slug)
  if (!job) return { robots: { follow: false, index: false } }

  return {
    description: `Submit your application for ${job.title} at ${siteConfig.name}.`,
    robots: { follow: false, index: false },
    title: `Apply for ${job.title} | ${siteConfig.shortName}`,
  }
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { slug } = await params
  const job = await getCareerJobBySlug(slug)
  if (!job) notFound()

  // The application form is integrated directly on the role details page
  permanentRedirect(`/careers/${job.slug}#apply`)
}
