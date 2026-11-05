import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Create an account | Outsource Pro Global',
  robots: { index: false, follow: false },
}

export default async function VisitorSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const dest = next
    ? `/sign-in?tab=signup&next=${encodeURIComponent(next)}`
    : '/sign-in?tab=signup'
  redirect(dest)
}
