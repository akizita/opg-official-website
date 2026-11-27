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
  bulkDeleteTeamMembersAction,
  bulkSetTeamMembersVisibilityAction,
  deleteTeamMemberAction,
  saveTeamMemberAction,
  type TeamActionState,
  toggleTeamMemberVisibilityAction,
} from '@/app/admin/team/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconCheck,
  OpgIconClose,
  OpgIconEdit,
  OpgIconMore,
  OpgIconPlus,
  OpgIconSearch,
  OpgIconTeam,
  OpgIconTrash,
  OpgIconUpload,
} from '@/components/icons/opg-icons'
import { notifyArticlesChanged } from '@/components/ui/articles-realtime-sync'
import {
  notifyTeamChanged,
  TeamRealtimeSync,
} from '@/components/ui/team-realtime-sync'
import { canEditDraft } from '@/lib/auth/permissions'
import { resolveSafeArticleImage } from '@/lib/content/article-image'
import type { AdminTeamMemberItem, Department } from '@/lib/content/team'

import styles from './team.module.css'

type VisibilityFilter = 'all' | 'active' | 'hidden'

const initialTeamActionState: TeamActionState = {
  status: 'idle',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function TeamManager({
  departments,
  members,
  roleKey,
}: {
  departments: Department[]
  members: AdminTeamMemberItem[]
  roleKey: string
}) {
  const router = useRouter()
  const canManage = canEditDraft(roleKey)
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all')

  const [openMenuMemberId, setOpenMenuMemberId] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] =
    useState<AdminTeamMemberItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<
    | { mode: 'single'; member: AdminTeamMemberItem }
    | { mode: 'bulk'; members: AdminTeamMemberItem[] }
    | null
  >(null)
  const [banner, setBanner] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Modal Form State
  const [fullName, setFullName] = useState('')
  const [position, setPosition] = useState('')
  const [bio, setBio] = useState('')
  const [departmentId, setDepartmentId] = useState<string>(
    departments[0]?.id ? String(departments[0].id) : '',
  )
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [displayOrder, setDisplayOrder] = useState('1')
  const [photoUrl, setPhotoUrl] = useState('')
  const [localPhotoPreview, setLocalPhotoPreview] = useState('')
  const [removePhoto, setRemovePhoto] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const [formState, formAction, isSaving] = useActionState(
    async (prevState: TeamActionState, formData: FormData) => {
      const next = await saveTeamMemberAction(prevState, formData)
      if (next.status === 'success') {
        setIsModalOpen(false)
        setEditingMember(null)
        setLocalPhotoPreview((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
          return ''
        })
        setBanner({
          type: 'success',
          text: next.message || 'Team roster updated.',
        })
        notifyTeamChanged()
        notifyArticlesChanged()
        router.refresh()
      }
      return next
    },
    initialTeamActionState,
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
    if (!openMenuMemberId) return
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target?.closest('[data-card-menu="true"]')) {
        setOpenMenuMemberId(null)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuMemberId(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [openMenuMemberId])

  const openAddModal = () => {
    setOpenMenuMemberId(null)
    setEditingMember(null)
    setFullName('')
    setPosition('')
    setBio('')
    setDepartmentId(departments[0]?.id ? String(departments[0].id) : '')
    setNewDepartmentName('')
    setDisplayOrder(String(members.length + 1))
    setPhotoUrl('')
    setLocalPhotoPreview('')
    setRemovePhoto(false)
    setIsActive(true)
    setBanner(null)
    setIsModalOpen(true)
  }

  const openEditModal = (member: AdminTeamMemberItem) => {
    setOpenMenuMemberId(null)
    setEditingMember(member)
    setFullName(member.full_name)
    setPosition(member.position)
    setBio(member.bio || '')
    setDepartmentId(String(member.department_id))
    setNewDepartmentName('')
    setDisplayOrder(String(member.display_order))
    setPhotoUrl(member.photo_url || '')
    setLocalPhotoPreview('')
    setRemovePhoto(false)
    setIsActive(member.is_active)
    setBanner(null)
    setIsModalOpen(true)
  }

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRemovePhoto(false)
    setLocalPhotoPreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return members
      .filter((member) => {
        if (visibilityFilter === 'active' && !member.is_active) return false
        if (visibilityFilter === 'hidden' && member.is_active) return false
        if (
          departmentFilter !== 'all' &&
          String(member.department_id) !== departmentFilter
        ) {
          return false
        }
        if (query) {
          const hit =
            member.full_name.toLowerCase().includes(query) ||
            member.position.toLowerCase().includes(query) ||
            member.department_name.toLowerCase().includes(query) ||
            (member.bio || '').toLowerCase().includes(query)
          if (!hit) return false
        }
        return true
      })
      .sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'en', { sensitivity: 'base' }),
      )
  }, [members, visibilityFilter, departmentFilter, search])

  const validSelectedIds = useMemo(() => {
    const memberSet = new Set(members.map((m) => m.id))
    return Array.from(selectedIds).filter((id) => memberSet.has(id))
  }, [members, selectedIds])

  const selectedSet = useMemo(
    () => new Set(validSelectedIds),
    [validSelectedIds],
  )

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedSet.has(m.id)),
    [members, selectedSet],
  )

  const previewSource = removePhoto
    ? ''
    : localPhotoPreview || photoUrl.trim()

  const handleToggleVisibility = (member: AdminTeamMemberItem) => {
    setOpenMenuMemberId(null)
    startTransition(async () => {
      try {
        await toggleTeamMemberVisibilityAction(member.id, !member.is_active)
        setBanner({
          type: 'success',
          text: `${member.full_name} is now ${!member.is_active ? 'visible on the website' : 'hidden from the website'}.`,
        })
        notifyTeamChanged()
        notifyArticlesChanged()
        router.refresh()
      } catch (err) {
        setBanner({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Could not update team member visibility.',
        })
      }
    })
  }

  const handleToggleSelectionMode = () => {
    setOpenMenuMemberId(null)
    setIsSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }

  const toggleMemberSelected = (memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const allFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedSet.has(m.id))

  const handleToggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const member of filteredMembers) {
          next.delete(member.id)
        }
      } else {
        for (const member of filteredMembers) {
          next.add(member.id)
        }
      }
      return next
    })
  }

  const handleBulkVisibility = (nextActive: boolean) => {
    if (validSelectedIds.length === 0) return
    startTransition(async () => {
      try {
        const res = await bulkSetTeamMembersVisibilityAction(
          validSelectedIds,
          nextActive,
        )
        setSelectedIds(new Set())
        setIsSelectionMode(false)
        setBanner({
          type: 'success',
          text: `${res.count} team member${res.count === 1 ? '' : 's'} ${
            nextActive
              ? 'restored to website visibility'
              : 'hidden from the website'
          }.`,
        })
        notifyTeamChanged()
        notifyArticlesChanged()
        router.refresh()
      } catch (err) {
        setBanner({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Could not update selected team members.',
        })
      }
    })
  }

  return (
    <div className={styles.workspace}>
      <TeamRealtimeSync />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>Team Management</h1>
          <p className={styles.subtitle}>
            Manage team member portraits, names, positions, and departments.
            Updates sync in real time to the Home showcase, About Us page, and
            Articles author directory.
          </p>
        </div>

        {canManage && (
          <button
            className={styles.addMemberBtn}
            onClick={openAddModal}
            type="button"
          >
            <OpgIconPlus size={16} />
            <span>Add Team Member</span>
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
            aria-label="Search team members"
            className={styles.searchInput}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, position, or department…"
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
            aria-label="Filter by department"
            className={styles.deptSelect}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            value={departmentFilter}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={String(dept.id)}>
                {dept.name}
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
        <div className={styles.bulkBar} role="region" aria-label="Bulk team actions">
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
                : `Select All (${filteredMembers.length})`}
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
                setDeleteTarget({ mode: 'bulk', members: selectedMembers })
              }
              type="button"
            >
              <OpgIconTrash size={14} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className={styles.grid}>
          {filteredMembers.map((member) => {
            const safeImg = member.photo_url
              ? resolveSafeArticleImage(member.photo_url)
              : null
            const isSelected = isSelectionMode && selectedSet.has(member.id)
            const isMenuOpen = !isSelectionMode && openMenuMemberId === member.id

            return (
              <article
                className={`${styles.memberCard} ${
                  !member.is_active ? styles.memberCardHidden : ''
                } ${isSelectionMode ? styles.memberCardSelectable : ''} ${
                  isSelected ? styles.memberCardSelected : ''
                } ${isMenuOpen ? styles.memberCardMenuOpen : ''}`}
                key={member.id}
                onClick={
                  isSelectionMode
                    ? () => toggleMemberSelected(member.id)
                    : undefined
                }
              >
                <div className={styles.memberTop}>
                  <div className={styles.avatarFrame}>
                    {safeImg ? (
                      <Image
                        alt={`${member.full_name} portrait`}
                        className={styles.avatarImg}
                        fill
                        sizes="72px"
                        src={safeImg.src}
                        unoptimized={safeImg.unoptimized}
                      />
                    ) : (
                      <span className={styles.avatarInitials}>
                        {getInitials(member.full_name)}
                      </span>
                    )}
                  </div>

                  <div className={styles.memberIdentity}>
                    <div className={styles.memberNameRow}>
                      <h2 className={styles.memberName} title={member.full_name}>
                        {member.full_name}
                      </h2>

                      {canManage && isSelectionMode ? (
                        <button
                          aria-label={
                            isSelected
                              ? `Deselect ${member.full_name}`
                              : `Select ${member.full_name}`
                          }
                          aria-pressed={isSelected}
                          className={`${styles.selectionIndicator} ${
                            isSelected ? styles.selectionIndicatorActive : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleMemberSelected(member.id)
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
                              aria-label={`Actions for ${member.full_name}`}
                              className={styles.moreBtn}
                              onClick={() =>
                                setOpenMenuMemberId((prev) =>
                                  prev === member.id ? null : member.id,
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
                                  onClick={() => openEditModal(member)}
                                  role="menuitem"
                                  type="button"
                                >
                                  <OpgIconEdit size={14} />
                                  <span>Edit Member</span>
                                </button>
                                <button
                                  className={styles.cardMenuItem}
                                  onClick={() => handleToggleVisibility(member)}
                                  role="menuitem"
                                  type="button"
                                >
                                  <span>
                                    {member.is_active
                                      ? 'Hide from Website'
                                      : 'Show on Website'}
                                  </span>
                                </button>
                                <div className={styles.cardMenuDivider} />
                                <button
                                  className={`${styles.cardMenuItem} ${styles.cardMenuItemDanger}`}
                                  onClick={() => {
                                    setOpenMenuMemberId(null)
                                    setDeleteTarget({
                                      mode: 'single',
                                      member,
                                    })
                                  }}
                                  role="menuitem"
                                  type="button"
                                >
                                  <OpgIconTrash size={14} />
                                  <span>Delete Member</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                    <p className={styles.memberPosition}>{member.position}</p>
                  </div>
                </div>

                <div className={styles.memberMetaRow}>
                  <span className={styles.deptPill}>{member.department_name}</span>
                  <span
                    className={`${styles.visibilityPill} ${
                      member.is_active
                        ? styles.visibilityActive
                        : styles.visibilityHidden
                    }`}
                  >
                    ● {member.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>

                {member.bio && <p className={styles.memberBio}>{member.bio}</p>}
              </article>
            )
          })}
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <OpgIconTeam size={38} />
          <h2 className={styles.emptyTitle}>No Team Members Found</h2>
          <p className={styles.emptyDesc}>
            {search.trim()
              ? `No members matched "${search}". Try adjusting your search or filters.`
              : 'Add your first specialist or leadership profile to populate Home, About Us, and Articles authors.'}
          </p>
          {canManage && (
            <button
              className={styles.addMemberBtn}
              onClick={openAddModal}
              type="button"
            >
              <OpgIconPlus size={16} />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Team Member Modal */}
      {isModalOpen && (
        <div
          aria-labelledby="team-modal-title"
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
                <h2 className={styles.modalTitle} id="team-modal-title">
                  {editingMember ? `Edit ${editingMember.full_name}` : 'Add Team Member'}
                </h2>
                <p className={styles.modalSubtitle}>
                  Changes update live on Home, About Us, and Articles author
                  options.
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
              <input name="id" type="hidden" value={editingMember?.id || ''} />
              <input name="display_order" type="hidden" value={displayOrder} />
              <input
                name="remove_photo"
                type="hidden"
                value={removePhoto ? 'true' : 'false'}
              />
              <input
                name="is_active"
                type="hidden"
                value={isActive ? 'true' : 'false'}
              />

              {formState.status === 'error' && formState.message && (
                <div
                  className={`${styles.toast} ${styles.toastError}`}
                  role="alert"
                >
                  <span>{formState.message}</span>
                </div>
              )}

              {/* Photo Upload + Direct URL */}
              <div className={styles.photoSection}>
                <div className={styles.modalAvatarPreview}>
                  {previewSource ? (
                    (() => {
                      const img = previewSource.startsWith('blob:')
                        ? { src: previewSource, unoptimized: true }
                        : resolveSafeArticleImage(previewSource)
                      return (
                        <Image
                          alt="Team photo preview"
                          className={styles.avatarImg}
                          fill
                          sizes="80px"
                          src={img.src}
                          unoptimized={img.unoptimized}
                        />
                      )
                    })()
                  ) : (
                    <span className={styles.avatarInitials}>
                      {getInitials(fullName || 'TM')}
                    </span>
                  )}
                </div>

                <div className={styles.photoControls}>
                  <div className={styles.photoButtons}>
                    <label
                      className={styles.uploadLabelBtn}
                      htmlFor="team-photo-file-input"
                    >
                      <OpgIconUpload size={14} />
                      <span>Upload Portrait</span>
                    </label>
                    <input
                      accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                      className={styles.fileUploadInput}
                      id="team-photo-file-input"
                      name="photo_file"
                      onChange={handlePhotoFileChange}
                      type="file"
                    />
                    {previewSource && (
                      <button
                        className={styles.removePhotoBtn}
                        onClick={() => {
                          setRemovePhoto(true)
                          setPhotoUrl('')
                          setLocalPhotoPreview('')
                        }}
                        type="button"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <input
                    aria-label="Portrait Image URL"
                    className={styles.input}
                    name="photo_url"
                    onChange={(e) => {
                      setRemovePhoto(false)
                      setPhotoUrl(e.target.value)
                    }}
                    placeholder="Or paste portrait URL (https://...)"
                    type="url"
                    value={removePhoto ? '' : photoUrl}
                  />
                  {formState.errors?.photo && (
                    <span className={styles.fieldError}>
                      {formState.errors.photo}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="team-full-name">
                  Full Name *
                </label>
                <input
                  className={styles.input}
                  id="team-full-name"
                  maxLength={120}
                  name="full_name"
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Armi Escamilla"
                  required
                  type="text"
                  value={fullName}
                />
                {formState.errors?.full_name && (
                  <span className={styles.fieldError}>
                    {formState.errors.full_name}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="team-position">
                  Position / Role Title *
                </label>
                <input
                  className={styles.input}
                  id="team-position"
                  maxLength={160}
                  name="position"
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Talent Acquisition Team Leader"
                  required
                  type="text"
                  value={position}
                />
                {formState.errors?.position && (
                  <span className={styles.fieldError}>
                    {formState.errors.position}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label
                  className={styles.label}
                  htmlFor={
                    departments.length === 0
                      ? 'team-new-dept'
                      : 'team-dept-select'
                  }
                >
                  Department *
                </label>

                {departments.length === 0 ? (
                  <input
                    className={styles.input}
                    id="team-new-dept"
                    maxLength={100}
                    name="new_department_name"
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="e.g. Talent Acquisition"
                    required
                    type="text"
                    value={newDepartmentName}
                  />
                ) : (
                  <select
                    className={styles.select}
                    id="team-dept-select"
                    name="department_id"
                    onChange={(e) => setDepartmentId(e.target.value)}
                    value={departmentId}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}

                {formState.errors?.department && (
                  <span className={styles.fieldError}>
                    {formState.errors.department}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="team-bio">
                  Short Bio (Optional)
                </label>
                <textarea
                  className={styles.textarea}
                  id="team-bio"
                  maxLength={800}
                  name="bio"
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief overview displayed on the About Us showcase and Home lightbox…"
                  rows={3}
                  value={bio}
                />
                {formState.errors?.bio && (
                  <span className={styles.fieldError}>
                    {formState.errors.bio}
                  </span>
                )}
              </div>

              <div className={styles.visibilityRow}>
                <div>
                  <div className={styles.label}>Show on Public Website</div>
                  <div className={styles.modalSubtitle}>
                    Display on Home masonry, About Us showcase, and Articles
                    authors
                  </div>
                </div>
                <button
                  aria-checked={isActive}
                  aria-label="Toggle public website visibility"
                  className={`${styles.switchBtn} ${
                    isActive ? styles.switchBtnActive : ''
                  }`}
                  onClick={() => setIsActive((prev) => !prev)}
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
                    : editingMember
                      ? 'Save Changes'
                      : 'Add Member'}
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
            ? `Delete ${deleteTarget.members.length} Member${deleteTarget.members.length === 1 ? '' : 's'}`
            : 'Delete Member'
        }
        description={
          deleteTarget?.mode === 'bulk'
            ? `Are you sure you want to permanently remove ${deleteTarget.members.length} selected team member${deleteTarget.members.length === 1 ? '' : 's'}? They will immediately stop appearing on Home and About Us.`
            : deleteTarget?.mode === 'single'
              ? `Are you sure you want to remove "${deleteTarget.member.full_name}" from Team Management? They will immediately stop appearing on Home and About Us.`
              : 'Remove selected team members?'
        }
        formAction={async (formData) => {
          if (!deleteTarget) return
          if (deleteTarget.mode === 'single') {
            const removedName = deleteTarget.member.full_name
            formData.set('memberId', deleteTarget.member.id)
            await deleteTeamMemberAction(formData)
            setDeleteTarget(null)
            setBanner({
              type: 'success',
              text: `${removedName} removed from the team roster.`,
            })
          } else {
            const idsToDelete = deleteTarget.members.map((m) => m.id)
            const res = await bulkDeleteTeamMembersAction(idsToDelete)
            setDeleteTarget(null)
            setSelectedIds(new Set())
            setIsSelectionMode(false)
            setBanner({
              type: 'success',
              text: `${res.count} team member${res.count === 1 ? '' : 's'} removed from the team roster.`,
            })
          }
          notifyTeamChanged()
          notifyArticlesChanged()
          router.refresh()
        }}
        icon={<OpgIconTrash size={22} />}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.mode === 'bulk'
            ? 'Remove Selected Members'
            : 'Remove Team Member'
        }
        tone="danger"
      />
    </div>
  )
}
