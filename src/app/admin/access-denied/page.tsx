import type { Metadata } from 'next'

import { AuthPanel } from '@/components/admin/auth-panel'
import { signOutAction } from '@/app/admin/actions'

export const metadata: Metadata = {
  title: 'Administrator access unavailable',
  robots: { index: false, follow: false },
}

export default function AccessDeniedPage() {
  return (
    <AuthPanel
      description="Your sign-in is valid, but this account does not have an active OPG administrator profile."
      eyebrow="Access unavailable"
      title="Contact a Super Admin"
    >
      <p className="form-message">
        Ask an OPG Super Admin to confirm your invitation and assigned role.
      </p>
      <form action={signOutAction}>
        <button className="button button--secondary" type="submit">
          Sign out
        </button>
      </form>
    </AuthPanel>
  )
}
