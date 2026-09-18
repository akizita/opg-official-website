'use server'

import { subscribeToNewsletter } from '@/lib/content/newsletter'

export type NewsletterActionState = {
  success: boolean
  message: string
  error?: string
}

export async function subscribeNewsletterAction(
  formData: FormData,
): Promise<NewsletterActionState> {
  const email = String(formData.get('email') || '').trim()
  const source = String(formData.get('source') || 'footer_form')

  const result = await subscribeToNewsletter(email, { source })
  return result
}
