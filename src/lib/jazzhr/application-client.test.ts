import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  applicationReference,
  JazzHrSubmissionError,
  submitApplicationToJazzHr,
} from '@/lib/jazzhr/application-client'
import type { CareerJob, CareerQuestion } from '@/lib/jazzhr/types'

const sampleJob: CareerJob = {
  account: 'offshore',
  applyPath: '/careers/OeMDx1W3Rq-paid-media-analyst#apply',
  boardCode: 'OeMDx1W3Rq',
  city: 'Manila',
  compensation: null,
  country: 'Philippines',
  department: 'Marketing',
  descriptionText: 'Role description',
  employmentType: 'full_time',
  employmentTypeLabel: 'Full Time',
  id: 'job_OeMDx1W3Rq',
  location: 'Philippines',
  minimumExperience: null,
  publishedAt: '2026-09-07',
  questionnaireId: 'q_123',
  slug: 'OeMDx1W3Rq-paid-media-analyst',
  state: 'NCR',
  summary: 'Paid Media Analyst',
  title: 'Paid Media and Marketing Data Analyst - PH',
  workArrangement: 'remote',
}

const sampleQuestions: CareerQuestion[] = [
  {
    fieldName: 'question_01',
    format: 'text',
    label: 'Years of experience',
    mandatory: true,
    maxLength: null,
    options: [],
    order: 1,
  },
]

function sampleApplication() {
  return {
    answers: { question_01: '5' },
    coverLetter: 'Excited to contribute.',
    email: 'aki@example.com',
    firstName: 'Aki',
    lastName: 'Zita',
    phone: '+63 917 555 0100',
    privacyConsent: true,
    resume: new File(['%PDF-1.7 sample resume'], 'ZitaAki_Resume.pdf', {
      type: 'application/pdf',
    }),
  }
}

describe('JazzHR application client', () => {
  const originalKey = process.env.JAZZHR_API_KEY

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.JAZZHR_API_KEY = 'test-jazzhr-key'
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.JAZZHR_API_KEY
    else process.env.JAZZHR_API_KEY = originalKey
  })

  it('posts JSON payloads across applicants, files, applicants2jobs, and questionnaire_answers', async () => {
    const calls: Array<{
      body: Record<string, unknown>
      contentType: string | null
      path: string
    }> = []

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const headers = new Headers(init?.headers)
      calls.push({
        body: JSON.parse(String(init?.body || '{}')) as Record<
          string,
          unknown
        >,
        contentType: headers.get('content-type'),
        path: url.pathname,
      })

      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261125_98765' }),
          { status: 200 },
        )
      }

      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    const result = await submitApplicationToJazzHr(
      sampleJob,
      sampleQuestions,
      sampleApplication(),
    )

    expect(result.applicantId).toBe('prospect_20261125_98765')
    expect(applicationReference(result.applicantId)).toBe('OPG-6112598765')
    expect(calls).toHaveLength(4)
    for (const call of calls) {
      expect(call.contentType).toBe('application/json')
    }
    expect(calls[0]?.path).toBe('/v1/applicants')
    expect(calls[0]?.body.first_name).toBe('Aki')
    expect(calls[0]?.body['base64-resume']).toBe(
      Buffer.from('%PDF-1.7 sample resume').toString('base64'),
    )
    expect(calls[1]?.path).toBe('/v1/files')
    expect(calls[1]?.body.applicant_id).toBe('prospect_20261125_98765')
    expect(calls[1]?.body.filename).toBe('ZitaAki_Resume.pdf')
    expect(calls[2]?.path).toBe('/v1/applicants2jobs')
    expect(calls[2]?.body.job_id).toBe('job_OeMDx1W3Rq')
    expect(calls[3]?.path).toBe('/v1/questionnaire_answers')
    expect(calls[3]?.body.answer_value_01).toBe('5')
  })

  it('includes plain-text resumetext for .txt résumés, skips base64-resume above 4 MB, and falls back if /applicants rejects base64-resume', async () => {
    const txtApp = {
      ...sampleApplication(),
      resume: new File(['Aki Zita\nData Analyst'], 'resume.txt', {
        type: 'text/plain',
      }),
    }

    const txtCalls: Array<Record<string, unknown>> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const body = JSON.parse(String(init?.body || '{}')) as Record<
        string,
        unknown
      >
      txtCalls.push(body)
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261125_txt1' }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    await submitApplicationToJazzHr(sampleJob, sampleQuestions, txtApp)
    expect(txtCalls[0]?.resumetext).toBe('Aki Zita\nData Analyst')
    expect('base64-resume' in (txtCalls[0] ?? {})).toBe(false)

    vi.restoreAllMocks()
    const bigPdf = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      'ZitaAki_Resume.pdf',
      { type: 'application/pdf' },
    )
    const bigCalls: Array<{ body: Record<string, unknown>; path: string }> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const body = JSON.parse(String(init?.body || '{}')) as Record<
        string,
        unknown
      >
      bigCalls.push({ body, path: url.pathname })
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261125_big1' }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    const bigResult = await submitApplicationToJazzHr(sampleJob, sampleQuestions, {
      ...sampleApplication(),
      resume: bigPdf,
    })
    expect(bigResult.applicantId).toBe('prospect_20261125_big1')
    expect(bigCalls[0]?.path).toBe('/v1/applicants')
    expect('base64-resume' in (bigCalls[0]?.body ?? {})).toBe(false)
    expect(bigCalls[0]?.body?.resumetext).toContain('Documents tab')
    expect(bigCalls[1]?.path).toBe('/v1/files')

    vi.restoreAllMocks()
    const fallbackCalls: Array<{ body: Record<string, unknown>; path: string }> =
      []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const body = JSON.parse(String(init?.body || '{}')) as Record<
        string,
        unknown
      >
      fallbackCalls.push({ body, path: url.pathname })
      if (
        url.pathname.endsWith('/applicants') &&
        'base64-resume' in body
      ) {
        return new Response('Internal Server Error', { status: 500 })
      }
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261125_fb1' }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    const fbResult = await submitApplicationToJazzHr(
      sampleJob,
      sampleQuestions,
      sampleApplication(),
    )
    expect(fbResult.applicantId).toBe('prospect_20261125_fb1')
    expect(fallbackCalls[0]?.path).toBe('/v1/applicants')
    expect(fallbackCalls[1]?.path).toBe('/v1/applicants')
    expect(fallbackCalls[1]?.body.resumetext).toContain('Documents tab')
    expect(fallbackCalls[2]?.path).toBe('/v1/files')

    vi.restoreAllMocks()
    const missingIdFallbackCalls: Array<{
      body: Record<string, unknown>
      path: string
    }> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const body = JSON.parse(String(init?.body || '{}')) as Record<
        string,
        unknown
      >
      missingIdFallbackCalls.push({ body, path: url.pathname })
      if (
        url.pathname.endsWith('/applicants') &&
        'base64-resume' in body
      ) {
        return new Response(
          JSON.stringify({ message: 'Unable to parse resume' }),
          { status: 200 },
        )
      }
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261125_fb2' }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    const missingIdResult = await submitApplicationToJazzHr(
      sampleJob,
      sampleQuestions,
      sampleApplication(),
    )
    expect(missingIdResult.applicantId).toBe('prospect_20261125_fb2')
    expect(missingIdFallbackCalls[0]?.path).toBe('/v1/applicants')
    expect(missingIdFallbackCalls[1]?.path).toBe('/v1/applicants')
    expect(missingIdFallbackCalls[1]?.body.resumetext).toContain('Documents tab')
  })

  it('rejects HTTP 200 error strings like "error: first_name was not set" instead of generating fake references', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify('error: first_name was not set'), {
          status: 200,
        }),
    )

    await expect(
      submitApplicationToJazzHr(
        sampleJob,
        sampleQuestions,
        sampleApplication(),
      ),
    ).rejects.toThrow('error: first_name was not set')
  })

  it('surfaces partial submission errors if files or applicants2jobs returns an HTTP 200 API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ id: 'prospect_20261125_112233' }),
          { status: 200 },
        )
      }
      return new Response(
        JSON.stringify({ error: 'File exceeded maximum allowed size' }),
        { status: 200 },
      )
    })

    await expect(
      submitApplicationToJazzHr(
        sampleJob,
        sampleQuestions,
        sampleApplication(),
      ),
    ).rejects.toBeInstanceOf(JazzHrSubmissionError)
  })

  it('sends extracted resumetext plus linkedin, address, and website fields and attaches original RTF/DOCX via /files', async () => {
    const calls: Array<{ body: Record<string, unknown>; path: string }> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      calls.push({
        body: JSON.parse(String(init?.body || '{}')) as Record<
          string,
          unknown
        >,
        path: url.pathname,
      })
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261126_rtf1' }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    const rtfFile = new File(
      ['{\\rtf1\\ansi Aki Zita\\par Paid Media & Data Analyst}'],
      'ZitaAki_Resume.rtf',
      { type: 'application/rtf' },
    )

    const result = await submitApplicationToJazzHr(sampleJob, sampleQuestions, {
      ...sampleApplication(),
      linkedinUrl: 'https://www.linkedin.com/in/aki-zita',
      location: 'Olongapo City, PH',
      resume: rtfFile,
      websiteUrl: 'https://akizita.dev',
    })

    expect(result.applicantId).toBe('prospect_20261126_rtf1')
    expect(calls[0]?.path).toBe('/v1/applicants')
    expect(calls[0]?.body.resumetext).toBe('Aki Zita\nPaid Media & Data Analyst')
    expect('base64-resume' in (calls[0]?.body ?? {})).toBe(false)
    expect(calls[0]?.body.linkedin).toBe('https://www.linkedin.com/in/aki-zita')
    expect(calls[0]?.body.address).toBe('Olongapo City, PH')
    expect(calls[0]?.body.website).toBe('https://akizita.dev')
    expect(calls[1]?.path).toBe('/v1/files')
    expect(calls[1]?.body.filename).toBe('ZitaAki_Resume.rtf')
  })

  it('prefers base64-resume for PDF files even when plain text is extractable, and falls back to extracted text if rejected', async () => {
    const stream = 'BT /F1 12 Tf 72 720 Td (Paid Media Analyst) Tj ET'
    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
      `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    ]
    let pdfText = '%PDF-1.4\n'
    const offsets: number[] = []
    for (const obj of objects) {
      offsets.push(Buffer.byteLength(pdfText, 'utf8'))
      pdfText += obj
    }
    const xrefOffset = Buffer.byteLength(pdfText, 'utf8')
    pdfText += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (const offset of offsets) {
      pdfText += `${String(offset).padStart(10, '0')} 00000 n \n`
    }
    pdfText += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

    const samplePdfWithText = new File(
      [Buffer.from(pdfText, 'utf8')],
      'ZitaAki_Resume.pdf',
      { type: 'application/pdf' },
    )

    const primaryCalls: Array<{ body: Record<string, unknown>; path: string }> =
      []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const body = JSON.parse(String(init?.body || '{}')) as Record<
        string,
        unknown
      >
      primaryCalls.push({ body, path: url.pathname })
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261126_pdf1' }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    const primaryResult = await submitApplicationToJazzHr(
      sampleJob,
      sampleQuestions,
      {
        ...sampleApplication(),
        resume: samplePdfWithText,
      },
    )
    expect(primaryResult.applicantId).toBe('prospect_20261126_pdf1')
    expect(primaryCalls[0]?.path).toBe('/v1/applicants')
    expect(typeof primaryCalls[0]?.body['base64-resume']).toBe('string')
    expect('resumetext' in (primaryCalls[0]?.body ?? {})).toBe(false)
    expect(primaryCalls[1]?.path).toBe('/v1/files')

    vi.restoreAllMocks()
    const fallbackCalls: Array<{ body: Record<string, unknown>; path: string }> =
      []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const body = JSON.parse(String(init?.body || '{}')) as Record<
        string,
        unknown
      >
      fallbackCalls.push({ body, path: url.pathname })
      if (
        url.pathname.endsWith('/applicants') &&
        'base64-resume' in body
      ) {
        return new Response('Upstream error', { status: 502 })
      }
      if (url.pathname.endsWith('/applicants')) {
        return new Response(
          JSON.stringify({ prospect_id: 'prospect_20261126_pdf_fb' }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ status: 'Success' }), {
        status: 200,
      })
    })

    const fallbackResult = await submitApplicationToJazzHr(
      sampleJob,
      sampleQuestions,
      {
        ...sampleApplication(),
        resume: samplePdfWithText,
      },
    )
    expect(fallbackResult.applicantId).toBe('prospect_20261126_pdf_fb')
    expect(fallbackCalls[0]?.body['base64-resume']).toBeTruthy()
    expect(fallbackCalls[1]?.body.resumetext).toContain('Paid Media Analyst')
    expect('base64-resume' in (fallbackCalls[1]?.body ?? {})).toBe(false)
  })
})
