import type { Metadata } from 'next'

import {
  VisualPagesEditor,
  type VisualPageDraft,
} from '@/components/admin/visual-pages-editor'
import { requireAdminSession } from '@/lib/auth/admin-session'
import {
  canEditDraft,
  canManageMedia,
  canPublish,
} from '@/lib/auth/permissions'
import {
  CLIENT_PAGE_DEFAULTS,
  extractClientPageContent,
} from '@/lib/content/client-page'
import { getMediaAssets } from '@/lib/content/media'
import {
  ABOUT_COPY_SECTIONS,
  ARTICLES_COPY_SECTIONS,
  CAREERS_COPY_SECTIONS,
  CLIENTS_COPY_SECTIONS,
  CONTACT_COPY_SECTIONS,
  HOME_COPY_SECTIONS,
  type CopySection,
  getAboutPageCopy,
  getPageCopy,
} from '@/lib/content/page-copy'
import type { PageDocument } from '@/lib/content/page-documents'
import {
  getPageVisualConfig,
  type VisualPage,
  VISUAL_PAGES,
} from '@/lib/content/page-visual'
import { ABOUT_PAGE_DEFAULTS } from '@/lib/content/site-page-defaults'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Pages | OPG Admin' }

type AdminPagesProps = { searchParams: Promise<{ tab?: string }> }

function baseDraft(
  document: PageDocument | null,
  sections: readonly CopySection[],
): VisualPageDraft {
  return {
    title: document?.title ?? '',
    summary: document?.summary ?? '',
    copy: getPageCopy(document?.content, sections),
    visual: getPageVisualConfig(document?.content),
    seoTitle: document?.seo_title ?? '',
    seoDescription: document?.seo_description ?? '',
    ogImageUrl: document?.og_image_url ?? '',
    canonicalUrl: document?.canonical_url ?? '',
    status: document?.status ?? 'draft',
    version: document?.version ?? 0,
    updatedAt: document?.updated_at ?? null,
  }
}

export default async function AdminPages({ searchParams }: AdminPagesProps) {
  const session = await requireAdminSession({ requireAal2: true })
  const { tab } = await searchParams
  const initialPage: VisualPage =
    tab && Object.prototype.hasOwnProperty.call(VISUAL_PAGES, tab)
      ? (tab as VisualPage)
      : 'home'

  const supabase = await createClient()
  const [
    { data: home },
    { data: about },
    { data: clients },
    { data: careers },
    { data: articles },
    { data: contact },
    { data: legacyMission },
    media,
  ] = await Promise.all([
    supabase.from('page_documents').select('*').eq('slug', 'home').maybeSingle<PageDocument>(),
    supabase.from('page_documents').select('*').eq('slug', 'about').maybeSingle<PageDocument>(),
    supabase.from('page_documents').select('*').eq('slug', 'clients').maybeSingle<PageDocument>(),
    supabase.from('page_documents').select('*').eq('slug', 'careers').maybeSingle<PageDocument>(),
    supabase.from('page_documents').select('*').eq('slug', 'articles').maybeSingle<PageDocument>(),
    supabase.from('page_documents').select('*').eq('slug', 'contact').maybeSingle<PageDocument>(),
    supabase.from('page_documents').select('*').eq('slug', 'mission-and-vision').maybeSingle<PageDocument>(),
    getMediaAssets('all', supabase),
  ])

  const homeDraft = baseDraft(home, HOME_COPY_SECTIONS)
  homeDraft.title = home?.title ?? 'The right people can move every business forward.'
  homeDraft.summary =
    home?.summary ??
    'Outsourced Pro Global helps organizations build strong teams and helps professionals discover their next opportunity.'

  const aboutDraft = baseDraft(about, ABOUT_COPY_SECTIONS)
  aboutDraft.title = about?.title ?? ABOUT_PAGE_DEFAULTS.title
  aboutDraft.summary = about?.summary ?? ABOUT_PAGE_DEFAULTS.summary
  aboutDraft.body =
    (Array.isArray(about?.content) ? about.content : [])
      .flatMap((block) => block.type === 'paragraph' && !block.key ? [block.content] : [])
      .join('\n\n') || ABOUT_PAGE_DEFAULTS.body
  aboutDraft.copy = getAboutPageCopy(about?.content, legacyMission)

  const clientsDraft = baseDraft(clients, CLIENTS_COPY_SECTIONS)
  clientsDraft.title = clients?.title ?? CLIENT_PAGE_DEFAULTS.title
  clientsDraft.summary = clients?.summary ?? CLIENT_PAGE_DEFAULTS.summary
  const clientsEditorial = extractClientPageContent(clients?.content)
  clientsDraft.editorialTitle = clientsEditorial.editorialTitle
  clientsDraft.editorialLead = clientsEditorial.editorialLead

  const careersDraft = baseDraft(careers, CAREERS_COPY_SECTIONS)
  careersDraft.title = careersDraft.copy.heroTitle
  careersDraft.summary = careersDraft.copy.heroLead
  const articlesDraft = baseDraft(articles, ARTICLES_COPY_SECTIONS)
  articlesDraft.title = articlesDraft.copy.pageTitle
  articlesDraft.summary = articlesDraft.copy.collectionLead
  const contactDraft = baseDraft(contact, CONTACT_COPY_SECTIONS)
  contactDraft.title = contactDraft.copy.heroTitle
  contactDraft.summary = contactDraft.copy.heroLead

  return (
    <section className="admin-page visual-admin-page">
      <VisualPagesEditor
        initialPage={initialPage}
        initialPages={{
          home: homeDraft,
          about: aboutDraft,
          clients: clientsDraft,
          careers: careersDraft,
          articles: articlesDraft,
          contact: contactDraft,
        }}
        media={media}
        permissions={{
          canEditDraft: canEditDraft(session.profile.roleKey),
          canPublish: canPublish(session.profile.roleKey),
          canManageMedia: canManageMedia(session.profile.roleKey),
        }}
      />
    </section>
  )
}
