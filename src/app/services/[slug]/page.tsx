import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { Notice } from '@/components/ui/notice'
import { RichText } from '@/components/ui/rich-text'
import { getAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { getPublishedServices, getServiceBySlug } from '@/lib/content/services'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

type ServiceDetailProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const staticClient = createStaticClient()
  const services = await getPublishedServices(staticClient)
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: ServiceDetailProps): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceBySlug(slug)

  if (!service) {
    return { robots: { index: false, follow: false } }
  }

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/services/${slug}`, siteUrl).toString()

  const title = service.seo_title
    ? service.seo_title
    : `${service.title} | ${siteConfig.shortName}`

  const description = service.seo_description || service.summary
  const isPublished = service.status === 'published'
  const indexable = isSiteIndexable() && isPublished

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: siteConfig.name,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: indexable,
      follow: indexable,
    },
  }
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailProps) {
  const { slug } = await params
  const [service, session] = await Promise.all([
    getServiceBySlug(slug),
    getAdminSession(),
  ])

  const hasStaffAccess = session
    ? canViewContent(session.profile.roleKey)
    : false
  const isPublished = service?.status === 'published'

  if (!service || (!isPublished && !hasStaffAccess)) {
    notFound()
  }

  return (
    <main className="service-detail-page">
      <div className="container">
        {/* Staff Preview Banner */}
        {!isPublished && hasStaffAccess && (
          <Notice
            className="service-preview-notice"
            title="Internal Preview Mode"
            variant="warning"
          >
            You are viewing this service in staff preview mode. Status:{' '}
            <strong>{service.status}</strong>.
          </Notice>
        )}

        {/* Accessible Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/services">Services</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{service.title}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="service-hero">
          <p className="eyebrow">Service Detail</p>
          <h1 className="service-hero__title">{service.title}</h1>
          <p className="service-hero__lead">{service.summary}</p>
        </header>

        {/* Body Content */}
        <section aria-label="Detailed Description" className="service-body">
          <RichText content={service.content} />
        </section>

        {/* Action & Conversion Card */}
        <section aria-label="Engagement Consultation" className="service-cta">
          <Card
            className="service-cta-card"
            eyebrow="Direct Inquiry"
            title={`Ready to Implement ${service.title}?`}
          >
            <p>
              Connect with our workforce architects to establish talent
              specifications, required seniority levels, and target onboarding
              dates.
            </p>
            <div className="button-row">
              <ButtonLink href="/contact" variant="primary">
                {service.cta_text || 'Inquire About This Service'}
              </ButtonLink>
              <ButtonLink href="/services" variant="secondary">
                ← Back to All Services
              </ButtonLink>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
