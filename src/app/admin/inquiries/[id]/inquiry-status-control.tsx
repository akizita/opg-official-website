'use client'

import { useState, useTransition } from 'react'

import { updateInquiryStatusAction } from '@/app/admin/inquiries/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'

type StatusOption = 'new' | 'read' | 'replied' | 'archived'

export function InquiryStatusControl({
  inquiryId,
  currentStatus,
}: {
  inquiryId: string
  currentStatus: StatusOption
}) {
  const [status, setStatus] = useState<StatusOption>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)

  function handleStatusChange(newStatus: StatusOption) {
    if (newStatus === status) return
    setMessage(null)

    startTransition(async () => {
      try {
        await updateInquiryStatusAction(inquiryId, newStatus)
        setStatus(newStatus)
        setMessage(`Status updated to ${newStatus}`)
      } catch {
        setMessage('Failed to update status')
      }
    })
  }

  function onStatusButtonClick(targetStatus: StatusOption) {
    if (targetStatus === 'archived') {
      setArchiveModalOpen(true)
    } else {
      handleStatusChange(targetStatus)
    }
  }

  function confirmArchive() {
    setArchiveModalOpen(false)
    handleStatusChange('archived')
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <label
        htmlFor="inquiry-status-select"
        style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}
      >
        Update Inquiry Status
      </label>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {(['new', 'read', 'replied', 'archived'] as const).map((s) => (
          <button
            className={`button ${status === s ? 'button--primary' : 'button--secondary'}`}
            disabled={isPending || status === s}
            key={s}
            onClick={() => onStatusButtonClick(s)}
            type="button"
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {message && (
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--color-text-subtle)',
          }}
        >
          {message}
        </p>
      )}

      <AdminConfirmDialog
        cancelText="Cancel"
        confirmText="Archive Inquiry"
        description="Are you sure you want to archive this inquiry? It will be marked as archived and removed from your active triage inbox."
        disabled={isPending}
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={confirmArchive}
        title="Archive Inquiry?"
        tone="warning"
      />
    </div>
  )
}
