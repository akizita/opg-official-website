'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react'

import {
  bulkDeleteClientsAction,
  bulkSetClientsVisibilityAction,
  type ClientActionState,
  deleteClientAction,
  saveClientAction,
  toggleClientVisibilityAction,
} from '@/app/admin/clients/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconCheck,
  OpgIconClients,
  OpgIconClose,
  OpgIconEdit,
  OpgIconMore,
  OpgIconPlus,
  OpgIconSearch,
  OpgIconTrash,
  OpgIconUpload,
} from '@/components/icons/opg-icons'
import {
  ClientsRealtimeSync,
  notifyClientsChanged,
} from '@/components/ui/clients-realtime-sync'
import { canEditDraft } from '@/lib/auth/permissions'
import { resolveSafeClientLogo } from '@/lib/content/client-logo'
import type { Client } from '@/lib/content/clients'

import styles from './clients.module.css'

type VisibilityFilter = 'all' | 'active' | 'hidden'

const initialClientActionState: ClientActionState = {
  status: 'idle',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'CL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function ClientsManager({
  clients,
  roleKey,
}: {
  clients: Client[]
  roleKey: string
}) {
  const router = useRouter()
  const canManage = canEditDraft(roleKey)
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all')

  const [openMenuClientId, setOpenMenuClientId] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<
    | { mode: 'single'; client: Client }
    | { mode: 'bulk'; clients: Client[] }
    | null
  >(null)
  const [banner, setBanner] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Modal Form State — 1:1 with Partner Profile section fields
  const [name, setName] = useState('')
  const [typeOfCompany, setTypeOfCompany] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [operationalBase, setOperationalBase] = useState('')
  const [dedicatedCapability, setDedicatedCapability] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [localLogoPreview, setLocalLogoPreview] = useState('')
  const [removeLogo, setRemoveLogo] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const [formState, formAction, isSaving] = useActionState(
    async (prevState: ClientActionState, formData: FormData) => {
      const next = await saveClientAction(prevState, formData)
      if (next.status === 'success') {
        setIsModalOpen(false)
        setEditingClient(null)
        setLocalLogoPreview((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
          return ''
        })
        setBanner({
          type: 'success',
          text: next.message || 'Client profile updated.',
        })
        notifyClientsChanged()
        router.refresh()
      }
      return next
    },
    initialClientActionState,
  )

  useEffect(() => {
    if (!isModalOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isModalOpen])

  useEffect(() => {
    if (!openMenuClientId) return
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target?.closest('[data-card-menu="true"]')) {
        setOpenMenuClientId(null)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuClientId(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [openMenuClientId])

  const openAddModal = () => {
    setOpenMenuClientId(null)
    setEditingClient(null)
    setName('')
    setTypeOfCompany('')
    setTagline('')
    setDescription('')
    setOperationalBase('')
    setDedicatedCapability('')
    setWebsiteUrl('')
    setLinkedinUrl('')
    setFacebookUrl('')
    setInstagramUrl('')
    setXUrl('')
    setLogoUrl('')
    setLocalLogoPreview('')
    setRemoveLogo(false)
    setIsVisible(true)
    setBanner(null)
    setIsModalOpen(true)
  }

  const openEditModal = (client: Client) => {
    setOpenMenuClientId(null)
    setEditingClient(client)
    setName(client.name)
    setTypeOfCompany(client.type_of_company || '')
    setTagline(client.tagline || '')
    setDescription(client.description || '')
    setOperationalBase(client.operational_base || '')
    setDedicatedCapability(client.dedicated_capability || '')
    setWebsiteUrl(client.website_url || '')
    setLinkedinUrl(client.linkedin_url || '')
    setFacebookUrl(client.facebook_url || '')
    setInstagramUrl(client.instagram_url || '')
    setXUrl(client.x_url || '')
    setLogoUrl(client.logo_url || '')
    setLocalLogoPreview('')
    setRemoveLogo(false)
    setIsVisible(client.is_visible)
    setBanner(null)
    setIsModalOpen(true)
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRemoveLogo(false)
    setLocalLogoPreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const industryOptions = useMemo(() => {
    const unique = new Set<string>()
    for (const client of clients) {
      const badge = client.type_of_company?.trim()
      if (badge) unique.add(badge)
    }
    return Array.from(unique).sort((a, b) =>
      a.localeCompare(b, 'en', { sensitivity: 'base' }),
    )
  }, [clients])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    return clients
      .filter((client) => {
        if (visibilityFilter === 'active' && !client.is_visible) return false
        if (visibilityFilter === 'hidden' && client.is_visible) return false
        if (
          industryFilter !== 'all' &&
          (client.type_of_company || '').trim() !== industryFilter
        ) {
          return false
        }
        if (query) {
          const hit =
            client.name.toLowerCase().includes(query) ||
            (client.type_of_company || '').toLowerCase().includes(query) ||
            (client.tagline || '').toLowerCase().includes(query) ||
            (client.operational_base || '').toLowerCase().includes(query) ||
            (client.dedicated_capability || '').toLowerCase().includes(query) ||
            (client.description || '').toLowerCase().includes(query)
          if (!hit) return false
        }
        return true
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
      )
  }, [clients, visibilityFilter, industryFilter, search])

  const validSelectedIds = useMemo(() => {
    const clientSet = new Set(clients.map((c) => c.id))
    return Array.from(selectedIds).filter((id) => clientSet.has(id))
  }, [clients, selectedIds])

  const selectedSet = useMemo(
    () => new Set(validSelectedIds),
    [validSelectedIds],
  )

  const selectedClients = useMemo(
    () => clients.filter((c) => selectedSet.has(c.id)),
    [clients, selectedSet],
  )

  const previewSource = removeLogo
    ? ''
    : localLogoPreview || logoUrl.trim()

  const handleToggleVisibility = (client: Client) => {
    setOpenMenuClientId(null)
    startTransition(async () => {
      try {
        await toggleClientVisibilityAction(client.id, !client.is_visible)
        setBanner({
          type: 'success',
          text: `${client.name} is now ${!client.is_visible ? 'visible in Partner Profiles' : 'hidden from the website'}.`,
        })
        notifyClientsChanged()
        router.refresh()
      } catch (err) {
        setBanner({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Could not update client visibility.',
        })
      }
    })
  }

  const handleToggleSelectionMode = () => {
    setOpenMenuClientId(null)
    setIsSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }

  const toggleClientSelected = (clientId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const allFilteredSelected =
    filteredClients.length > 0 &&
    filteredClients.every((c) => selectedSet.has(c.id))

  const handleToggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const client of filteredClients) {
          next.delete(client.id)
        }
      } else {
        for (const client of filteredClients) {
          next.add(client.id)
        }
      }
      return next
    })
  }

  const handleBulkVisibility = (nextVisible: boolean) => {
    if (validSelectedIds.length === 0) return
    startTransition(async () => {
      try {
        const res = await bulkSetClientsVisibilityAction(
          validSelectedIds,
          nextVisible,
        )
        setSelectedIds(new Set())
        setIsSelectionMode(false)
        setBanner({
          type: 'success',
          text: `${res.count} client${res.count === 1 ? '' : 's'} ${
            nextVisible
              ? 'restored to Partner Profiles'
              : 'hidden from the website'
          }.`,
        })
        notifyClientsChanged()
        router.refresh()
      } catch (err) {
        setBanner({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Could not update selected clients.',
        })
      }
    })
  }

  return (
    <div className={styles.workspace}>
      <ClientsRealtimeSync />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>Clients Management</h1>
          <p className={styles.subtitle}>
            Manage client logos, partner profiles, operational bases,
            capabilities, and social links. Updates sync in real time to the
            Clients Partner Profile directory.
          </p>
        </div>

        {canManage && (
          <button
            className={styles.addClientBtn}
            onClick={openAddModal}
            type="button"
          >
            <OpgIconPlus size={16} />
            <span>Add Client</span>
          </button>
        )}
      </header>

      {/* Live Status Feedback */}
      {banner && (
        <div
          className={`${styles.toast} ${
            banner.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
          role="status"
        >
          <span>{banner.text}</span>
          <button
            aria-label="Dismiss message"
            className={styles.modalCloseBtn}
            onClick={() => setBanner(null)}
            type="button"
          >
            <OpgIconClose size={14} />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <OpgIconSearch className={styles.searchIcon} size={16} />
          <input
            aria-label="Search client partners"
            className={styles.searchInput}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, industry, base, or capability…"
            type="text"
            value={search}
          />
          {search && (
            <button
              aria-label="Clear search"
              className={styles.searchClearBtn}
              onClick={() => setSearch('')}
              type="button"
            >
              <OpgIconClose size={12} />
            </button>
          )}
        </div>

        <div className={styles.filterCluster}>
          <select
            aria-label="Filter by industry"
            className={styles.categorySelect}
            onChange={(e) => setIndustryFilter(e.target.value)}
            value={industryFilter}
          >
            <option value="all">All Industries</option>
            {industryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className={styles.statusTabs} role="tablist">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Visible' },
                { id: 'hidden', label: 'Hidden' },
              ] as const
            ).map((tab) => (
              <button
                aria-selected={visibilityFilter === tab.id}
                className={`${styles.statusTab} ${
                  visibilityFilter === tab.id ? styles.statusTabActive : ''
                }`}
                key={tab.id}
                onClick={() => setVisibilityFilter(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {canManage && (
            <button
              aria-pressed={isSelectionMode}
              className={`${styles.selectModeBtn} ${
                isSelectionMode ? styles.selectModeBtnActive : ''
              }`}
              onClick={handleToggleSelectionMode}
              type="button"
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
          )}
        </div>
      </div>

      {/* Multi-Select Bulk Action Bar */}
      {canManage && isSelectionMode && (
        <div
          aria-label="Bulk client actions"
          className={styles.bulkBar}
          role="region"
        >
          <div className={styles.bulkSummary}>
            <span className={styles.bulkCount}>
              {validSelectedIds.length} selected
            </span>
            <button
              className={styles.bulkSelectAllBtn}
              onClick={handleToggleSelectAllFiltered}
              type="button"
            >
              {allFilteredSelected
                ? 'Deselect All'
                : `Select All (${filteredClients.length})`}
            </button>
          </div>

          <div className={styles.bulkActions}>
            <button
              className={styles.bulkBtn}
              disabled={validSelectedIds.length === 0 || isPending}
              onClick={() => handleBulkVisibility(false)}
              type="button"
            >
              Hide Selected
            </button>
            <button
              className={styles.bulkBtn}
              disabled={validSelectedIds.length === 0 || isPending}
              onClick={() => handleBulkVisibility(true)}
              type="button"
            >
              Show Selected
            </button>
            <button
              className={styles.bulkDeleteBtn}
              disabled={validSelectedIds.length === 0 || isPending}
              onClick={() =>
                setDeleteTarget({ mode: 'bulk', clients: selectedClients })
              }
              type="button"
            >
              <OpgIconTrash size={14} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className={styles.grid}>
          {filteredClients.map((client) => {
            const safeLogo = resolveSafeClientLogo(client.logo_url)
            const isSelected = isSelectionMode && selectedSet.has(client.id)
            const isMenuOpen = !isSelectionMode && openMenuClientId === client.id

            return (
              <article
                className={`${styles.clientCard} ${
                  !client.is_visible ? styles.clientCardHidden : ''
                } ${isSelectionMode ? styles.clientCardSelectable : ''} ${
                  isSelected ? styles.clientCardSelected : ''
                } ${isMenuOpen ? styles.clientCardMenuOpen : ''}`}
                key={client.id}
                onClick={
                  isSelectionMode
                    ? () => toggleClientSelected(client.id)
                    : undefined
                }
              >
                <div>
                  <div className={styles.clientTop}>
                    <div className={styles.logoFrame}>
                      {safeLogo ? (
                        <Image
                          alt={`${client.name} logo`}
                          className={styles.logoImg}
                          height={48}
                          src={safeLogo.src}
                          unoptimized={safeLogo.unoptimized}
                          width={48}
                        />
                      ) : (
                        <span className={styles.logoInitials}>
                          {getInitials(client.name)}
                        </span>
                      )}
                    </div>

                    <div className={styles.clientIdentity}>
                      <div className={styles.clientNameRow}>
                        <h2 className={styles.clientName} title={client.name}>
                          {client.name}
                        </h2>

                        {canManage && isSelectionMode ? (
                          <button
                            aria-label={
                              isSelected
                                ? `Deselect ${client.name}`
                                : `Select ${client.name}`
                            }
                            aria-pressed={isSelected}
                            className={`${styles.selectionIndicator} ${
                              isSelected ? styles.selectionIndicatorActive : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleClientSelected(client.id)
                            }}
                            type="button"
                          >
                            <OpgIconCheck size={13} />
                          </button>
                        ) : (
                          canManage && (
                            <div
                              className={styles.cardMenuWrap}
                              data-card-menu="true"
                            >
                              <button
                                aria-expanded={isMenuOpen}
                                aria-haspopup="menu"
                                aria-label={`Actions for ${client.name}`}
                                className={styles.moreBtn}
                                onClick={() =>
                                  setOpenMenuClientId((prev) =>
                                    prev === client.id ? null : client.id,
                                  )
                                }
                                type="button"
                              >
                                <OpgIconMore size={17} />
                              </button>

                              {isMenuOpen && (
                                <div className={styles.cardMenu} role="menu">
                                  <button
                                    className={styles.cardMenuItem}
                                    onClick={() => openEditModal(client)}
                                    role="menuitem"
                                    type="button"
                                  >
                                    <OpgIconEdit size={14} />
                                    <span>Edit Client</span>
                                  </button>
                                  <button
                                    className={styles.cardMenuItem}
                                    onClick={() => handleToggleVisibility(client)}
                                    role="menuitem"
                                    type="button"
                                  >
                                    <span>
                                      {client.is_visible
                                        ? 'Hide from Website'
                                        : 'Show on Website'}
                                    </span>
                                  </button>
                                  <div className={styles.cardMenuDivider} />
                                  <button
                                    className={`${styles.cardMenuItem} ${styles.cardMenuItemDanger}`}
                                    onClick={() => {
                                      setOpenMenuClientId(null)
                                      setDeleteTarget({
                                        mode: 'single',
                                        client,
                                      })
                                    }}
                                    role="menuitem"
                                    type="button"
                                  >
                                    <OpgIconTrash size={14} />
                                    <span>Delete Client</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>

                      <p className={styles.clientBadge}>
                        {client.type_of_company || 'Strategic Partner'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.clientMetaRow}>
                  {client.operational_base && (
                    <span className={styles.regionPill}>
                      {client.operational_base}
                    </span>
                  )}
                  <span
                    className={`${styles.visibilityPill} ${
                      client.is_visible
                        ? styles.visibilityActive
                        : styles.visibilityHidden
                    }`}
                  >
                    ● {client.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>

                {client.tagline && (
                  <p className={styles.clientTagline}>{client.tagline}</p>
                )}

                {client.description && (
                  <p className={styles.clientDescription}>
                    {client.description}
                  </p>
                )}

                {client.dedicated_capability && (
                  <div className={styles.capabilityFooter}>
                    <span className={styles.capabilityLabel}>
                      Dedicated Capability
                    </span>
                    <span className={styles.capabilityValue}>
                      {client.dedicated_capability}
                    </span>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <OpgIconClients size={38} />
          <h2 className={styles.emptyTitle}>No Client Partners Found</h2>
          <p className={styles.emptyDesc}>
            {search.trim()
              ? `No clients matched "${search}". Try adjusting your search or filters.`
              : 'Add your first client partner profile to display it in the /clients Partner Profile section.'}
          </p>
          {canManage && (
            <button
              className={styles.addClientBtn}
              onClick={openAddModal}
              type="button"
            >
              <OpgIconPlus size={16} />
              <span>Add Client</span>
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Client Partner Modal */}
      {isModalOpen && (
        <div
          aria-labelledby="client-modal-title"
          aria-modal="true"
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false)
          }}
          role="dialog"
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="client-modal-title">
                  {editingClient
                    ? `Edit ${editingClient.name}`
                    : 'Add Client Partner'}
                </h2>
                <p className={styles.modalSubtitle}>
                  Updates sync live to the Partner Profile section on /clients.
                </p>
              </div>
              <button
                aria-label="Close modal"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <OpgIconClose size={15} />
              </button>
            </div>

            <form action={formAction} className={styles.modalForm}>
              <input
                name="id"
                type="hidden"
                value={editingClient?.id || ''}
              />
              <input
                name="remove_logo"
                type="hidden"
                value={removeLogo ? 'true' : 'false'}
              />
              <input
                name="is_visible"
                type="hidden"
                value={isVisible ? 'true' : 'false'}
              />

              {formState.status === 'error' && formState.message && (
                <div
                  className={`${styles.toast} ${styles.toastError}`}
                  role="alert"
                >
                  <span>{formState.message}</span>
                </div>
              )}

              {/* Logo Upload + URL */}
              <div className={styles.logoSection}>
                <div className={styles.modalLogoPreview}>
                  {previewSource ? (
                    (() => {
                      const img = previewSource.startsWith('blob:')
                        ? { src: previewSource, unoptimized: true }
                        : resolveSafeClientLogo(previewSource)
                      return img ? (
                        <Image
                          alt="Partner logo preview"
                          className={styles.logoImg}
                          height={56}
                          src={img.src}
                          unoptimized={img.unoptimized}
                          width={56}
                        />
                      ) : (
                        <span className={styles.logoInitials}>
                          {getInitials(name || 'CL')}
                        </span>
                      )
                    })()
                  ) : (
                    <span className={styles.logoInitials}>
                      {getInitials(name || 'CL')}
                    </span>
                  )}
                </div>

                <div className={styles.logoControls}>
                  <div className={styles.logoButtons}>
                    <label
                      className={styles.uploadLabelBtn}
                      htmlFor="client-logo-file-input"
                    >
                      <OpgIconUpload size={14} />
                      <span>Upload Logo</span>
                    </label>
                    <input
                      accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                      className={styles.fileUploadInput}
                      id="client-logo-file-input"
                      name="logo_file"
                      onChange={handleLogoFileChange}
                      type="file"
                    />
                    {previewSource && (
                      <button
                        className={styles.removeLogoBtn}
                        onClick={() => {
                          setRemoveLogo(true)
                          setLogoUrl('')
                          setLocalLogoPreview('')
                        }}
                        type="button"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>

                  <input
                    aria-label="Partner Logo URL"
                    className={styles.input}
                    name="logo_url"
                    onChange={(e) => {
                      setRemoveLogo(false)
                      setLogoUrl(e.target.value)
                    }}
                    placeholder="Or paste logo URL (https://... or /images/clients/...)"
                    type="text"
                    value={removeLogo ? '' : logoUrl}
                  />
                  {formState.errors?.logo && (
                    <span className={styles.fieldError}>
                      {formState.errors.logo}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="client-name">
                    Company Name *
                  </label>
                  <input
                    className={styles.input}
                    id="client-name"
                    maxLength={120}
                    name="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Northstar Labs"
                    required
                    type="text"
                    value={name}
                  />
                  {formState.errors?.name && (
                    <span className={styles.fieldError}>
                      {formState.errors.name}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="client-type">
                    Industry / Badge *
                  </label>
                  <input
                    className={styles.input}
                    id="client-type"
                    maxLength={100}
                    name="type_of_company"
                    onChange={(e) => setTypeOfCompany(e.target.value)}
                    placeholder="e.g. Enterprise Software"
                    required
                    type="text"
                    value={typeOfCompany}
                  />
                  {formState.errors?.type_of_company && (
                    <span className={styles.fieldError}>
                      {formState.errors.type_of_company}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="client-tagline">
                  Tagline *
                </label>
                <input
                  className={styles.input}
                  id="client-tagline"
                  maxLength={200}
                  name="tagline"
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Cloud-native enterprise workflow intelligence"
                  required
                  type="text"
                  value={tagline}
                />
                {formState.errors?.tagline && (
                  <span className={styles.fieldError}>
                    {formState.errors.tagline}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="client-description">
                  Description *
                </label>
                <textarea
                  className={styles.textarea}
                  id="client-description"
                  maxLength={1000}
                  name="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of the partner organization and engagement…"
                  required
                  rows={3}
                  value={description}
                />
                {formState.errors?.description && (
                  <span className={styles.fieldError}>
                    {formState.errors.description}
                  </span>
                )}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="client-base">
                    Operational Base *
                  </label>
                  <input
                    className={styles.input}
                    id="client-base"
                    maxLength={140}
                    name="operational_base"
                    onChange={(e) => setOperationalBase(e.target.value)}
                    placeholder="e.g. North America (San Francisco, CA)"
                    required
                    type="text"
                    value={operationalBase}
                  />
                  {formState.errors?.operational_base && (
                    <span className={styles.fieldError}>
                      {formState.errors.operational_base}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="client-capability">
                    Dedicated Capability *
                  </label>
                  <input
                    className={styles.input}
                    id="client-capability"
                    maxLength={160}
                    name="dedicated_capability"
                    onChange={(e) => setDedicatedCapability(e.target.value)}
                    placeholder="e.g. Full-Stack Engineering & QA Automation Pod"
                    required
                    type="text"
                    value={dedicatedCapability}
                  />
                  {formState.errors?.dedicated_capability && (
                    <span className={styles.fieldError}>
                      {formState.errors.dedicated_capability}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="client-website">
                  Official Website URL
                </label>
                <input
                  className={styles.input}
                  id="client-website"
                  name="website_url"
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                  value={websiteUrl}
                />
                {formState.errors?.website_url && (
                  <span className={styles.fieldError}>
                    {formState.errors.website_url}
                  </span>
                )}
              </div>

              <div className={styles.socialGroup}>
                <span className={styles.socialGroupTitle}>
                  Social Links (Optional)
                </span>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="client-linkedin">
                      LinkedIn
                    </label>
                    <input
                      className={styles.input}
                      id="client-linkedin"
                      name="linkedin_url"
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                      type="url"
                      value={linkedinUrl}
                    />
                    {formState.errors?.linkedin_url && (
                      <span className={styles.fieldError}>
                        {formState.errors.linkedin_url}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="client-facebook">
                      Facebook
                    </label>
                    <input
                      className={styles.input}
                      id="client-facebook"
                      name="facebook_url"
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/..."
                      type="url"
                      value={facebookUrl}
                    />
                    {formState.errors?.facebook_url && (
                      <span className={styles.fieldError}>
                        {formState.errors.facebook_url}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="client-instagram">
                      Instagram
                    </label>
                    <input
                      className={styles.input}
                      id="client-instagram"
                      name="instagram_url"
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/..."
                      type="url"
                      value={instagramUrl}
                    />
                    {formState.errors?.instagram_url && (
                      <span className={styles.fieldError}>
                        {formState.errors.instagram_url}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="client-x">
                      X (Twitter)
                    </label>
                    <input
                      className={styles.input}
                      id="client-x"
                      name="x_url"
                      onChange={(e) => setXUrl(e.target.value)}
                      placeholder="https://x.com/..."
                      type="url"
                      value={xUrl}
                    />
                    {formState.errors?.x_url && (
                      <span className={styles.fieldError}>
                        {formState.errors.x_url}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.visibilityRow}>
                <div>
                  <div className={styles.label}>Show on Public Website</div>
                  <div className={styles.modalSubtitle}>
                    Display in the Partner Profile section on /clients
                  </div>
                </div>
                <button
                  aria-checked={isVisible}
                  aria-label="Toggle public website visibility"
                  className={`${styles.switchBtn} ${
                    isVisible ? styles.switchBtnActive : ''
                  }`}
                  onClick={() => setIsVisible((prev) => !prev)}
                  role="switch"
                  type="button"
                >
                  <span className={styles.switchThumb} />
                </button>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.saveBtn}
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving
                    ? 'Saving…'
                    : editingClient
                      ? 'Save Changes'
                      : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single or Bulk Delete Confirmation Modal */}
      <AdminConfirmDialog
        cancelText="Cancel"
        confirmText={
          deleteTarget?.mode === 'bulk'
            ? `Delete ${deleteTarget.clients.length} Client${deleteTarget.clients.length === 1 ? '' : 's'}`
            : 'Delete Client'
        }
        description={
          deleteTarget?.mode === 'bulk'
            ? `Are you sure you want to permanently remove ${deleteTarget.clients.length} selected client partner${deleteTarget.clients.length === 1 ? '' : 's'}? They will immediately stop appearing in Partner Profiles on /clients.`
            : deleteTarget?.mode === 'single'
              ? `Are you sure you want to remove "${deleteTarget.client.name}" from Clients Management? They will immediately stop appearing in Partner Profiles on /clients.`
              : 'Remove selected client partners?'
        }
        formAction={async (formData) => {
          if (!deleteTarget) return
          if (deleteTarget.mode === 'single') {
            const removedName = deleteTarget.client.name
            formData.set('clientId', deleteTarget.client.id)
            await deleteClientAction(formData)
            setDeleteTarget(null)
            setBanner({
              type: 'success',
              text: `${removedName} removed from Client Partners.`,
            })
          } else {
            const idsToDelete = deleteTarget.clients.map((c) => c.id)
            const res = await bulkDeleteClientsAction(idsToDelete)
            setDeleteTarget(null)
            setSelectedIds(new Set())
            setIsSelectionMode(false)
            setBanner({
              type: 'success',
              text: `${res.count} client partner${res.count === 1 ? '' : 's'} removed from Clients Management.`,
            })
          }
          notifyClientsChanged()
          router.refresh()
        }}
        icon={<OpgIconTrash size={22} />}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.mode === 'bulk'
            ? 'Remove Selected Clients'
            : 'Remove Client Partner'
        }
        tone="danger"
      />
    </div>
  )
}
