import type { Metadata } from 'next'
import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getPublishedFaqsByCategory } from '@/lib/content/faqs'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600 // 1 hour ISR

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/faqs', siteUrl).toString()

  return {
    title: `Frequently Asked Questions | ${siteConfig.shortName}`,
    description:
      'Answers to common questions regarding dedicated remote teams, global hiring models, data confidentiality, contracts, and onboarding timelines.',
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
    openGraph: {
      title: `FAQs | ${siteConfig.name}`,
      description:
        'Common questions about talent models, compliance, contracts, and onboarding.',
      url: pageUrl,
      type: 'website',
    },
  }
}

export default async function FaqsPage() {
  const categories = await getPublishedFaqsByCategory()
  const totalFaqs = categories.reduce((sum, cat) => sum + cat.faqs.length, 0)

  return (
    <main id="main-content" className="faqs-page container">
      <header className="faqs-hero">
        <h1 className="faqs-hero__title">Frequently Asked Questions</h1>
        <p className="faqs-hero__lead">
          Everything you need to know about our engagement models, security
          standards, recruitment timelines, and ongoing operations.
        </p>
      </header>

      {totalFaqs === 0 ? (
        <EmptyState
          title="FAQs under preparation"
          message="Our team is compiling frequently asked questions. For immediate inquiries, please reach out directly."
        />
      ) : (
        <div className="faqs-container">
          {categories
            .filter((category) => category.faqs.length > 0)
            .map((category) => (
              <section
                key={category.id}
                className="faq-category-section"
                aria-labelledby={`cat-${category.slug}`}
              >
                <h2 id={`cat-${category.slug}`} className="faq-category-title">
                  {category.name}
                </h2>

                <div className="faq-accordion-group">
                  {category.faqs.map((faq) => (
                    <details key={faq.id} className="faq-item">
                      <summary className="faq-question">
                        <span>{faq.question}</span>
                        <span className="faq-toggle-icon" aria-hidden="true">
                          +
                        </span>
                      </summary>
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      <footer className="faqs-footer" style={{ marginTop: '4rem' }}>
        <Card className="spotlight-card">
          <div>
            <h2>Have a question not covered here?</h2>
            <p>
              Our client advisory team is ready to answer specific technical,
              contractual, or operational questions.
            </p>
          </div>
          <div className="button-row">
            <ButtonLink href="/contact" variant="primary">
              Contact Our Advisory Team
            </ButtonLink>
            <ButtonLink href="/search" variant="secondary">
              Search All Site Content
            </ButtonLink>
          </div>
        </Card>
      </footer>
    </main>
  )
}

