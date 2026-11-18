import type { NewsletterSubscription } from '@/lib/content/newsletter'

export type SubscriberStatus = NewsletterSubscription['status']

export type SubscriberStatusFilter = 'all' | SubscriberStatus

export type SubscriberDateFilter =
  | 'all'
  | 'today'
  | '7days'
  | '30days'
  | 'custom'

export type SubscriberItem = NewsletterSubscription & {
  confirmation_sent_at?: string | null
  avatar_url?: string | null
  display_name?: string | null
}

export const SUBSCRIBER_EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const SOURCE_LABELS: Record<string, string> = {
  footer_form: 'Footer Form',
  admin_manual: 'Admin Manual',
  insights_article: 'Insights Article',
  client_request: 'Client Request',
  event_signup: 'Event Signup',
}

export const SUBSCRIBER_SOURCE_OPTIONS = [
  { value: 'admin_manual', label: 'Admin Manual Entry' },
  { value: 'client_request', label: 'Direct Client Request' },
  { value: 'event_signup', label: 'Event / Webinar Signup' },
  { value: 'footer_form', label: 'Website Footer Form' },
] as const

export function formatConsentSource(source?: string | null): string {
  const clean = (source || '').trim().toLowerCase()
  if (!clean) return 'Website'
  if (SOURCE_LABELS[clean]) return SOURCE_LABELS[clean]
  return clean
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getSubscriberStatusLabel(status: SubscriberStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed'
    case 'pending_confirmation':
      return 'Pending'
    case 'unsubscribed':
      return 'Unsubscribed'
  }
}

export function deriveSubscriberDisplayName(item: {
  display_name?: string | null
  email_normalized: string
}): string {
  const explicit = item.display_name?.trim()
  if (explicit) return explicit

  const localPart = item.email_normalized.split('@')[0] || 'Subscriber'
  const words = localPart
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))

  return words.length > 0 ? words.join(' ') : 'Subscriber'
}

export function formatShortDate(isoDate?: string | null): string {
  if (!isoDate) return '—'
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatFullDateTime(isoDate?: string | null): string {
  if (!isoDate) return '—'
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function computeDateCutoff(
  filter: SubscriberDateFilter,
  customDate: string,
  now: Date = new Date(),
): { startMs: number; endMs: number } | null {
  if (filter === 'all') return null

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  if (filter === 'today') {
    return {
      startMs: startOfToday.getTime(),
      endMs: startOfToday.getTime() + 86_400_000 - 1,
    }
  }
  if (filter === '7days') {
    return {
      startMs: startOfToday.getTime() - 7 * 86_400_000,
      endMs: Infinity,
    }
  }
  if (filter === '30days') {
    return {
      startMs: startOfToday.getTime() - 30 * 86_400_000,
      endMs: Infinity,
    }
  }
  if (filter === 'custom' && customDate) {
    const [year, month, day] = customDate.split('-').map(Number)
    if (year && month && day) {
      const start = new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
      const end = new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
      return { startMs: start, endMs: end }
    }
  }

  return null
}

export function filterSubscribers(
  subscribers: SubscriberItem[],
  options: {
    statusFilter: SubscriberStatusFilter
    searchQuery: string
    dateRange: { startMs: number; endMs: number } | null
  },
): SubscriberItem[] {
  const query = options.searchQuery.trim().toLowerCase()

  return subscribers.filter((sub) => {
    if (options.statusFilter !== 'all' && sub.status !== options.statusFilter) {
      return false
    }

    if (options.dateRange) {
      const createdMs = new Date(sub.created_at).getTime()
      if (
        Number.isNaN(createdMs) ||
        createdMs < options.dateRange.startMs ||
        createdMs > options.dateRange.endMs
      ) {
        return false
      }
    }

    if (!query) return true

    const emailMatch = sub.email_normalized.toLowerCase().includes(query)
    const nameMatch = (sub.display_name || '').toLowerCase().includes(query)
    const sourceMatch = formatConsentSource(sub.consent_source)
      .toLowerCase()
      .includes(query)
    const rawSourceMatch = (sub.consent_source || '')
      .toLowerCase()
      .includes(query)
    const statusMatch = getSubscriberStatusLabel(sub.status)
      .toLowerCase()
      .includes(query)

    return (
      emailMatch || nameMatch || sourceMatch || rawSourceMatch || statusMatch
    )
  })
}

function escapeCsvCell(value: string): string {
  // Prefix cells starting with spreadsheet formula characters to mitigate CSV formula injection.
  const neutralized = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  if (/[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replaceAll('"', '""')}"`
  }
  return neutralized
}

export function buildSubscribersCsv(subscribers: SubscriberItem[]): string {
  const headers = [
    'Email',
    'Status',
    'Consent Source',
    'Consent Version',
    'Subscribed At',
    'Confirmed At',
    'Unsubscribed At',
  ]

  const rows = subscribers.map((sub) => [
    sub.email_normalized,
    sub.status,
    sub.consent_source,
    sub.consent_version,
    sub.created_at,
    sub.confirmed_at || '',
    sub.unsubscribed_at || '',
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(','))
    .join('\r\n')
}
