import { describe, expect, it } from 'vitest'

import {
  hasValidResumeSignature,
  MAX_RESUME_BYTES,
  PDF_INLINE_PREVIEW_MAX_BYTES,
  sanitizeCareerPhoneInput,
  sanitizeResumeFilename,
  validateCareerApplication,
  validateCareerPhone,
} from '@/lib/jazzhr/application-validation'
import type { CareerQuestion } from '@/lib/jazzhr/types'

const questions: CareerQuestion[] = [
  {
    fieldName: 'question_01',
    format: 'select',
    label: 'Are you based in the Philippines?',
    mandatory: true,
    maxLength: null,
    options: ['Yes', 'No'],
    order: 1,
  },
  {
    fieldName: 'question_02',
    format: 'number',
    label: 'Years of experience',
    mandatory: true,
    maxLength: null,
    options: [],
    order: 2,
  },
]

function validInput() {
  return {
    answers: { question_01: 'Yes', question_02: '3' },
    coverLetter: '',
    elapsedSeconds: 12,
    email: 'candidate@example.com',
    firstName: 'Avery',
    honeypot: '',
    lastName: 'Santos',
    phone: '+63 917 555 0100',
    privacyConsent: true,
    resume: new File(['%PDF-1.7 test'], 'resume.pdf', {
      type: 'application/pdf',
    }),
  }
}

describe('career application validation', () => {
  it('accepts a complete application and normalizes email', () => {
    const result = validateCareerApplication(
      { ...validInput(), email: ' Candidate@Example.com ' },
      questions,
    )

    expect(result.errors).toEqual({})
    expect(result.data?.email).toBe('candidate@example.com')
  })

  it('rejects invalid contact details, answers, consent, and file type', () => {
    const result = validateCareerApplication(
      {
        ...validInput(),
        answers: { question_01: 'Maybe', question_02: 'many' },
        email: 'not-an-email',
        phone: '123',
        privacyConsent: false,
        resume: new File(['MZ'], 'resume.exe', {
          type: 'application/octet-stream',
        }),
      },
      questions,
    )

    expect(result.errors).toMatchObject({
      email: expect.any(String),
      phone: expect.any(String),
      privacyConsent: expect.any(String),
      question_01: expect.any(String),
      question_02: expect.any(String),
      resume: expect.any(String),
    })
  })

  it('enforces the 10 MB résumé size limit and accepts files up to 10 MB', () => {
    const atLimit = validateCareerApplication(
      {
        ...validInput(),
        resume: new File([new Uint8Array(MAX_RESUME_BYTES)], 'resume.pdf', {
          type: 'application/pdf',
        }),
      },
      questions,
    )
    expect(atLimit.errors.resume).toBeUndefined()

    const overLimit = validateCareerApplication(
      {
        ...validInput(),
        resume: new File([new Uint8Array(MAX_RESUME_BYTES + 1)], 'resume.pdf', {
          type: 'application/pdf',
        }),
      },
      questions,
    )

    expect(overLimit.errors.resume).toContain('10 MB')
    expect(PDF_INLINE_PREVIEW_MAX_BYTES).toBe(4 * 1024 * 1024)
    expect(PDF_INLINE_PREVIEW_MAX_BYTES).toBeLessThanOrEqual(MAX_RESUME_BYTES)
  })

  it('rejects letters and invalid symbols in phone numbers and sanitizes input', () => {
    expect(validateCareerPhone('abc1234567')).toContain('letters')
    expect(validateCareerPhone('0917-CALL-OPG')).toContain('letters')
    expect(validateCareerPhone('63+9175550100')).not.toBeNull()
    expect(validateCareerPhone('123456')).toContain('7 to 15')
    expect(validateCareerPhone('1'.repeat(16))).toContain('7 to 15')
    expect(validateCareerPhone('+63 (917) 555-0100')).toBeNull()

    expect(sanitizeCareerPhoneInput('+63abc917-555!0100')).toBe('+63917-5550100')
    expect(sanitizeCareerPhoneInput('abc+63917')).toBe('63917')

    const result = validateCareerApplication(
      {
        ...validInput(),
        phone: '+63 917 abc 0100',
      },
      questions,
    )
    expect(result.errors.phone).toBeDefined()
  })

  it('normalizes optional LinkedIn, website, and location fields while rejecting invalid URLs', () => {
    const valid = validateCareerApplication(
      {
        ...validInput(),
        linkedinUrl: 'linkedin.com/in/aki-zita',
        location: '  Makati City, Philippines  ',
        websiteUrl: 'akizita.dev',
      },
      questions,
    )

    expect(valid.errors).toEqual({})
    expect(valid.data?.linkedinUrl).toBe('https://linkedin.com/in/aki-zita')
    expect(valid.data?.location).toBe('Makati City, Philippines')
    expect(valid.data?.websiteUrl).toBe('https://akizita.dev/')

    const invalid = validateCareerApplication(
      {
        ...validInput(),
        linkedinUrl: 'https://github.com/not-linkedin',
        websiteUrl: 'not a url',
      },
      questions,
    )

    expect(invalid.errors.linkedinUrl).toContain('LinkedIn')
    expect(invalid.errors.websiteUrl).toContain('website')
  })

  it('checks common résumé signatures and sanitizes filenames', async () => {
    const validPdf = new File(['%PDF-1.7 test'], 'resume.pdf', {
      type: 'application/pdf',
    })
    const fakePdf = new File(['not a pdf'], 'resume.pdf', {
      type: 'application/pdf',
    })

    await expect(hasValidResumeSignature(validPdf)).resolves.toBe(true)
    await expect(hasValidResumeSignature(fakePdf)).resolves.toBe(false)
    expect(sanitizeResumeFilename('../Avery\u0000 Resume.pdf')).toBe(
      '..-Avery- Resume.pdf',
    )
  })
})
