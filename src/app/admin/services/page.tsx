import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import type { Service } from '@/lib/content/services'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Manage Services | OPG Admin',
}

export default async function AdminServicesPage() {
  await requireAdminSession({ requireAal2: true })

  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true })

  const serviceList = (services as Service[]) || []

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Services</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Content Workspace</p>
            <h1>Services Catalog</h1>
            <p>
              Manage public service offerings, delivery models, and order of
              display.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        <div className="admin-services-list" style={{ marginTop: '2rem' }}>
          {serviceList.length > 0 ? (
            <div className="card-grid">
              {serviceList.map((service) => (
                <Card
                  eyebrow={`Order ${service.display_order} · /services/${service.slug}`}
                  key={service.id}
                  title={service.title}
                >
                  <p>{service.summary}</p>
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
                    <StatusBadge status={service.status} />
                    <Link
                      className="button-link button-link--secondary"
                      href={`/services/${service.slug}`}
                      target="_blank"
                    >
                      View Live ↗
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              description="No services have been configured yet."
              title="No Services Found"
            />
          )}
        </div>
      </div>
    </section>
  )
}

