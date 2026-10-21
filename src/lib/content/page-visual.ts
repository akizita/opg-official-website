import type { RichTextBlock } from '@/lib/content/page-documents'

export const VISUAL_BLOCK_KEY = '__visual_editor_v1'

export type VisualImage = {
  src: string
  alt: string
  position: string
}

export type VisualStyle = {
  color?: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right'
  paddingTop?: string
  paddingBottom?: string
}

export type PageVisualConfig = {
  images: Record<string, VisualImage>
  links: Record<string, string>
  labels: Record<string, string>
  styles: Record<string, VisualStyle>
  sectionOrder: Record<string, string[]>
}

export const EMPTY_VISUAL_CONFIG: PageVisualConfig = {
  images: {},
  links: {},
  labels: {},
  styles: {},
  sectionOrder: {},
}

export const VISUAL_PAGES = {
  home: { label: 'Home', path: '/' },
  about: { label: 'About Us', path: '/about' },
  clients: { label: 'Clients', path: '/clients' },
  careers: { label: 'Careers', path: '/careers' },
  articles: { label: 'Articles', path: '/articles' },
  contact: { label: 'Contact', path: '/contact' },
} as const

export type VisualPage = keyof typeof VISUAL_PAGES

export const VISUAL_EDITOR_PAGES = {
  home: VISUAL_PAGES.home,
  about: VISUAL_PAGES.about,
  clients: VISUAL_PAGES.clients,
  careers: VISUAL_PAGES.careers,
} as const

export type VisualEditorPage = keyof typeof VISUAL_EDITOR_PAGES

export const PAGE_LINK_DIRECTORY = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Who We Are', href: '/about#who-we-are' },
  { label: 'What We Offer', href: '/about#what-we-offer' },
  { label: 'Our Process', href: '/about#how-our-process-works' },
  { label: 'Mission, Vision & Values', href: '/about#our-purpose' },
  { label: 'Clients', href: '/clients' },
  { label: 'Careers', href: '/careers' },
  { label: 'Articles', href: '/articles' },
  { label: 'Contact', href: '/contact' },
] as const

export const VISUAL_SECTION_GROUPS: Record<
  VisualPage,
  Array<{
    id: string
    label: string
    sections: Array<{ id: string; label: string; selector: string }>
  }>
> = {
  home: [
    {
      id: 'home-main',
      label: 'Page sections',
      sections: [
        { id: 'hero', label: 'Hero', selector: '.hero' },
        {
          id: 'stats',
          label: 'Key highlights',
          selector: '.hero-stats-divider',
        },
        { id: 'overview', label: 'Overview', selector: '.about-overview' },
        {
          id: 'network',
          label: 'Offshore network',
          selector: '.global-showcase-band',
        },
        { id: 'proof', label: 'Client trust', selector: '.section--proof' },
        { id: 'testimonial', label: 'Testimonial', selector: '.section--ink' },
        { id: 'cta', label: 'Final CTA', selector: '.cta-section' },
      ],
    },
  ],
  about: [
    {
      id: 'about-main',
      label: 'Page sections',
      sections: [
        { id: 'hero', label: 'Hero', selector: '.about-hero-banner' },
        {
          id: 'who',
          label: 'Who We Are and cards',
          selector: '.about-showcase-band--who',
        },
        {
          id: 'services',
          label: 'Services and process',
          selector: '.about-services-section',
        },
        {
          id: 'purpose-map',
          label: 'Purpose, network and team',
          selector: '.about-showcase-band--purpose-map',
        },
        { id: 'cta', label: 'Final CTA', selector: '.about-cta-section' },
      ],
    },
    {
      id: 'about-purpose',
      label: 'Purpose, network and team',
      sections: [
        {
          id: 'purpose',
          label: 'Mission, vision and values',
          selector: '.about-purpose-section',
        },
        {
          id: 'map',
          label: 'Offshore network',
          selector: '.about-map-section',
        },
        { id: 'team', label: 'Leadership', selector: '.about-team-showcase' },
        {
          id: 'directory',
          label: 'Department directory',
          selector: '.about-team-section',
        },
      ],
    },
  ],
  clients: [
    {
      id: 'clients-main',
      label: 'Page sections',
      sections: [
        { id: 'hero', label: 'Hero', selector: '.clients-hero-wrapper' },
        {
          id: 'showcase',
          label: 'Stories, testimonials and partners',
          selector: '.clients-showcase-band',
        },
      ],
    },
    {
      id: 'clients-showcase',
      label: 'Stories, testimonials and partners',
      sections: [
        {
          id: 'article',
          label: 'Featured story',
          selector: '.clients-blog-section',
        },
        {
          id: 'testimonials-heading',
          label: 'Testimonials intro',
          selector: '.clients-testimonials-header-section',
        },
        {
          id: 'testimonials',
          label: 'Testimonials carousel',
          selector: '.clients-testimonials-carousel-section',
        },
        {
          id: 'directory',
          label: 'Partner profiles',
          selector: '.clients-directory',
        },
        { id: 'cta', label: 'Final CTA', selector: '.clients-cta' },
      ],
    },
  ],
  careers: [
    {
      id: 'careers-main',
      label: 'Page sections',
      sections: [
        { id: 'hero', label: 'Hero', selector: '.careers-hero' },
        { id: 'benefits', label: 'Benefits', selector: '.careers-benefits' },
        {
          id: 'openings',
          label: 'Open positions',
          selector: '.careers-openings',
        },
      ],
    },
  ],
  articles: [
    {
      id: 'articles-main',
      label: 'Page sections',
      sections: [
        {
          id: 'featured',
          label: 'Featured article',
          selector: '.articles-feature-layout',
        },
        {
          id: 'collection',
          label: 'Article collection',
          selector: '.articles-collection',
        },
      ],
    },
  ],
  contact: [
    {
      id: 'contact-main',
      label: 'Page sections',
      sections: [
        { id: 'hero', label: 'Hero', selector: '.contact-hero' },
        {
          id: 'layout',
          label: 'Contact details and form',
          selector: '.contact-layout-grid',
        },
      ],
    },
    {
      id: 'contact-columns',
      label: 'Contact details and form',
      sections: [
        {
          id: 'channels',
          label: 'Contact channels',
          selector: '.contact-info-column',
        },
        { id: 'form', label: 'Inquiry form', selector: '.contact-form-column' },
      ],
    },
  ],
}

export function isValidVisualUrl(value: string): boolean {
  const href = value.trim()
  if (href.startsWith('/')) {
    if (href.startsWith('//')) return false
    return PAGE_LINK_DIRECTORY.some((item) => item.href === href)
  }
  if (/^(mailto|tel):[^\s]+$/i.test(href)) return true
  try {
    const parsed = new URL(href)
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      Boolean(parsed.hostname)
    )
  } catch {
    return false
  }
}

export function getPageVisualConfig(
  content: RichTextBlock[] | null | undefined,
): PageVisualConfig {
  const block = (Array.isArray(content) ? content : []).find(
    (item) => item.type === 'paragraph' && item.key === VISUAL_BLOCK_KEY,
  )
  if (!block || block.type !== 'paragraph')
    return structuredClone(EMPTY_VISUAL_CONFIG)
  try {
    const parsed: unknown = JSON.parse(block.content)
    if (!parsed || typeof parsed !== 'object')
      return structuredClone(EMPTY_VISUAL_CONFIG)
    const value = parsed as Partial<PageVisualConfig>
    return {
      images:
        value.images && typeof value.images === 'object' ? value.images : {},
      links: value.links && typeof value.links === 'object' ? value.links : {},
      labels:
        value.labels && typeof value.labels === 'object' ? value.labels : {},
      styles:
        value.styles && typeof value.styles === 'object' ? value.styles : {},
      sectionOrder:
        value.sectionOrder && typeof value.sectionOrder === 'object'
          ? value.sectionOrder
          : {},
    }
  } catch {
    return structuredClone(EMPTY_VISUAL_CONFIG)
  }
}

export function pageVisualBlock(config: PageVisualConfig): RichTextBlock {
  return {
    type: 'paragraph',
    key: VISUAL_BLOCK_KEY,
    content: JSON.stringify(config),
  }
}
