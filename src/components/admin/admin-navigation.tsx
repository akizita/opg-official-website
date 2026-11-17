'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  OpgIconArticles,
  OpgIconClients,
  OpgIconContacts,
  OpgIconDashboard,
  OpgIconSubscribers,
  OpgIconTestimonials,
} from '@/components/icons/opg-icons'
import {
  canViewContent,
  canViewInquiries,
  canViewSubscribers,
} from '@/lib/auth/permissions'

type NavigationIcon =
  | 'articles'
  | 'clients'
  | 'dashboard'
  | 'inquiries'
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

function NavigationGlyph({ name }: { name: NavigationIcon }) {
  switch (name) {
    case 'dashboard':
      return <OpgIconDashboard />
    case 'articles':
      return <OpgIconArticles />
    case 'clients':
      return <OpgIconClients />
    case 'inquiries':
      return <OpgIconContacts />
    case 'subscribers':
      return <OpgIconSubscribers />
    case 'testimonials':
      return <OpgIconTestimonials />
    default:
      return null
  }
}

function isCurrentPath(pathname: string, href: string) {
  if (href === '/admin') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNavigation({ roleKey }: { roleKey: string }) {
  const pathname = usePathname()
  const managementItems: NavigationItem[] = canViewContent(roleKey)
    ? [
        { href: '/admin/articles', icon: 'articles', label: 'Articles' },
        {
          href: '/admin/testimonials',
          icon: 'testimonials',
          label: 'Testimonials',
        },
        { href: '/admin/clients', icon: 'clients', label: 'Clients' },
      ]
    : []

  const operationsItems: NavigationItem[] = []
  if (canViewInquiries(roleKey)) {
    operationsItems.push({
      href: '/admin/inquiries',
      icon: 'inquiries',
      label: 'Contacts',
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
    { label: 'Management', items: managementItems },
    { label: 'Operations', items: operationsItems },
  ].filter((group) => group.items.length > 0)

  return (
    <nav className="admin-shell__nav" aria-label="Admin navigation">
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
                title={item.label}
              >
                <NavigationGlyph name={item.icon} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
