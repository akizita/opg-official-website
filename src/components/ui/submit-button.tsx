'use client'

import { useFormStatus } from 'react-dom'

type SubmitButtonProps = {
  children: string
  className?: string
  pendingLabel: string
}

export function SubmitButton({
  children,
  className,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button className={className || 'button'} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  )
}
