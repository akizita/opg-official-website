'use client'

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import { AdminPageHeader } from '@/components/admin/page-editor-ui'
import type { EditorSaveState } from '@/components/admin/use-page-editor-form'
import type { DocumentStatus } from '@/lib/content/page-documents'

export type PagesWorkspaceTab =
  'about' | 'clients' | 'home' | 'careers' | 'articles' | 'contact'

type PagesWorkspaceProps = {
  aboutForm: ReactNode
  articlesForm: ReactNode
  careersForm: ReactNode
  clientsForm: ReactNode
  contactForm: ReactNode
  homeForm: ReactNode
  initialMeta: Record<PagesWorkspaceTab, PageWorkspaceMeta>
  initialTab: PagesWorkspaceTab
}

export type PageWorkspaceMeta = {
  dirty: boolean
  saveState: EditorSaveState
  status: DocumentStatus
  updatedAt: string | null
  version: number
}

const tabs: Array<{
  description: string
  id: PagesWorkspaceTab
  label: string
}> = [
  {
    description: 'Edit every Home page section and its search appearance.',
    id: 'home',
    label: 'Home',
  },
  {
    description: 'Edit every About Us page section and its search appearance.',
    id: 'about',
    label: 'About Us',
  },
  {
    description: 'Edit every Clients page section and its search appearance.',
    id: 'clients',
    label: 'Clients',
  },
  {
    description: 'Edit career page sections and search appearance.',
    id: 'careers',
    label: 'Careers',
  },
]

function WorkspaceIcon({ name }: { name: PagesWorkspaceTab }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === 'home' ? (
        <>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10M9 20v-6h6v6" />
        </>
      ) : null}
      {name === 'about' ? (
        <>
          <path d="M5 21V5h9l5 5v11z" />
          <path d="M14 5v5h5M9 14h6M9 17h6" />
        </>
      ) : null}
      {name === 'clients' ? (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" />
        </>
      ) : null}
      {name === 'careers' || name === 'articles' || name === 'contact' ? (
        <>
          <path d="M5 21V5h9l5 5v11z" />
          <path d="M14 5v5h5M9 14h6M9 17h6" />
        </>
      ) : null}
    </svg>
  )
}

function tabFromLocation(): PagesWorkspaceTab {
  const tab = new URLSearchParams(window.location.search).get('tab')
  return tabs.some((item) => item.id === tab)
    ? (tab as PagesWorkspaceTab)
    : 'home'
}

function confirmDiscardChanges() {
  return window.confirm(
    'You have unsaved changes. Leave this page without saving them?',
  )
}

export function PageTabs({
  activeTab,
  onChange,
}: {
  activeTab: PagesWorkspaceTab
  onChange: (tab: PagesWorkspaceTab) => void
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    }
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1

    if (nextIndex === null) return

    event.preventDefault()
    onChange(tabs[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      aria-label="Select a page to edit"
      aria-orientation="horizontal"
      className="pages-workspace__tabs"
      role="tablist"
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id

        return (
          <button
            aria-controls={`pages-panel-${tab.id}`}
            aria-selected={isActive}
            className="pages-workspace__tab"
            id={`pages-tab-${tab.id}`}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            <WorkspaceIcon name={tab.id} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function PagesWorkspace({
  aboutForm,
  articlesForm,
  careersForm,
  clientsForm,
  contactForm,
  homeForm,
  initialMeta,
  initialTab,
}: PagesWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PagesWorkspaceTab>(initialTab)
  const [pageMeta, setPageMeta] = useState(initialMeta)
  const activePage = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  useEffect(() => {
    const handleEditorState = (event: Event) => {
      const detail = (
        event as CustomEvent<PageWorkspaceMeta & { tab: PagesWorkspaceTab }>
      ).detail

      if (!detail || !tabs.some((tab) => tab.id === detail.tab)) return

      setPageMeta((current) => ({
        ...current,
        [detail.tab]: {
          dirty: detail.dirty,
          saveState: detail.saveState,
          status: detail.status,
          updatedAt: detail.updatedAt,
          version: detail.version,
        },
      }))
    }

    window.addEventListener('opg-editor-state', handleEditorState)
    return () =>
      window.removeEventListener('opg-editor-state', handleEditorState)
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!Object.values(pageMeta).some((meta) => meta.dirty)) return
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pageMeta])

  useEffect(() => {
    const handleDocumentNavigation = (event: globalThis.MouseEvent) => {
      if (!Object.values(pageMeta).some((meta) => meta.dirty)) return
      if (!(event.target instanceof Element)) return

      const link = event.target.closest<HTMLAnchorElement>('a[href]')
      if (!link || link.target === '_blank') {
        return
      }

      const destination = new URL(link.href, window.location.href)
      const current = new URL(window.location.href)
      if (
        destination.pathname === current.pathname &&
        destination.search === current.search
      ) {
        return
      }

      if (confirmDiscardChanges()) return
      event.preventDefault()
      event.stopPropagation()
    }

    document.addEventListener('click', handleDocumentNavigation, true)
    return () =>
      document.removeEventListener('click', handleDocumentNavigation, true)
  }, [pageMeta])

  useEffect(() => {
    const handlePopState = () => {
      const nextTab = tabFromLocation()
      if (nextTab === activeTab) return
      if (pageMeta[activeTab].dirty && !confirmDiscardChanges()) {
        window.history.pushState(null, '', `?tab=${activeTab}`)
        return
      }
      if (pageMeta[activeTab].dirty)
        window.dispatchEvent(
          new CustomEvent('opg-editor-discard', { detail: { tab: activeTab } }),
        )
      setActiveTab(nextTab)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [activeTab, pageMeta])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('tab') === initialTab) return

    url.searchParams.set('tab', initialTab)
    window.history.replaceState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    )
  }, [initialTab])

  const setTab = (tab: PagesWorkspaceTab) => {
    if (tab === activeTab) return
    if (pageMeta[activeTab].dirty && !confirmDiscardChanges()) return
    if (pageMeta[activeTab].dirty)
      window.dispatchEvent(
        new CustomEvent('opg-editor-discard', { detail: { tab: activeTab } }),
      )

    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    )
  }

  return (
    <>
      <AdminPageHeader
        description={activePage.description}
        pageName={`${activePage.label} page`}
      />

      <PageTabs activeTab={activeTab} onChange={setTab} />

      <div
        aria-labelledby="pages-tab-home"
        className="pages-workspace__panel"
        hidden={activeTab !== 'home'}
        id="pages-panel-home"
        role="tabpanel"
        tabIndex={0}
      >
        {homeForm}
      </div>

      <div
        aria-labelledby="pages-tab-about"
        className="pages-workspace__panel"
        hidden={activeTab !== 'about'}
        id="pages-panel-about"
        role="tabpanel"
        tabIndex={0}
      >
        {aboutForm}
      </div>
      <div
        aria-labelledby="pages-tab-clients"
        className="pages-workspace__panel"
        hidden={activeTab !== 'clients'}
        id="pages-panel-clients"
        role="tabpanel"
        tabIndex={0}
      >
        {clientsForm}
      </div>
      <div
        aria-labelledby="pages-tab-careers"
        className="pages-workspace__panel"
        hidden={activeTab !== 'careers'}
        id="pages-panel-careers"
        role="tabpanel"
        tabIndex={0}
      >
        {careersForm}
      </div>
      <div
        aria-labelledby="pages-tab-articles"
        className="pages-workspace__panel"
        hidden={activeTab !== 'articles'}
        id="pages-panel-articles"
        role="tabpanel"
        tabIndex={0}
      >
        {articlesForm}
      </div>
      <div
        aria-labelledby="pages-tab-contact"
        className="pages-workspace__panel"
        hidden={activeTab !== 'contact'}
        id="pages-panel-contact"
        role="tabpanel"
        tabIndex={0}
      >
        {contactForm}
      </div>
    </>
  )
}
