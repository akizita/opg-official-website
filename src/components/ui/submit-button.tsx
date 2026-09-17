'use client'

import { useFormStatus } from 'react-dom'

type SubmitButtonProps = {
  children: string
  pendingLabel: string
}

export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button className="button" disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  )
}
