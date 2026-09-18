import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import type { Client, Testimonial } from '@/lib/content/clients'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Manage Clients & Social Proof | OPG Admin',
}

export default async function AdminClientsPage() {
  await requireAdminSession({ requireAal2: true })

  const supabase = await createClient()
  const [{ data: clients }, { data: testimonials }] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true }),
  ])

  const clientList = (clients as Client[]) || []
  const testimonialList = (testimonials as Testimonial[]) || []

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Clients & Testimonials</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Content Workspace</p>
            <h1>Clients & Social Proof</h1>
            <p>
              Manage approved client organization badges, display permissions,
              and published testimonials.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Clients Section */}
        <div style={{ marginTop: '2.5rem' }}>
          <h2>Client Organizations ({clientList.length})</h2>
          <div className="card-grid" style={{ marginTop: '1rem' }}>
            {clientList.map((client) => (
              <Card
                eyebrow={`Order ${client.display_order}`}
                key={client.id}
                title={client.name}
              >
                <p>
                  Status:{' '}
                  <strong>
                    {client.is_visible ? 'Visible on site' : 'Hidden'}
                  </strong>
                </p>
                {client.website_url && (
                  <p>
                    <a
                      className="text-link"
                      href={client.website_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {client.website_url} ↗
                    </a>
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div style={{ marginTop: '3rem' }}>
          <h2>Client Testimonials ({testimonialList.length})</h2>
          <div className="card-grid" style={{ marginTop: '1rem' }}>
            {testimonialList.map((item) => (
              <Card
                eyebrow={item.author_company || 'Client Partner'}
                key={item.id}
                title={`${item.author_name} (${item.author_role})`}
              >
                <blockquote className="testimonial-quote">
                  <p>&ldquo;{item.quote}&rdquo;</p>
                </blockquote>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <StatusBadge status={item.status} />
                  {item.consent_reference && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-ink-soft)',
                      }}
                    >
                      Ref: {item.consent_reference}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
