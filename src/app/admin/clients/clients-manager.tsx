'use client'

import { AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  useState,
  useTransition,
  useMemo,
} from 'react'

import {
  createClientPartnerAction,
  updateClientPartnerAction,
  deleteClientPartnerAction,
  toggleClientVisibilityAction,
} from '@/app/admin/clients/clients-actions'
import { ClientPartnerModal } from '@/app/admin/clients/client-partner-modal'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconCheck,
  OpgIconEdit,
  OpgIconPlus,
  OpgIconSearch,
  OpgIconTrash,
} from '@/components/icons/opg-icons'
import { RubberSegment, type RubberSegmentOption } from '@/components/ui/rubber-segment'
import type { Client, ClientInput } from '@/lib/content/clients'
import styles from '@/app/admin/clients/clients-admin.module.css'

interface ClientsManagerProps {
  clients: Client[]
  canManage: boolean
  canDelete: boolean
}

type ClientFilterType = 'all' | 'active' | 'hidden'

function LocationPinIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, opacity: 0.7 }}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function ClientsManager({
  clients,
  canManage,
  canDelete,
}: ClientsManagerProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filtered clients
  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (activeFilter === 'active' && !c.is_visible) return false
      if (activeFilter === 'hidden' && c.is_visible) return false
      if (!search.trim()) return true
      const query = search.toLowerCase()
      const name = (c.name || '').toLowerCase()
      const type = (c.type_of_company || '').toLowerCase()
      const domain = (c.hero_domain || '').toLowerCase()
      const base = (c.operational_base || '').toLowerCase()
      const capability = (c.dedicated_capability || '').toLowerCase()
      const tagline = (c.tagline || '').toLowerCase()
      return (
        name.includes(query) ||
        type.includes(query) ||
        domain.includes(query) ||
        base.includes(query) ||
        capability.includes(query) ||
        tagline.includes(query)
      )
    })
  }, [clients, search, activeFilter])

  // Stats for badge pills
  const stats = useMemo(() => {
    const total = clients.length
    const active = clients.filter((c) => c.is_visible).length
    return { total, active }
  }, [clients])

  const filterOptions: RubberSegmentOption[] = useMemo(
    () => [
      { value: 'all', label: 'All', badge: stats.total },
      { value: 'active', label: 'Active on Site', badge: stats.active },
      { value: 'hidden', label: 'Hidden', badge: stats.total - stats.active },
    ],
    [stats.total, stats.active],
  )

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  function openAddModal() {
    setEditingClient(null)
    setModalOpen(true)
  }

  function openEditModal(client: Client) {
    setEditingClient(client)
    setModalOpen(true)
  }

  async function handleSaveClient(payload: ClientInput): Promise<boolean> {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          if (editingClient) {
            const res = await updateClientPartnerAction(editingClient.id, payload)
            if (!res.success) {
              showToast(res.error || 'Failed to update partner.')
              resolve(false)
              return
            }
            showToast('Client partner updated successfully.')
          } else {
            const res = await createClientPartnerAction(payload)
            if (!res.success) {
              showToast(res.error || 'Failed to create partner.')
              resolve(false)
              return
            }
            showToast('Client partner created and published!')
          }

          setModalOpen(false)
          router.refresh()
          resolve(true)
        } catch {
          showToast('An unexpected error occurred while saving.')
          resolve(false)
          return
        }
      })
    })
  }

  function handleToggleVisibility(client: Client) {
    if (!canManage) return
    startTransition(async () => {
      try {
        const nextState = !client.is_visible
        const res = await toggleClientVisibilityAction(client.id, nextState)
        if (!res.success) {
          showToast(res.error || 'Could not change visibility.')
          return
        }
        showToast(
          nextState
            ? `${client.name} is now visible on the website.`
            : `${client.name} is now hidden from the website.`,
        )
        router.refresh()
      } catch {
        showToast('An error occurred while updating visibility.')
      }
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        const res = await deleteClientPartnerAction(deleteTarget.id)
        if (!res.success) {
          showToast(res.error || 'Could not delete client partner.')
          return
        }
        showToast(`${deleteTarget.name} has been deleted.`)
        setDeleteTarget(null)
        router.refresh()
      } catch {
        showToast('An error occurred during deletion.')
      }
    })
  }

  return (
    <div className={styles.clientsPageWrap}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotification} role="status">
          <OpgIconCheck size={16} /> {toastMessage}
        </div>
      )}

      {/* Page Header Section */}
      <header className={styles.pageHeaderSection}>
        <h1 className={styles.pageHeaderTitle}>Client Partners</h1>
        <p className={styles.pageHeaderSubtitle}>
          Manage executive partner endorsements, hero showcase cards, and public partner directory profiles.
        </p>
      </header>

      {/* Toolbar: Search input, Add Client Partner button, and RubberSegment filter */}
      <div className={styles.managerToolbar}>
        {/* Search bar */}
        <div className={styles.searchWrap}>
          <OpgIconSearch size={16} />
          <input
            type="search"
            placeholder="Search partner, industry, base, or capability…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Add Client Partner Button in between search and filter tab */}
        {canManage && (
          <button
            type="button"
            className={styles.addClientBtn}
            onClick={openAddModal}
            title="Create a new client partner profile"
          >
            <OpgIconPlus size={15} /> Add Client Partner
          </button>
        )}

        {/* Rubber Segment Filter Tabs */}
        <div className={styles.filterGroup}>
          <RubberSegment
            options={filterOptions}
            value={activeFilter}
            onChange={(val) => setActiveFilter(val as ClientFilterType)}
            ariaLabel="Client Partners Filter"
            layoutId="client-partners-filter-tab-thumb"
          />
        </div>
      </div>

      {/* Table of Client Partners: See-Through Glassmorphism */}
      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">✦</span>
            <h3>No client partners found</h3>
            <p>
              {clients.length === 0
                ? 'No client partners have been configured yet. Click "Add Client Partner" to create one.'
                : 'No client partners matched your search or status filter.'}
            </p>
            {(search || activeFilter !== 'all') && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  setSearch('')
                  setActiveFilter('all')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '52%' }}>Company &amp; Brand</th>
                  <th scope="col" style={{ width: '34%' }}>Base &amp; Capability</th>
                  <th scope="col" style={{ width: '8%' }}>Status</th>
                  {(canManage || canDelete) && (
                    <th scope="col" style={{ width: '6%', textAlign: 'right' }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => {
                  const resolvedLogo =
                    client.logo_url ||
                    (client.name.toLowerCase().includes('northstar')
                      ? '/images/clients/northstar.svg'
                      : client.name.toLowerCase().includes('meridian')
                        ? '/images/clients/meridian.svg'
                        : client.name.toLowerCase().includes('harborline')
                          ? '/images/clients/harborline.svg'
                          : client.name.toLowerCase().includes('atlas')
                            ? '/images/clients/atlas.svg'
                            : client.name.toLowerCase().includes('veridian')
                              ? '/images/clients/veridian.svg'
                              : null)

                  return (
                    <tr key={client.id} className={styles.tableRow}>
                      {/* Company & Brand */}
                      <td>
                        <div className={styles.companyCell}>
                          <div className={styles.companyLogoThumb}>
                            {resolvedLogo ? (
                              <Image
                                src={resolvedLogo}
                                alt={client.name}
                                width={24}
                                height={24}
                                className={styles.companyLogoImg}
                                unoptimized={
                                  resolvedLogo.startsWith('data:') ||
                                  resolvedLogo.endsWith('.svg')
                                }
                              />
                            ) : (
                              <span className={styles.companyInitials}>
                                {client.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className={styles.companyMetaWrap}>
                            <span className={styles.companyNameText}>
                              {client.name}
                            </span>
                            <div className={styles.companyTagsRow}>
                              {client.type_of_company && (
                                <span className={styles.companyTypeTag}>
                                  {client.type_of_company}
                                </span>
                              )}
                              {client.hero_domain &&
                                client.hero_domain !== client.type_of_company && (
                                  <span className={styles.heroDomainText}>
                                    • {client.hero_domain}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Operational Base & Dedicated Capability */}
                      <td>
                        <div className={styles.profileFactsCell}>
                          {client.operational_base && (
                            <span className={styles.factBaseText}>
                              <LocationPinIcon />
                              <span>{client.operational_base}</span>
                            </span>
                          )}
                          {client.dedicated_capability && (
                            <span className={styles.factCapabilityText}>
                              {client.dedicated_capability}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Visibility Status Toggle (Text + Indicator Dot, NO pill background) */}
                      <td>
                        <button
                          type="button"
                          className={`${styles.statusIndicatorBtn} ${
                            client.is_visible
                              ? styles.statusIndicatorActive
                              : styles.statusIndicatorHidden
                          }`}
                          onClick={() => handleToggleVisibility(client)}
                          disabled={!canManage || isPending}
                          title={
                            canManage
                              ? client.is_visible
                                ? 'Click to hide partner from public website'
                                : 'Click to display partner on public website'
                              : undefined
                          }
                        >
                          <span
                            className={
                              client.is_visible
                                ? styles.statusDotActive
                                : styles.statusDotHidden
                            }
                            aria-hidden="true"
                          />
                          <span>{client.is_visible ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      {(canManage || canDelete) && (
                        <td>
                          <div className={styles.actionsCell}>
                            {canManage && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => openEditModal(client)}
                                title="Edit client partner"
                                aria-label={`Edit ${client.name}`}
                              >
                                <OpgIconEdit size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                onClick={() => setDeleteTarget(client)}
                                title="Delete client partner"
                                aria-label={`Delete ${client.name}`}
                              >
                                <OpgIconTrash size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Partner Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ClientPartnerModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSaveClient}
            initialData={editingClient}
            isPending={isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        confirmText="Delete Partner"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This will remove it from the hero section cards and partner directory profiles.`}
        tone="danger"
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Client Partner"
      />
    </div>
  )
}
