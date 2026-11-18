import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export type SocialLinkItem = {
  platform: string
  url: string
  label?: string
}

export type Client = {
  created_at: string
  display_order: number
  display_permission: boolean
  id: string
  is_visible: boolean
  logo_url: string
  name: string
  updated_at: string
  website_url: string | null
  type_of_company?: string | null
  hero_domain?: string | null
  tagline?: string | null
  description?: string | null
  operational_base?: string | null
  dedicated_capability?: string | null
  linkedin_url?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  x_url?: string | null
  social_links?: SocialLinkItem[] | null
}

export type Testimonial = {
  author_company: string | null
  author_name: string
  author_role: string
  client_id?: string | null
  consent_reference: string | null
  created_at: string
  display_order: number
  headline?: string | null
  id: string
  photo_url?: string | null
  quote: string
  rating?: number | null
  status: 'draft' | 'in_review' | 'published' | 'archived'
  updated_at: string
  client?: Client | null
}

export type ClientInput = {
  display_order?: number
  display_permission?: boolean
  is_visible?: boolean
  logo_url: string
  name: string
  website_url?: string | null
  type_of_company?: string | null
  hero_domain?: string | null
  tagline?: string | null
  description?: string | null
  operational_base?: string | null
  dedicated_capability?: string | null
  linkedin_url?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  x_url?: string | null
  social_links?: SocialLinkItem[] | null
}

export type TestimonialInput = {
  author_company?: string | null
  author_name: string
  author_role: string
  client_id?: string | null
  consent_reference?: string | null
  display_order?: number
  headline?: string | null
  photo_url?: string | null
  quote: string
  rating?: number
  status?: 'draft' | 'in_review' | 'published' | 'archived'
}

export function validateClientInput(raw: unknown): {
  data?: ClientInput
  errors?: Record<string, string>
  message?: string
  success: boolean
} {
  const errors: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') {
    return { success: false, message: 'Invalid data format.' }
  }

  const input = raw as Record<string, unknown>
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    errors.name = 'Client name is required.'
  }

  if (typeof input.logo_url !== 'string' || input.logo_url.trim() === '') {
    errors.logo_url = 'Logo URL is required.'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, message: Object.values(errors)[0] }
  }

  const cleanString = (val: unknown) =>
    typeof val === 'string' && val.trim() ? val.trim() : null

  const rawSocialLinks = Array.isArray(input.social_links)
    ? (input.social_links as unknown[])
        .filter(
          (item): item is { platform: string; url: string; label?: string } =>
            Boolean(
              item &&
                typeof item === 'object' &&
                typeof (item as Record<string, unknown>).platform === 'string' &&
                typeof (item as Record<string, unknown>).url === 'string' &&
                ((item as Record<string, unknown>).url as string).trim(),
            ),
        )
        .map((item) => ({
          platform: item.platform.trim().toLowerCase(),
          url: item.url.trim(),
          label: typeof item.label === 'string' ? item.label.trim() : undefined,
        }))
    : undefined

  const findPlatformUrl = (platform: string) =>
    rawSocialLinks?.find((s) => s.platform === platform)?.url

  return {
    success: true,
    data: {
      name: (input.name as string).trim(),
      logo_url: (input.logo_url as string).trim(),
      website_url: cleanString(input.website_url),
      type_of_company: cleanString(input.type_of_company),
      hero_domain: cleanString(input.hero_domain),
      tagline: cleanString(input.tagline),
      description: cleanString(input.description),
      operational_base: cleanString(input.operational_base),
      dedicated_capability: cleanString(input.dedicated_capability),
      linkedin_url: findPlatformUrl('linkedin') || cleanString(input.linkedin_url),
      facebook_url: findPlatformUrl('facebook') || cleanString(input.facebook_url),
      instagram_url: findPlatformUrl('instagram') || cleanString(input.instagram_url),
      x_url:
        findPlatformUrl('x') ||
        findPlatformUrl('twitter') ||
        cleanString(input.x_url),
      social_links:
        rawSocialLinks && rawSocialLinks.length > 0 ? rawSocialLinks : null,
      display_order:
        typeof input.display_order === 'number'
          ? input.display_order
          : parseInt(String(input.display_order || '0'), 10) || 0,
      display_permission: input.display_permission !== false,
      is_visible: input.is_visible !== false,
    },
  }
}

export function validateTestimonialInput(raw: unknown): {
  data?: TestimonialInput
  errors?: Record<string, string>
  message?: string
  success: boolean
} {
  const errors: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') {
    return { success: false, message: 'Invalid data format.' }
  }

  const input = raw as Record<string, unknown>
  if (typeof input.quote !== 'string' || input.quote.trim() === '') {
    errors.quote = 'Quote is required.'
  }

  if (
    typeof input.author_name !== 'string' ||
    input.author_name.trim() === ''
  ) {
    errors.author_name = 'Author name is required.'
  }

  if (
    typeof input.author_role !== 'string' ||
    input.author_role.trim() === ''
  ) {
    errors.author_role = 'Author role is required.'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, message: Object.values(errors)[0] }
  }

  const headline =
    typeof input.headline === 'string' && input.headline.trim()
      ? input.headline.trim()
      : null
  const photo_url =
    typeof input.photo_url === 'string' && input.photo_url.trim()
      ? input.photo_url.trim()
      : null
  const client_id =
    typeof input.client_id === 'string' && input.client_id.trim()
      ? input.client_id.trim()
      : null
  const rawRating = input.rating
  const parsedRating =
    typeof rawRating === 'number'
      ? rawRating
      : typeof rawRating === 'string'
        ? parseInt(rawRating, 10)
        : 5
  const rating =
    Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5
      ? parsedRating
      : 5

  return {
    success: true,
    data: {
      quote: (input.quote as string).trim(),
      author_name: (input.author_name as string).trim(),
      author_role: (input.author_role as string).trim(),
      headline,
      photo_url,
      client_id,
      rating,
      author_company:
        typeof input.author_company === 'string' && input.author_company.trim()
          ? input.author_company.trim()
          : null,
      consent_reference:
        typeof input.consent_reference === 'string' &&
        input.consent_reference.trim()
          ? input.consent_reference.trim()
          : null,
      display_order:
        typeof input.display_order === 'number'
          ? input.display_order
          : parseInt(String(input.display_order || '0'), 10) || 0,
      status:
        (input.status as 'draft' | 'in_review' | 'published' | 'archived') ||
        'draft',
    },
  }
}

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'c1100000-0000-4000-8000-000000000001',
    name: 'Northstar Labs',
    logo_url: '/images/clients/northstar.svg',
    website_url: 'https://northstarlabs.example.com',
    display_permission: true,
    display_order: 1,
    is_visible: true,
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
    type_of_company: 'Enterprise Software',
    hero_domain: 'Enterprise SaaS',
    tagline: 'Cloud-native enterprise workflow intelligence',
    description:
      'Northstar Labs engineers secure, cloud-native workflow automation platforms and distributed collaboration software serving high-growth technology scaleups and global enterprise clients.',
    operational_base: 'North America (San Francisco, CA)',
    dedicated_capability: 'Full-Stack Engineering & QA Automation Pod',
    linkedin_url: 'https://www.linkedin.com/company/northstar-labs',
    facebook_url: 'https://facebook.com/northstarlabs',
    instagram_url: 'https://instagram.com/northstarlabs',
    x_url: 'https://x.com/northstarlabs',
  },
  {
    id: 'c1100000-0000-4000-8000-000000000002',
    name: 'Meridian Health',
    logo_url: '/images/clients/meridian.svg',
    website_url: 'https://meridianhealth.example.com',
    display_permission: true,
    display_order: 2,
    is_visible: true,
    created_at: '2026-10-02T00:00:00.000Z',
    updated_at: '2026-10-02T00:00:00.000Z',
    type_of_company: 'Digital Health',
    hero_domain: 'Healthcare Tech',
    tagline: 'Coordinated telehealth and patient-first access',
    description:
      'A premier digital healthcare collective improving clinical access across Australasia through synchronized telehealth support, 24/7 triage workflows, and compassionate care navigation.',
    operational_base: 'Australia (Sydney, NSW)',
    dedicated_capability: '24/7 Care Coordination & Medical Ops Pod',
    linkedin_url: 'https://www.linkedin.com/company/meridian-health',
    facebook_url: 'https://facebook.com/meridianhealth',
    instagram_url: 'https://instagram.com/meridianhealth',
    x_url: 'https://x.com/meridianhealth',
  },
  {
    id: 'c1100000-0000-4000-8000-000000000003',
    name: 'Harborline Finance',
    logo_url: '/images/clients/harborline.svg',
    website_url: 'https://harborlinefinance.example.com',
    display_permission: true,
    display_order: 3,
    is_visible: true,
    created_at: '2026-10-03T00:00:00.000Z',
    updated_at: '2026-10-03T00:00:00.000Z',
    type_of_company: 'Fintech & Compliance',
    hero_domain: 'Fintech & Compliance',
    tagline: 'Transparent cross-border algorithmic wealth tech',
    description:
      'A regulated fintech firm providing transparent cross-border asset management, algorithmic settlement infrastructure, and institutional-grade regulatory reporting systems.',
    operational_base: 'United Kingdom (London)',
    dedicated_capability: 'AML/KYC Compliance & Settlement Pod',
    linkedin_url: 'https://www.linkedin.com/company/harborline-finance',
    facebook_url: 'https://facebook.com/harborlinefinance',
    instagram_url: 'https://instagram.com/harborlinefinance',
    x_url: 'https://x.com/harborlinefin',
  },
  {
    id: 'c1100000-0000-4000-8000-000000000004',
    name: 'Atlas Commerce',
    logo_url: '/images/clients/atlas.svg',
    website_url: 'https://atlascommerce.example.com',
    display_permission: true,
    display_order: 4,
    is_visible: true,
    created_at: '2026-10-04T00:00:00.000Z',
    updated_at: '2026-10-04T00:00:00.000Z',
    type_of_company: 'E-Commerce & Retail',
    hero_domain: 'Global E-Commerce',
    tagline: 'Omnichannel marketplace scaling for lifestyle brands',
    description:
      'A fast-scaling multi-channel commerce platform enabling ambitious consumer brands to synchronize catalog feeds, streamline fulfillment pipelines, and accelerate regional marketplace growth.',
    operational_base: 'Southeast Asia (Singapore)',
    dedicated_capability: 'Catalog Ops, Retention & Growth Pod',
    linkedin_url: 'https://www.linkedin.com/company/atlas-commerce',
    facebook_url: 'https://facebook.com/atlascommerce',
    instagram_url: 'https://instagram.com/atlascommerce',
    x_url: 'https://x.com/atlascommerce',
  },
  {
    id: 'c1100000-0000-4000-8000-000000000005',
    name: 'Veridian Operations',
    logo_url: '/images/clients/veridian.svg',
    website_url: 'https://veridianops.example.com',
    display_permission: true,
    display_order: 5,
    is_visible: true,
    created_at: '2026-10-05T00:00:00.000Z',
    updated_at: '2026-10-05T00:00:00.000Z',
    type_of_company: 'Professional Services',
    hero_domain: 'Shared Services',
    tagline: 'Resilient operating models and strategic execution',
    description:
      'A leading corporate advisory and management consultancy designing high-agility shared services, automated business intelligence pipelines, and resilient operating models for multinational enterprises.',
    operational_base: 'Middle East (Dubai, UAE)',
    dedicated_capability: 'Executive Shared Services & BI Pod',
    linkedin_url: 'https://www.linkedin.com/company/veridian-operations',
    facebook_url: 'https://facebook.com/veridianops',
    instagram_url: 'https://instagram.com/veridianops',
    x_url: 'https://x.com/veridianops',
  },
]

export const DEFAULT_CLIENT_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1100000-0000-4000-8000-000000000001',
    client_id: 'c1100000-0000-4000-8000-000000000001',
    author_company: 'Northstar Labs',
    headline: 'Exceeded All Expectations on Velocity & Scale',
    author_name: 'Marcus Vance',
    author_role: 'VP of Engineering & Product Infrastructure',
    quote:
      'Outsource Pro Global integrated seamlessly into our GitHub and Jira workflows within two weeks. Their QA and full-stack engineering pod didn’t just execute sprint tickets—they overhauled our automated CI/CD pipeline, reducing release regression cycles by 65%. It feels like having our own senior in-house engineers down the hall.',
    rating: 5,
    photo_url: '/images/testimonial-marcus-vance.jpg',
    status: 'published',
    display_order: 1,
    consent_reference: 'OPG-CR-2026-NL',
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
    client: DEFAULT_CLIENTS[0],
  },
  {
    id: 't1100000-0000-4000-8000-000000000002',
    client_id: 'c1100000-0000-4000-8000-000000000002',
    author_company: 'Meridian Health',
    headline: 'Uncompromised Clinical Compliance & 24/7 Care',
    author_name: 'Dr. Eleanor Evans, MD',
    author_role: 'Chief Medical & Operations Officer',
    quote:
      'In digital health, empathy and compliance cannot be compromised. OPG built us a dedicated 24/7 clinical coordination pod that achieved a 99.8% SLA adherence rate and full HIPAA/Privacy compliance from month one. Our patients receive compassionate care within seconds, day or night.',
    rating: 5,
    photo_url: '/images/testimonial-eleanor-evans.jpg',
    status: 'published',
    display_order: 2,
    consent_reference: 'OPG-CR-2026-MH',
    created_at: '2026-10-02T00:00:00.000Z',
    updated_at: '2026-10-02T00:00:00.000Z',
    client: DEFAULT_CLIENTS[1],
  },
  {
    id: 't1100000-0000-4000-8000-000000000003',
    client_id: 'c1100000-0000-4000-8000-000000000003',
    author_company: 'Harborline Finance',
    headline: 'Slashing Fintech OpEx & Model Backlog by 48%',
    author_name: 'Alistair Finch, CFA',
    author_role: 'Head of Quantitative Risk & Regulatory Systems',
    quote:
      'Finding mathematically rigorous fintech talent with SOC 2 compliance discipline is notoriously difficult. The specialized modeling pod OPG assembled for Harborline exceeded every technical benchmark, slashing our model reconciliation backlog and lowering our operational overhead by 48%.',
    rating: 5,
    photo_url: '/images/testimonial-alistair-finch.jpg',
    status: 'published',
    display_order: 3,
    consent_reference: 'OPG-CR-2026-HF',
    created_at: '2026-10-03T00:00:00.000Z',
    updated_at: '2026-10-03T00:00:00.000Z',
    client: DEFAULT_CLIENTS[2],
  },
  {
    id: 't1100000-0000-4000-8000-000000000004',
    client_id: 'c1100000-0000-4000-8000-000000000004',
    author_company: 'Atlas Commerce',
    headline: 'Flawless Peak Synchronization Across 14 Hubs',
    author_name: 'Elena Rostova',
    author_role: 'Global Director of Supply Chain & E-Commerce Ops',
    quote:
      'When seasonal demand surges during Q4 peak events, OPG’s dedicated operations pod scales with us effortlessly. Their multi-lingual support and vendor reconciliation pods have eliminated order bottlenecks across 14 international fulfillment hubs with near-zero error rates.',
    rating: 5,
    photo_url: '/images/testimonial-elena-rostova.jpg',
    status: 'published',
    display_order: 4,
    consent_reference: 'OPG-CR-2026-AC',
    created_at: '2026-10-04T00:00:00.000Z',
    updated_at: '2026-10-04T00:00:00.000Z',
    client: DEFAULT_CLIENTS[3],
  },
  {
    id: 't1100000-0000-4000-8000-000000000005',
    client_id: 'c1100000-0000-4000-8000-000000000005',
    author_company: 'Veridian Operations',
    headline: 'The Gold Standard in Remote Delivery & Insights',
    author_name: 'David Sterling',
    author_role: 'Managing Director & Principal Consultant',
    quote:
      'OPG represents the gold standard in remote talent delivery. Their business intelligence pod engineered automated reporting pipelines that saved our executive team over 35 hours weekly in manual data assembly. The transparency, caliber, and proactive communication are unmatched.',
    rating: 5,
    photo_url: '/images/testimonial-david-sterling.jpg',
    status: 'published',
    display_order: 5,
    consent_reference: 'OPG-CR-2026-VO',
    created_at: '2026-10-05T00:00:00.000Z',
    updated_at: '2026-10-05T00:00:00.000Z',
    client: DEFAULT_CLIENTS[4],
  },
]

let seedPromise: Promise<boolean> | null = null

export async function seedDefaultClientsAndTestimonials(): Promise<boolean> {
  if (seedPromise) return seedPromise

  seedPromise = (async () => {
    try {
      const privileged = createPrivilegedClient()
      if (!privileged) return false

      // 1. Seed clients if table is empty or missing defaults
      const { data: existingClients } = await privileged
        .from('clients')
        .select('id, name')

      const existingNames = new Set(
        (existingClients || []).map((c) =>
          String(c.name || '').toLowerCase().trim(),
        ),
      )

      const clientsToInsert = DEFAULT_CLIENTS.filter(
        (c) => !existingNames.has(c.name.toLowerCase().trim()),
      ).map((c) => ({
        id: c.id,
        name: c.name,
        logo_url: c.logo_url,
        website_url: c.website_url,
        display_permission: c.display_permission,
        display_order: c.display_order,
        is_visible: c.is_visible,
        type_of_company: c.type_of_company || null,
        hero_domain: c.hero_domain || null,
        tagline: c.tagline || null,
        description: c.description || null,
        operational_base: c.operational_base || null,
        dedicated_capability: c.dedicated_capability || null,
        linkedin_url: c.linkedin_url || null,
        facebook_url: c.facebook_url || null,
        instagram_url: c.instagram_url || null,
        x_url: c.x_url || null,
      }))

      if (clientsToInsert.length > 0) {
        await privileged
          .from('clients')
          .upsert(clientsToInsert, { onConflict: 'id' })
      }

      // 2. Seed testimonials if table is empty
      const { data: existingTestimonials } = await privileged
        .from('testimonials')
        .select('id')

      if (!existingTestimonials || existingTestimonials.length === 0) {
        const testimonialsToInsert = DEFAULT_CLIENT_TESTIMONIALS.map((t) => ({
          id: t.id,
          client_id: t.client_id || null,
          author_company: t.author_company,
          headline: t.headline || null,
          quote: t.quote,
          author_name: t.author_name,
          author_role: t.author_role,
          photo_url: t.photo_url || null,
          rating: t.rating ?? 5,
          status: t.status,
          display_order: t.display_order,
          consent_reference: t.consent_reference,
        }))

        await privileged
          .from('testimonials')
          .upsert(testimonialsToInsert, { onConflict: 'id' })
        return true
      }
    } catch (err) {
      console.warn('Could not seed default client testimonials:', err)
    }
    return false
  })()

  return seedPromise
}

export async function getAllClients(): Promise<Client[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      void seedDefaultClientsAndTestimonials()
      return DEFAULT_CLIENTS
    }

    return data as Client[]
  } catch {
    return DEFAULT_CLIENTS
  }
}

export async function getVisibleClients(): Promise<Client[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      void seedDefaultClientsAndTestimonials()
      return DEFAULT_CLIENTS
    }

    return data as Client[]
  } catch {
    return DEFAULT_CLIENTS
  }
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('*, client:clients(*)')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      const fallback = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'published')
        .order('display_order', { ascending: true })

      if (fallback.error || !fallback.data || fallback.data.length === 0) {
        return DEFAULT_CLIENT_TESTIMONIALS.filter((t) => t.status === 'published')
      }
      return fallback.data as Testimonial[]
    }

    return data as Testimonial[]
  } catch {
    return DEFAULT_CLIENT_TESTIMONIALS.filter((t) => t.status === 'published')
  }
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('*, client:clients(*)')
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      const fallback = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })

      if (fallback.error || !fallback.data || fallback.data.length === 0) {
        void seedDefaultClientsAndTestimonials()
        return DEFAULT_CLIENT_TESTIMONIALS
      }
      return fallback.data as Testimonial[]
    }

    return data as Testimonial[]
  } catch {
    return DEFAULT_CLIENT_TESTIMONIALS
  }
}
