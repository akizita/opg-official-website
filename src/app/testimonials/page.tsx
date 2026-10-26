import type { Metadata } from 'next'

import { CandidateTestimonialsExperience } from '@/app/testimonials/testimonials-experience'
import { getApprovedCandidateTestimonials } from '@/lib/content/candidate-testimonials'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Candidate Testimonials',
  description:
    'Read stories from candidates who connected with Outsourced Pro Global, or share your own experience for review.',
  alternates: { canonical: new URL('/testimonials', getSiteUrl()).toString() },
  robots: { index: isSiteIndexable(), follow: isSiteIndexable() },
  openGraph: {
    title: `Candidate Testimonials | ${siteConfig.shortName}`,
    description:
      'Real candidate perspectives on opportunities and experiences with Outsourced Pro Global.',
    url: new URL('/testimonials', getSiteUrl()).toString(),
    type: 'website',
  },
}

export default async function TestimonialsPage() {
  const testimonials = await getApprovedCandidateTestimonials()

  return <CandidateTestimonialsExperience testimonials={testimonials} />
}
