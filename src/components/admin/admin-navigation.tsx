'use client'

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'

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

const DOCK_BASE_ITEM_SIZE = 44
const DOCK_MAGNIFICATION = 58
const DOCK_DISTANCE = 135
const DOCK_SPRING: SpringOptions = {
  mass: 0.1,
  stiffness: 150,
  damping: 12,
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

function DockNavItem({
  item,
  isCurrent,
  mouseY,
  shouldReduceMotion,
}: {
  item: NavigationItem
  isCurrent: boolean
  mouseY: MotionValue<number>
  shouldReduceMotion: boolean
}) {
  const itemRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const mouseDistance = useTransform(mouseY, (val) => {
    if (shouldReduceMotion || !Number.isFinite(val)) {
      return DOCK_DISTANCE + 1
    }
    const rect = itemRef.current?.getBoundingClientRect() ?? {
      y: 0,
      height: DOCK_BASE_ITEM_SIZE,
    }
    return val - rect.y - rect.height / 2
  })

  const targetSize = useTransform(
    mouseDistance,
    [-DOCK_DISTANCE, 0, DOCK_DISTANCE],
    [
      DOCK_BASE_ITEM_SIZE,
      shouldReduceMotion ? DOCK_BASE_ITEM_SIZE : DOCK_MAGNIFICATION,
      DOCK_BASE_ITEM_SIZE,
    ],
  )

  const size = useSpring(targetSize, DOCK_SPRING)
  const iconScale = useTransform(
    size,
    [DOCK_BASE_ITEM_SIZE, DOCK_MAGNIFICATION],
    [1, shouldReduceMotion ? 1 : 1.24],
  )

  return (
    <motion.div
      ref={itemRef}
      className="admin-shell__dock-item"
      style={
        shouldReduceMotion
          ? { width: DOCK_BASE_ITEM_SIZE, height: DOCK_BASE_ITEM_SIZE }
          : { width: size, height: size }
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
    >
      <Link
        aria-current={isCurrent ? 'page' : undefined}
        aria-label={item.label}
        className={`admin-shell__nav-link ${isCurrent ? 'admin-shell__nav-link--active' : ''}`}
        href={item.href}
        onBlur={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
      >
        <motion.div
          aria-hidden="true"
          className="admin-shell__dock-icon"
          style={shouldReduceMotion ? undefined : { scale: iconScale }}
        >
          <NavigationGlyph name={item.icon} />
        </motion.div>
        <span className="sr-only">{item.label}</span>
      </Link>

      <div className="admin-shell__dock-label-wrap" aria-hidden="true">
        <AnimatePresence>
          {isHovered && (
            <motion.div
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="admin-shell__dock-label"
              exit={{ opacity: 0, x: -6, scale: 0.94 }}
              initial={{ opacity: 0, x: -6, scale: 0.94 }}
              role="tooltip"
              transition={
                shouldReduceMotion
                  ? { duration: 0.01 }
                  : { duration: 0.14, ease: [0.16, 1, 0.3, 1] }
              }
            >
              {item.label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function AdminNavigation({ roleKey }: { roleKey: string }) {
  const pathname = usePathname()
  const mouseY = useMotionValue(Infinity)
  const shouldReduceMotion = Boolean(useReducedMotion())

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
    <motion.nav
      aria-label="Admin navigation"
      className="admin-shell__nav"
      onPointerLeave={() => mouseY.set(Infinity)}
      onPointerMove={(event) => {
        if (event.pointerType === 'mouse' && !shouldReduceMotion) {
          mouseY.set(event.clientY)
        }
      }}
    >
      {groups.map((group, groupIndex) => (
        <div className="admin-shell__nav-group" key={group.label}>
          {groupIndex > 0 && (
            <span className="admin-shell__nav-divider" aria-hidden="true" />
          )}
          {group.items.map((item) => (
            <DockNavItem
              isCurrent={isCurrentPath(pathname, item.href)}
              item={item}
              key={item.href}
              mouseY={mouseY}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      ))}
    </motion.nav>
  )
}
