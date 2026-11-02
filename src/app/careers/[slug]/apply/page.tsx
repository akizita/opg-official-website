import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { CareerApplicationForm } from '@/app/careers/[slug]/apply/application-form'
import { Notice } from '@/components/ui/notice'
import { getCareerJobBySlug, getCareerQuestions } from '@/lib/jazzhr/client'
import { siteConfig } from '@/lib/site-config'

export const revalidate = 900

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
  if (job.slug !== slug) permanentRedirect(job.applyPath)

  const questions = await getCareerQuestions(job)

  return (
    <main id="main-content" className="career-application-page">
      <section className="career-application-hero">
        <div className="container career-application-hero__inner">
          <nav aria-label="Breadcrumbs" className="breadcrumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/careers">Careers</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/careers/${job.slug}`}>{job.title}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Apply</span>
          </nav>
          <p className="careers-eyebrow">Application</p>
          <h1>Apply for {job.title}</h1>
          <p>
            {job.department ? `${job.department} · ` : ''}
            {job.location} · {job.employmentTypeLabel}
          </p>
        </div>
      </section>

      <section className="container career-application-layout">
        <div className="career-application-layout__main">
          <CareerApplicationForm
            jobSlug={job.slug}
            jobTitle={job.title}
            questions={questions}
          />
        </div>
        <aside className="career-application-layout__aside">
          <div>
            <h2>Before you submit</h2>
            <ul>
              <li>Use an email address you check regularly.</li>
              <li>Attach your current résumé.</li>
              <li>Review every required answer for accuracy.</li>
            </ul>
            <Link href={`/careers/${job.slug}`}>← Review role details</Link>
          </div>
          <Notice title="Recruitment safety" variant="info">
            OPG never charges applicants recruitment fees or asks candidates to
            transfer money.
          </Notice>
        </aside>
      </section>
    </main>
  )
}
