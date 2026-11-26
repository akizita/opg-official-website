import type { CareerQuestion } from '@/lib/jazzhr/types'

export const MAX_RESUME_BYTES = 10 * 1024 * 1024
export const PDF_INLINE_PREVIEW_MAX_BYTES = 4 * 1024 * 1024
export const RESUME_ACCEPT = '.pdf,.doc,.docx,.odt,.rtf,.txt'

const ALLOWED_RESUME_TYPES: Record<string, Set<string>> = {
  doc: new Set(['application/msword']),
  docx: new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  odt: new Set(['application/vnd.oasis.opendocument.text']),
  pdf: new Set(['application/pdf']),
  rtf: new Set([
    'application/rtf',
    'application/x-rtf',
    'text/richtext',
    'text/rtf',
  ]),
  txt: new Set(['text/plain']),
}

export type CareerApplicationInput = {
  answers: Record<string, string>
  coverLetter: string
  email: string
  firstName: string
  lastName: string
  linkedinUrl?: string
  location?: string
  phone: string
  privacyConsent: boolean
  resume: File
  websiteUrl?: string
}

export type RawCareerApplicationInput = {
  answers: Record<string, string>
  coverLetter?: unknown
  elapsedSeconds?: unknown
  email?: unknown
  firstName?: unknown
  honeypot?: unknown
  lastName?: unknown
  linkedinUrl?: unknown
  location?: unknown
  phone?: unknown
  privacyConsent?: unknown
  resume?: unknown
  websiteUrl?: unknown
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeOptionalHttpUrl(
  rawValue: string,
  options?: { requireLinkedInHost?: boolean },
): { url: string; valid: boolean } {
  const trimmed = rawValue.trim()
  if (!trimmed) return { url: '', valid: true }
  if (trimmed.length > 300 || /\s/.test(trimmed)) {
    return { url: '', valid: false }
  }

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.includes('.')
      ? `https://${trimmed}`
      : trimmed

  try {
    const parsed = new URL(withScheme)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { url: '', valid: false }
    }
    const host = parsed.hostname.toLowerCase()
    if (!host.includes('.')) {
      return { url: '', valid: false }
    }
    if (
      options?.requireLinkedInHost &&
      host !== 'linkedin.com' &&
      !host.endsWith('.linkedin.com')
    ) {
      return { url: '', valid: false }
    }
    return { url: parsed.toString(), valid: true }
  } catch {
    return { url: '', valid: false }
  }
}

function resumeExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

const PHONE_CHAR_PATTERN = /^\+?[0-9\s().-]+$/

export function sanitizeCareerPhoneInput(raw: string): string {
  const trimmedStart = raw.replace(/^\s+/, '')
  const hasLeadingPlus = trimmedStart.startsWith('+')
  const body = trimmedStart.replace(/[^\d\s().-]/g, '')
  return hasLeadingPlus ? `+${body}` : body
}

export function validateCareerPhone(rawPhone: string): string | null {
  const phone = rawPhone.trim()
  if (!phone || phone.length > 40) {
    return 'Enter a valid phone number with 7 to 15 digits.'
  }
  if (!PHONE_CHAR_PATTERN.test(phone)) {
    return 'Phone number cannot contain letters or unsupported symbols.'
  }
  const phoneDigits = phone.replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return 'Enter a valid phone number with 7 to 15 digits.'
  }
  return null
}

export function validateCareerResumeFile(resume: File | null): string | null {
  if (!resume || resume.size === 0) {
    return 'Attach your résumé before submitting.'
  }
  if (resume.size > MAX_RESUME_BYTES) {
    return 'Résumé must be 10 MB or smaller.'
  }
  const extension = resumeExtension(resume.name)
  const allowedTypes = ALLOWED_RESUME_TYPES[extension]
  const mime = resume.type.toLowerCase()
  const genericMime = !mime || mime === 'application/octet-stream'
  if (!allowedTypes || (!genericMime && !allowedTypes.has(mime))) {
    return 'Use a PDF, DOC, DOCX, ODT, RTF, or plain-text résumé file.'
  }
  return null
}

export function validateCareerApplication(
  raw: RawCareerApplicationInput,
  questions: CareerQuestion[],
): {
  data: CareerApplicationInput | null
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  const firstName = cleanText(raw.firstName)
  const lastName = cleanText(raw.lastName)
  const email = cleanText(raw.email).toLowerCase()
  const phone = cleanText(raw.phone)
  const location = cleanText(raw.location)
  const linkedinResult = normalizeOptionalHttpUrl(cleanText(raw.linkedinUrl), {
    requireLinkedInHost: true,
  })
  const websiteResult = normalizeOptionalHttpUrl(cleanText(raw.websiteUrl))
  const coverLetter = cleanText(raw.coverLetter)
  const honeypot = cleanText(raw.honeypot)
  const elapsedSeconds = Number(raw.elapsedSeconds)
  const privacyConsent = raw.privacyConsent === true
  const resume = raw.resume instanceof File ? raw.resume : null

  if (honeypot) {
    errors.form = 'Unable to submit this application. Please try again.'
  }
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 3) {
    errors.form = 'Please take a moment to complete the form and try again.'
  }

  if (!firstName || firstName.length > 80) {
    errors.firstName = 'Enter a first name of 80 characters or fewer.'
  }
  if (!lastName || lastName.length > 80) {
    errors.lastName = 'Enter a last name of 80 characters or fewer.'
  }

  const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!email || email.length > 254 || !emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  const phoneError = validateCareerPhone(phone)
  if (phoneError) {
    errors.phone = phoneError
  }

  if (location.length > 160) {
    errors.location = 'Location must be 160 characters or fewer.'
  }
  if (!linkedinResult.valid) {
    errors.linkedinUrl =
      'Enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/your-name).'
  }
  if (!websiteResult.valid) {
    errors.websiteUrl =
      'Enter a valid website or portfolio URL (e.g. https://yourportfolio.com).'
  }

  if (coverLetter.length > 5000) {
    errors.coverLetter = 'Cover letter must be 5,000 characters or fewer.'
  }

  const resumeError = validateCareerResumeFile(resume)
  if (resumeError) {
    errors.resume = resumeError
  }

  const answers: Record<string, string> = {}
  for (const question of questions) {
    const answer = cleanText(raw.answers[question.fieldName])
    answers[question.fieldName] = answer

    if (question.mandatory && !answer) {
      errors[question.fieldName] = 'This question is required.'
      continue
    }
    if (!answer) continue

    if (
      (question.format === 'select' || question.format === 'checkbox') &&
      answer
        .split('|')
        .some((selection) => !question.options.includes(selection))
    ) {
      errors[question.fieldName] = 'Choose one of the available answers.'
    } else if (
      question.format === 'number' &&
      !/^-?\d+(?:\.\d+)?$/.test(answer)
    ) {
      errors[question.fieldName] = 'Enter a valid number.'
    } else if (
      question.format === 'date' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(answer)
    ) {
      errors[question.fieldName] = 'Enter a valid date.'
    } else if (question.maxLength && answer.length > question.maxLength) {
      errors[question.fieldName] =
        `Answer must be ${question.maxLength.toLocaleString()} characters or fewer.`
    }
  }

  if (!privacyConsent) {
    errors.privacyConsent =
      'You must acknowledge the Privacy Notice before applying.'
  }

  if (Object.keys(errors).length > 0 || !resume) {
    return { data: null, errors }
  }

  return {
    data: {
      answers,
      coverLetter,
      email,
      firstName,
      lastName,
      linkedinUrl: linkedinResult.url,
      location,
      phone,
      privacyConsent,
      resume,
      websiteUrl: websiteResult.url,
    },
    errors,
  }
}

export function sanitizeResumeFilename(filename: string): string {
  const cleaned = filename
    .replace(/[\\/\0-\x1f\x7f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(-180) || 'resume.pdf'
}

export async function hasValidResumeSignature(file: File): Promise<boolean> {
  const extension = resumeExtension(file.name)
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer())
  const ascii = new TextDecoder('latin1').decode(bytes)

  if (extension === 'pdf') return ascii.includes('%PDF-')
  if (extension === 'doc') {
    return [0xd0, 0xcf, 0x11, 0xe0].every(
      (byte, index) => bytes[index] === byte,
    )
  }
  if (extension === 'docx' || extension === 'odt') {
    return bytes[0] === 0x50 && bytes[1] === 0x4b
  }
  if (extension === 'rtf') return ascii.startsWith('{\\rtf')
  if (extension === 'txt') return !bytes.includes(0)
  return false
}
