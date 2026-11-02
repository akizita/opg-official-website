import { describe, expect, it } from 'vitest'

import {
  hasValidResumeSignature,
  MAX_RESUME_BYTES,
  sanitizeResumeFilename,
  validateCareerApplication,
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

  it('enforces the résumé size limit', () => {
    const result = validateCareerApplication(
      {
        ...validInput(),
        resume: new File([new Uint8Array(MAX_RESUME_BYTES + 1)], 'resume.pdf', {
          type: 'application/pdf',
        }),
      },
      questions,
    )

    expect(result.errors.resume).toContain('2 MB')
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
