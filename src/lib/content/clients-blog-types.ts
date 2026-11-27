export type ClientsBlogBlock =
  | {
      id: string
      type: 'rich_text'
      markdown: string
    }
  | {
      id: string
      type: 'image'
      url: string
      alt: string
      caption?: string
    }

export type ClientsBlogAuthorMode = 'custom' | 'team'
export type ClientsBlogFeaturedMode = 'auto' | 'custom'

export type ClientsBlogConfig = {
  publishedLabel: string
  readTimeLabel: string
  title: string
  lead: string
  heroImageUrl: string | null
  heroImageAlt: string
  authorMode: ClientsBlogAuthorMode
  authorId: string | null
  authorName: string
  authorRole: string
  authorAvatarUrl: string | null
  authorMonogram: string
  showShareButtons: boolean
  showFeaturedArticle: boolean
  featuredArticleMode: ClientsBlogFeaturedMode
  featuredArticleSlug: string | null
  featuredArticleBadgeLabel: string
  viewMoreArticlesLabel: string
  blocks: ClientsBlogBlock[]
  updatedAt?: string
}

export const CLIENTS_BLOG_SETTING_KEY = 'clients_blog_section'

const DEFAULT_BLOCK_1_MARKDOWN = `Outsourced Pro Global (OPG) wasn’t started by agency salespeople looking to chase placement fees. Our leadership team cut its teeth building and scaling high-volume internal talent engines across the Asia-Pacific and Oceania regions.

Tasked with solving complex hiring bottlenecks for fast-growing enterprises, we built an internal blueprint for sourcing, vetting, and onboarding top-tier remote and onsite professionals—consistently outperforming industry benchmarks for time-to-hire, retention, and cultural fit across South Asia, Southeast Asia, Australia, and New Zealand.

Over time, we saw a recurring gap in the market: growing companies struggled to find recruitment partners who understood both emerging APAC talent hubs and established ANZ markets while operating with an in-house mindset.

We launched Outsourced Pro Global to bring that exact internal infrastructure to external partners—giving scaling businesses plug-and-play access to enterprise-grade recruitment without the overhead of building it from scratch.

### Why Partners Choose an Embedded Model

Because our DNA is rooted in internal talent operations rather than transactional agency recruiting, we integrate directly into your workflows, culture, and commercial goals:

1. **The In-House Standard:** We don’t play a volume numbers game. Having sat on the internal side of the table, we know a bad hire drains leadership time and team morale—so we screen every candidate with the rigor of an internal HR team.
2. **True APAC & ANZ Reach:** With deep operational roots across the Philippines, India, Australia, and New Zealand, we navigate local labor laws, compensation benchmarks, and cultural nuances seamlessly—whether you need an onsite executive in Sydney or a remote operations team in Manila.
3. **Plug-and-Play Infrastructure:** You get immediate access to our proven sourcing tech stack, active talent pipelines, and structured vetting scorecards from day one.
4. **Flexible Scale:** Whether you need rapid ramp-up for seasonal demand or targeted headhunting for niche senior roles, our model scales up or down with your business cycle.`

const DEFAULT_BLOCK_3_MARKDOWN = `### Our Core Services

Targeted recruitment and workforce solutions built to operate seamlessly alongside your internal team:

1. **End-to-End Talent Acquisition:** We manage the full recruitment lifecycle—from market mapping and direct headhunting to structured technical assessments and onboarding—operating as a seamless extension of your team.
2. **Managed Resume Screening as a Service:** Acting as a dedicated screening filter for your existing job ads and applicant pools, our recruiters review, grade, and shortlist incoming CVs so your hiring managers only interview top-tier candidates.
3. **HR Admin & Global Payroll:** We take the friction out of cross-border workforce management—handling timekeeping, compliance, record management, and accurate, on-time multi-currency salary disbursements.

### Ready to Upgrade Your Hiring Engine?

Whether you are scaling an offshore operations hub or searching for niche onshore talent, let’s talk through your upcoming hiring roadmap. Book a 15-minute pipeline consultation to see how an embedded talent model can cut your time-to-hire.`

export const DEFAULT_CLIENTS_BLOG_CONFIG: ClientsBlogConfig = {
  publishedLabel: 'Published Autumn 2026',
  readTimeLabel: '4 min read',
  title: 'OPG’s Evolution: From Internal Engine to Global Talent Partner',
  lead: 'Built From the Inside Out: How Outsourced Pro Global evolved its internal talent engine into an embedded cross-border partner—delivering dedicated engineering, operations, and governance pods for high-growth teams worldwide.',
  heroImageUrl: '/images/clients-blog-hero.jpg',
  heroImageAlt: 'OPG Global Pod Architecture and Distributed Operational Excellence',
  authorMode: 'custom',
  authorId: null,
  authorName: 'OPG Strategic Advisory',
  authorRole: 'Global Pod Operations',
  authorAvatarUrl: null,
  authorMonogram: 'OPG',
  showShareButtons: true,
  showFeaturedArticle: true,
  featuredArticleMode: 'auto',
  featuredArticleSlug: null,
  featuredArticleBadgeLabel: 'Featured Article',
  viewMoreArticlesLabel: 'View more articles',
  blocks: [
    {
      id: 'blog-block-intro',
      type: 'rich_text',
      markdown: DEFAULT_BLOCK_1_MARKDOWN,
    },
    {
      id: 'blog-block-secondary-photo',
      type: 'image',
      url: '/images/clients-blog-secondary.jpg',
      alt: 'OPG Fluid Collaboration and Infinite Scalability',
      caption: '',
    },
    {
      id: 'blog-block-services',
      type: 'rich_text',
      markdown: DEFAULT_BLOCK_3_MARKDOWN,
    },
  ],
}

export function cloneDefaultClientsBlogConfig(): ClientsBlogConfig {
  return {
    ...DEFAULT_CLIENTS_BLOG_CONFIG,
    blocks: DEFAULT_CLIENTS_BLOG_CONFIG.blocks.map((block) => ({ ...block })),
  }
}

export function normalizeSafeBlogMediaUrl(
  rawUrl: string | null | undefined,
): string | null {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : ''
  if (!trimmed) return null
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString()
    }
  } catch {
    return null
  }
  return null
}

export function estimateClientsBlogReadTime(
  blocks: readonly ClientsBlogBlock[],
  lead?: string,
): string {
  const words = [
    lead || '',
    ...blocks.map((b) => (b.type === 'rich_text' ? b.markdown : '')),
  ]
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

export function computeAuthorMonogram(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'OPG'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function normalizeClientsBlogConfig(raw: unknown): ClientsBlogConfig {
  const defaults = cloneDefaultClientsBlogConfig()
  if (!raw || typeof raw !== 'object') {
    return defaults
  }

  const input = raw as Record<string, unknown>

  const readString = (
    key: string,
    fallback: string,
    allowEmpty = false,
  ): string => {
    const val = input[key]
    if (typeof val !== 'string') return fallback
    const trimmed = val.trim()
    if (!trimmed && !allowEmpty) return fallback
    return trimmed
  }

  const hasHeroKey = 'heroImageUrl' in input
  const heroImageUrl = hasHeroKey
    ? normalizeSafeBlogMediaUrl(input.heroImageUrl as string | null)
    : defaults.heroImageUrl

  const hasAuthorAvatarKey = 'authorAvatarUrl' in input
  const authorAvatarUrl = hasAuthorAvatarKey
    ? normalizeSafeBlogMediaUrl(input.authorAvatarUrl as string | null)
    : defaults.authorAvatarUrl

  const authorName = readString('authorName', defaults.authorName)

  const blocks: ClientsBlogBlock[] = Array.isArray(input.blocks)
    ? input.blocks
        .map((item, idx): ClientsBlogBlock | null => {
          if (!item || typeof item !== 'object') return null
          const b = item as Record<string, unknown>
          const id =
            typeof b.id === 'string' && b.id.trim()
              ? b.id.trim()
              : `blog-block-${idx + 1}`
          if (b.type === 'rich_text') {
            return {
              id,
              type: 'rich_text',
              markdown: typeof b.markdown === 'string' ? b.markdown : '',
            }
          }
          if (b.type === 'image') {
            const safeUrl = normalizeSafeBlogMediaUrl(b.url as string | null)
            if (!safeUrl) return null
            return {
              id,
              type: 'image',
              url: safeUrl,
              alt:
                typeof b.alt === 'string' && b.alt.trim()
                  ? b.alt.trim()
                  : 'Clients blog visual',
              caption:
                typeof b.caption === 'string' && b.caption.trim()
                  ? b.caption.trim()
                  : '',
            }
          }
          return null
        })
        .filter((item): item is ClientsBlogBlock => item !== null)
    : defaults.blocks

  return {
    publishedLabel: readString('publishedLabel', defaults.publishedLabel),
    readTimeLabel: readString('readTimeLabel', defaults.readTimeLabel),
    title: readString('title', defaults.title),
    lead: readString('lead', defaults.lead),
    heroImageUrl,
    heroImageAlt: readString('heroImageAlt', defaults.heroImageAlt),
    authorMode: input.authorMode === 'team' ? 'team' : 'custom',
    authorId:
      typeof input.authorId === 'string' && input.authorId.trim()
        ? input.authorId.trim()
        : null,
    authorName,
    authorRole: readString('authorRole', defaults.authorRole),
    authorAvatarUrl,
    authorMonogram: readString(
      'authorMonogram',
      computeAuthorMonogram(authorName),
    ),
    showShareButtons: input.showShareButtons !== false,
    showFeaturedArticle: input.showFeaturedArticle !== false,
    featuredArticleMode:
      input.featuredArticleMode === 'custom' ? 'custom' : 'auto',
    featuredArticleSlug:
      typeof input.featuredArticleSlug === 'string' &&
      input.featuredArticleSlug.trim()
        ? input.featuredArticleSlug.trim()
        : null,
    featuredArticleBadgeLabel: readString(
      'featuredArticleBadgeLabel',
      defaults.featuredArticleBadgeLabel,
    ),
    viewMoreArticlesLabel: readString(
      'viewMoreArticlesLabel',
      defaults.viewMoreArticlesLabel,
    ),
    blocks: Array.isArray(input.blocks) ? blocks : defaults.blocks,
    updatedAt:
      typeof input.updatedAt === 'string' ? input.updatedAt : undefined,
  }
}
