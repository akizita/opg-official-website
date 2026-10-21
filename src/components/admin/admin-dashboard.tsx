import Link from 'next/link'
import type { ReactNode } from 'react'

import { StatusBadge } from '@/components/ui/status-badge'
import type { AdminProfile } from '@/lib/auth/admin-session'
import { isAdminMfaRequired } from '@/lib/auth/config'
import {
  canManageMedia,
  canViewContent,
  canViewInquiries,
  canViewSubscribers,
} from '@/lib/auth/permissions'
import type { PageDocument } from '@/lib/content/page-documents'
import { createClient } from '@/lib/supabase/server'

type ModuleIcon =
  | 'articles'
  | 'briefcase'
  | 'clients'
  | 'faqs'
  | 'inquiries'
  | 'media'
  | 'pages'
  | 'services'
  | 'subscribers'

type DashboardModule = {
  description: string
  href: string
  icon: ModuleIcon
  label: string
  meta: string
}

type AdminDashboardProps = {
  aboutDocument: PageDocument | null
  missionDocument: PageDocument | null
  profile: AdminProfile
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  )
}

function WorkspaceIcon({ name }: { name: ModuleIcon }) {
  const paths: Record<ModuleIcon, ReactNode> = {
    pages: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    articles: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </>
    ),
    media: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <circle cx="9" cy="10" r="2" />
        <path d="m5 18 4-4 3 3 2-2 4 3" />
      </>
    ),
    services: (
      <>
        <path d="M12 3 4 7v10l8 4 8-4V7z" />
        <path d="m4 7 8 4 8-4M12 11v10" />
      </>
    ),
    clients: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2" />
        <path d="M3 20c0-4 2-6 6-6s6 2 6 6M15 15c3 0 5 1.7 5 5" />
      </>
    ),
    briefcase: (
      <>
        <rect height="13" rx="2" width="18" x="3" y="7" />
        <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
      </>
    ),
    faqs: (
      <>
        <path d="M5 4h14v13H9l-4 3z" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.9.4-.9.8-.9 1.7M12 15.8v.2" />
      </>
    ),
    inquiries: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    subscribers: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21c0-4.5 2.3-7 7-7s7 2.5 7 7" />
      </>
    ),
  }

  return (
    <span className="admin-module-card__icon">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {paths[name]}
      </svg>
    </span>
  )
}

export async function AdminDashboard({
  aboutDocument,
  missionDocument,
  profile,
}: AdminDashboardProps) {
  const hasContentAccess = canViewContent(profile.roleKey)
  const hasMediaAccess = canManageMedia(profile.roleKey)
  const hasInquiryAccess = canViewInquiries(profile.roleKey)
  const hasSubscriberAccess = canViewSubscribers(profile.roleKey)
  const supabase = await createClient()

  const [articleResult, jobResult, inquiryResult] = await Promise.all([
    hasContentAccess
      ? supabase.from('articles').select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
    hasContentAccess
      ? supabase
          .from('job_openings')
          .select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
    hasInquiryAccess
      ? supabase
          .from('contact_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new')
      : Promise.resolve({ count: 0 }),
  ])

  const articleCount = articleResult.count ?? 0
  const jobCount = jobResult.count ?? 0
  const newInquiryCount = inquiryResult.count ?? 0
  const modules: DashboardModule[] = []

  if (hasContentAccess) {
    modules.push(
      {
        description:
          'Institutional copy, mission, vision, and company details.',
        href: '/admin/pages',
        icon: 'pages',
        label: 'Pages',
        meta: '2 managed pages',
      },
      {
        description: 'Editorial stories, insights, authors, and categories.',
        href: '/admin/articles',
        icon: 'articles',
        label: 'Articles',
        meta: `${articleCount} ${articleCount === 1 ? 'article' : 'articles'}`,
      },
      {
        description: 'Public offerings and outsourced delivery solutions.',
        href: '/admin/services',
        icon: 'services',
        label: 'Services',
        meta: 'Service catalog',
      },
      {
        description: 'Partner organizations, logos, and testimonials.',
        href: '/admin/clients',
        icon: 'clients',
        label: 'Clients',
        meta: 'Client directory',
      },
      {
        description: 'Open roles, departments, and ATS application links.',
        href: '/admin/careers',
        icon: 'briefcase',
        label: 'Careers',
        meta: `${jobCount} ${jobCount === 1 ? 'opening' : 'openings'}`,
      },
      {
        description: 'Verified answers for candidates and organizations.',
        href: '/admin/faqs',
        icon: 'faqs',
        label: 'FAQs',
        meta: 'Knowledge base',
      },
    )
  }

  if (hasMediaAccess) {
    modules.splice(2, 0, {
      description: 'Images, logos, banners, and editorial assets.',
      href: '/admin/media',
      icon: 'media',
      label: 'Media library',
      meta: 'Asset storage',
    })
  }

  if (hasInquiryAccess) {
    modules.push({
      description: 'Review and manage candidate and client messages.',
      href: '/admin/inquiries',
      icon: 'inquiries',
      label: 'Inquiries',
      meta: `${newInquiryCount} new`,
    })
  }

  if (hasSubscriberAccess) {
    modules.push({
      description: 'View the verified newsletter audience registry.',
      href: '/admin/subscribers',
      icon: 'subscribers',
      label: 'Subscribers',
      meta: 'Audience registry',
    })
  }

  const now = new Date()
  const today = new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  return (
    <section className="admin-page admin-dashboard">
      <div className="admin-dashboard__inner">
        <header className="admin-dashboard__welcome">
          <div>
            <p className="admin-dashboard__eyebrow">Dashboard overview</p>
            <h1>Welcome back, {profile.displayName}</h1>
            <p>
              Manage the OPG website, publishing workflow, and incoming
              communications from one workspace.
            </p>
          </div>
          <time dateTime={now.toISOString()}>{today}</time>
        </header>

        <div className="admin-dashboard__metrics" aria-label="CMS summary">
          <article>
            <span>Editorial library</span>
            <strong>{articleCount}</strong>
            <small>Total articles</small>
          </article>
          <article>
            <span>Talent pipeline</span>
            <strong>{jobCount}</strong>
            <small>Job openings</small>
          </article>
          <article>
            <span>Inbox</span>
            <strong>{newInquiryCount}</strong>
            <small>New inquiries</small>
          </article>
          <article className="admin-dashboard__metric--brand">
            <span>Workspace</span>
            <strong>{modules.length}</strong>
            <small>Available modules</small>
          </article>
        </div>

        <div className="admin-dashboard__layout">
          <main className="admin-dashboard__modules">
            <div className="admin-dashboard__section-heading">
              <div>
                <p>CMS workspace</p>
                <h2>Manage website content</h2>
              </div>
              <span>{modules.length} modules</span>
            </div>

            <div className="admin-dashboard__module-grid">
              {modules.map((module) => (
                <Link
                  className="admin-module-card"
                  href={module.href}
                  key={module.href}
                >
                  <WorkspaceIcon name={module.icon} />
                  <span className="admin-module-card__copy">
                    <strong>{module.label}</strong>
                    <small>{module.description}</small>
                    <span>{module.meta}</span>
                  </span>
                  <span className="admin-module-card__arrow">
                    <ArrowIcon />
                  </span>
                </Link>
              ))}
            </div>
          </main>

          <aside className="admin-dashboard__aside">
            {hasContentAccess && (
              <section className="admin-dashboard__panel">
                <div className="admin-dashboard__section-heading">
                  <div>
                    <p>Publishing</p>
                    <h2>Page status</h2>
                  </div>
                </div>

                <div className="admin-dashboard__status-list">
                  <Link href="/admin/pages?tab=home">
                    <span>
                      <strong>Mission & Vision</strong>
                      <small>Version {missionDocument?.version ?? 1}</small>
                    </span>
                    <StatusBadge status={missionDocument?.status ?? 'draft'} />
                  </Link>
                  <Link href="/admin/pages?tab=about">
                    <span>
                      <strong>About Us</strong>
                      <small>Version {aboutDocument?.version ?? 1}</small>
                    </span>
                    <StatusBadge status={aboutDocument?.status ?? 'draft'} />
                  </Link>
                </div>
              </section>
            )}

            <section className="admin-dashboard__panel admin-dashboard__session">
              <div className="admin-dashboard__section-heading">
                <div>
                  <p>Access</p>
                  <h2>Active session</h2>
                </div>
                <span className="admin-dashboard__online">Online</span>
              </div>
              <dl>
                <div>
                  <dt>Account</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{profile.roleDisplayName}</dd>
                </div>
                <div>
                  <dt>Security</dt>
                  <dd>
                    {isAdminMfaRequired()
                      ? 'AAL2 verified'
                      : 'Development bypass'}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}
