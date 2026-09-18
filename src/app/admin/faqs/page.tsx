import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Manage FAQs | OPG Admin',
}

type FaqRow = {
  id: string
  question: string
  answer: string
  audience: string
  display_order: number
  is_published: boolean
  category?: { name: string } | null
}

export default async function AdminFaqsPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have permission to view FAQs.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const supabase = await createClient()
  const { data: faqs } = await supabase
    .from('faqs')
    .select(`
      id,
      question,
      answer,
      audience,
      display_order,
      is_published,
      category:faq_categories(name)
    `)
    .order('display_order', { ascending: true })

  const faqList = (faqs as unknown as FaqRow[]) || []

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">FAQs</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Knowledge Base</p>
            <h1>Frequently Asked Questions</h1>
            <p>
              Manage public FAQ categories, client/talent audience separation, and display hierarchy.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        <div className="admin-services-list" style={{ marginTop: '2rem' }}>
          {faqList.length > 0 ? (
            <div className="card-grid">
              {faqList.map((faq) => (
                <Card
                  eyebrow={`${faq.category?.name || 'General'} · Audience: ${faq.audience} · Order ${faq.display_order}`}
                  key={faq.id}
                  title={faq.question}
                >
                  <p style={{ lineHeight: '1.6' }}>{faq.answer}</p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <StatusBadge status={faq.is_published ? 'published' : 'draft'} />
                    <Link
                      className="button-link button-link--secondary"
                      href="/faqs"
                      target="_blank"
                    >
                      View on FAQs Page ↗
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              description="No FAQs have been configured yet."
              title="No FAQs Found"
            />
          )}
        </div>
      </div>
    </section>
  )
}

