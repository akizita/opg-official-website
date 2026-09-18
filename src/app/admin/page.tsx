import type { Metadata } from 'next'
import Link from 'next/link'

import { signOutAction } from '@/app/admin/actions'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import {
  canViewContent,
  canViewInquiries,
  canViewSubscribers,
} from '@/lib/auth/permissions'
import type { PageDocument } from '@/lib/content/page-documents'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Administration',
}

export default async function AdminPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  const supabase = await createClient()
  const [{ data: mvDoc }, { data: aboutDoc }] = await Promise.all([
    supabase
      .from('page_documents')
      .select('status, version, updated_at')
      .eq('slug', 'mission-and-vision')
      .maybeSingle<PageDocument>(),
    supabase
      .from('page_documents')
      .select('status, version, updated_at')
      .eq('slug', 'about')
      .maybeSingle<PageDocument>(),
  ])

  const hasContentAccess = canViewContent(profile.roleKey)
  const hasInquiryAccess = canViewInquiries(profile.roleKey)
  const hasSubscriberAccess = canViewSubscribers(profile.roleKey)

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Secure workspace</p>
            <h1>Welcome, {profile.displayName}</h1>
            <p>
              Signed in as {profile.email} · {profile.roleDisplayName}
            </p>
          </div>
          <form action={signOutAction}>
            <button className="button button--secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <div className="admin-grid">
          <Card eyebrow="Institutional Content" title="Pages & Documents">
            <p>
              Managed institutional pages and content declarations for the
              official website.
            </p>
            {hasContentAccess ? (
              <>
                <div className="admin-card__row">
                  <div>
                    <strong>Mission & Vision</strong>
                    <div className="admin-card__meta">
                      <StatusBadge status={mvDoc?.status ?? 'draft'} />
                      <span>v{mvDoc?.version ?? 1}</span>
                    </div>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/pages/mission-and-vision"
                  >
                    Edit Page →
                  </Link>
                </div>

                <div className="admin-card__row">
                  <div>
                    <strong>About Us</strong>
                    <div className="admin-card__meta">
                      <StatusBadge status={aboutDoc?.status ?? 'draft'} />
                      <span>v{aboutDoc?.version ?? 1}</span>
                    </div>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/pages/about"
                  >
                    Edit Page →
                  </Link>
                </div>
              </>
            ) : (
              <p className="form-help">
                Your role does not have content editing permissions.
              </p>
            )}
          </Card>

          <Card eyebrow="Catalog & Relationships" title="Services & Clients">
            <p>
              Manage public service offerings, client partner badges, and
              published testimonials.
            </p>
            {hasContentAccess ? (
              <>
                <div className="admin-card__row">
                  <div>
                    <strong>Services Catalog</strong>
                    <p className="field-hint">
                      Service descriptions and delivery models
                    </p>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/services"
                  >
                    Manage →
                  </Link>
                </div>

                <div className="admin-card__row">
                  <div>
                    <strong>Clients & Testimonials</strong>
                    <p className="field-hint">
                      Client organizations and endorsements
                    </p>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/clients"
                  >
                    Manage →
                  </Link>
                </div>
              </>
            ) : (
              <p className="form-help">
                Your role does not have content editing permissions.
              </p>
            )}
          </Card>

          <Card eyebrow="Publishing & Knowledge" title="Articles & FAQs">
            <p>
              Manage editorial publications, categories, tags, and verified
              frequently asked questions.
            </p>
            {hasContentAccess ? (
              <>
                <div className="admin-card__row">
                  <div>
                    <strong>Articles & Insights</strong>
                    <p className="field-hint">
                      Publications, authors, and reading taxonomy
                    </p>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/articles"
                  >
                    Manage →
                  </Link>
                </div>

                <div className="admin-card__row">
                  <div>
                    <strong>FAQs Knowledge Base</strong>
                    <p className="field-hint">
                      Answers categorized for clients and talent
                    </p>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/faqs"
                  >
                    Manage →
                  </Link>
                </div>
              </>
            ) : (
              <p className="form-help">
                Your role does not have publishing permissions.
              </p>
            )}
          </Card>

          <Card eyebrow="Talent & Opportunities" title="Careers & Recruitment">
            <p>
              Manage open positions, department alignments, and external ATS
              application routing.
            </p>
            {hasContentAccess ? (
              <div className="admin-card__row">
                <div>
                  <strong>Job Openings</strong>
                  <p className="field-hint">
                    Active roles and ATS job postings
                  </p>
                </div>
                <Link
                  className="button-link button-link--secondary"
                  href="/admin/careers"
                >
                  Manage →
                </Link>
              </div>
            ) : (
              <p className="form-help">
                Your role does not have talent editing permissions.
              </p>
            )}
          </Card>

          <Card
            eyebrow="Communications & Audience"
            title="Inquiries & Subscribers"
          >
            <p>
              Inbound contact requests, triage queues, response statuses, and
              verified newsletter subscribers.
            </p>
            {hasInquiryAccess || hasSubscriberAccess ? (
              <>
                {hasInquiryAccess && (
                  <div className="admin-card__row">
                    <div>
                      <strong>Inquiries Inbox</strong>
                      <p className="field-hint">
                        Client and candidate submissions
                      </p>
                    </div>
                    <Link
                      className="button-link button-link--secondary"
                      href="/admin/inquiries"
                    >
                      View Inbox →
                    </Link>
                  </div>
                )}

                {hasSubscriberAccess && (
                  <div className="admin-card__row">
                    <div>
                      <strong>Newsletter Subscribers</strong>
                      <p className="field-hint">
                        Double opt-in verified audience registry
                      </p>
                    </div>
                    <Link
                      className="button-link button-link--secondary"
                      href="/admin/subscribers"
                    >
                      View List →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="form-help">
                Your role does not have communications management permissions.
              </p>
            )}
          </Card>

          <Card eyebrow="Security & Access" title="Protected Workspace">
            <p>
              Your account, assigned administrator role (
              {profile.roleDisplayName}
              ), active status, and authenticator verification have all been
              validated server-side with AAL2 multi-factor authentication.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
