import type { Metadata } from 'next'
import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { RichText } from '@/components/ui/rich-text'
import { getAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import type { PageDocument } from '@/lib/content/page-documents'
import { getActiveDepartmentsWithMembers } from '@/lib/content/team'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('page_documents')
    .select(
      'title, summary, seo_title, seo_description, canonical_url, og_image_url, status',
    )
    .eq('slug', 'about')
    .maybeSingle<PageDocument>()

  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/about', siteUrl).toString()

  const title = doc?.seo_title
    ? doc.seo_title
    : doc?.title
      ? `${doc.title} | ${siteConfig.shortName}`
      : `About Us | ${siteConfig.shortName}`

  const description =
    doc?.seo_description ||
    doc?.summary ||
    'Learn about Outsourced Pro Global, our leadership, departments, and cross-border talent capabilities.'

  const isPublished = doc?.status === 'published'
  const indexable = isSiteIndexable() && isPublished

  return {
    title,
    description,
    alternates: {
      canonical: doc?.canonical_url || pageUrl,
    },
    openGraph: {
      title,
      description,
      url: doc?.canonical_url || pageUrl,
      siteName: siteConfig.name,
      type: 'website',
      images: doc?.og_image_url ? [{ url: doc.og_image_url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: doc?.og_image_url ? [doc.og_image_url] : undefined,
    },
    robots: {
      index: indexable,
      follow: indexable,
    },
  }
}

export default async function AboutPage() {
  const supabase = await createClient()
  const session = await getAdminSession()

  const [{ data: doc }, departments] = await Promise.all([
    supabase
      .from('page_documents')
      .select('*')
      .eq('slug', 'about')
      .maybeSingle<PageDocument>(),
    getActiveDepartmentsWithMembers(),
  ])

  const hasStaffAccess = session
    ? canViewContent(session.profile.roleKey)
    : false
  const isPublished = doc?.status === 'published'

  if (!doc || (!isPublished && !hasStaffAccess)) {
    return (
      <main className="container status-page">
        <EmptyState
          action={<ButtonLink href="/">Return to Homepage</ButtonLink>}
          description="The official About Us statement is being prepared and will be published shortly."
          title="About OPG Coming Soon"
        />
      </main>
    )
  }

  return (
    <main className="about-page">
      <div className="container">
        {/* Staff Preview Banner */}
        {!isPublished && hasStaffAccess && (
          <Notice
            className="about-preview-notice"
            title="Internal Preview Mode"
            variant="warning"
          >
            You are viewing the About page in staff preview mode. Status:{' '}
            <strong>{doc.status}</strong> (v{doc.version}).
          </Notice>
        )}

        {/* Accessible Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">About</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="about-hero">
          <p className="eyebrow">Who We Are</p>
          <h1 className="about-hero__title">{doc.title}</h1>
          {doc.summary && <p className="about-hero__lead">{doc.summary}</p>}
        </header>

        {/* Narrative & Capabilities */}
        <section aria-label="Company Overview" className="about-story">
          <RichText content={doc.content} />
        </section>

        {/* Mission & Vision Spotlight Card */}
        <section aria-label="Our Purpose" className="about-purpose-spotlight">
          <div className="spotlight-card">
            <div>
              <p className="eyebrow">Purpose & Principles</p>
              <h2>Guided by Our Mission & Vision</h2>
              <p>
                We believe exceptional remote work thrives on mutual trust,
                rigorous accountability, and sustainable partnerships across
                time zones.
              </p>
            </div>
            <div>
              <ButtonLink href="/mission-and-vision" variant="primary">
                Read Mission & Vision →
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* Leadership & Departments Showcase */}
        {departments.length > 0 && (
          <section aria-label="Leadership and Team" className="about-team">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Our People</p>
                <h2>Leadership & Specialized Departments</h2>
              </div>
              <ButtonLink href="/careers" variant="secondary">
                Join Our Team
              </ButtonLink>
            </div>

            <div className="departments-list">
              {departments.map((dept) => (
                <div className="department-group" key={dept.id}>
                  <h3 className="department-group__title">{dept.name}</h3>
                  {dept.members.length > 0 ? (
                    <div className="team-grid">
                      {dept.members.map((member) => (
                        <Card
                          className="team-card"
                          eyebrow={member.position}
                          key={member.id}
                          title={member.full_name}
                        >
                          {member.photo_url && (
                            <div className="team-card__avatar">
                              <ResponsiveImage
                                alt={`${member.full_name}, ${member.position}`}
                                height={120}
                                src={member.photo_url}
                                width={120}
                              />
                            </div>
                          )}
                          {member.bio && (
                            <p className="team-card__bio">{member.bio}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="department-group__empty">
                      Specialists in this group work directly within client
                      engagements.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strategic Conversion CTA */}
        <section aria-label="Next Steps" className="about-cta">
          <div className="final-cta">
            <div>
              <p className="eyebrow">Work With Outsourced Pro Global</p>
              <h2>Experience the Difference Exceptional Talent Makes</h2>
            </div>
            <div className="button-row">
              <ButtonLink href="/contact" variant="primary">
                Partner With Us
              </ButtonLink>
              <ButtonLink href="/services" variant="secondary">
                Explore Services
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
