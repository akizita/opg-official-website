'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  canManageMedia,
  canViewContent,
  canViewInquiries,
  canViewSubscribers,
} from '@/lib/auth/permissions'

type NavigationIcon =
  | 'articles'
  | 'briefcase'
  | 'clients'
  | 'dashboard'
  | 'faqs'
  | 'inquiries'
  | 'media'
  | 'pages'
  | 'services'
  | 'subscribers'
  | 'testimonials'

type NavigationItem = {
  href: string
  icon: NavigationIcon
  label: string
}

type NavigationGroup = {
  items: NavigationItem[]
  label: string
}

function Icon({ name }: { name: NavigationIcon }) {
  const paths: Record<NavigationIcon, ReactNode> = {
    dashboard: (
      <>
        <rect height="7" rx="1" width="7" x="3" y="3" />
        <rect height="7" rx="1" width="7" x="14" y="3" />
        <rect height="7" rx="1" width="7" x="3" y="14" />
        <rect height="7" rx="1" width="7" x="14" y="14" />
      </>
    ),
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
    testimonials: (
      <>
        <path d="M5 5h14v12H9l-4 3z" />
        <path d="M8 9h3v3H8zM13 9h3v3h-3z" />
      </>
    ),
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function isCurrentPath(pathname: string, href: string) {
  if (href === '/admin') return pathname === href
  if (href === '/admin/pages') return pathname.startsWith('/admin/pages')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNavigation({ roleKey }: { roleKey: string }) {
  const pathname = usePathname()
  const contentItems: NavigationItem[] = canViewContent(roleKey)
    ? [
        { href: '/admin/pages', icon: 'pages', label: 'Pages' },
        { href: '/admin/articles', icon: 'articles', label: 'Articles' },
      ]
    : []
  const collectionItems: NavigationItem[] = canViewContent(roleKey)
    ? [
        { href: '/admin/services', icon: 'services', label: 'Services' },
        { href: '/admin/clients', icon: 'clients', label: 'Clients' },
        {
          href: '/admin/testimonials',
          icon: 'testimonials',
          label: 'Testimonials',
        },
        { href: '/admin/careers', icon: 'briefcase', label: 'Careers' },
        { href: '/admin/faqs', icon: 'faqs', label: 'FAQs' },
      ]
    : []

  if (canManageMedia(roleKey)) {
    contentItems.push({ href: '/admin/media', icon: 'media', label: 'Media' })
  }

  const operationsItems: NavigationItem[] = []
  if (canViewInquiries(roleKey)) {
    operationsItems.push({
      href: '/admin/inquiries',
      icon: 'inquiries',
      label: 'Inquiries',
    })
  }
  if (canViewSubscribers(roleKey)) {
    operationsItems.push({
      href: '/admin/subscribers',
      icon: 'subscribers',
      label: 'Subscribers',
    })
  }

  const overviewItems: NavigationItem[] = [
    { href: '/admin', icon: 'dashboard', label: 'Overview' },
  ]
  const groups: NavigationGroup[] = [
    {
      label: 'Workspace',
      items: overviewItems,
    },
    { label: 'Content', items: contentItems },
    { label: 'Collections', items: collectionItems },
    { label: 'Operations', items: operationsItems },
  ].filter((group) => group.items.length > 0)

  return (
    <nav className="admin-shell__nav" aria-label="CMS navigation">
      {groups.map((group) => (
        <div className="admin-shell__nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map((item) => {
            const isCurrent = isCurrentPath(pathname, item.href)

            return (
              <Link
                aria-label={item.label}
                aria-current={isCurrent ? 'page' : undefined}
                data-label={item.label}
                href={item.href}
                key={item.href}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
