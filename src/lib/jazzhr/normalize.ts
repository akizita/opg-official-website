import type {
  CareerEmploymentType,
  CareerJob,
  CareerQuestion,
  CareerQuestionFormat,
  CareerWorkArrangement,
} from '@/lib/jazzhr/types'

type JazzHrRecord = Record<string, unknown>

const EMPLOYMENT_TYPES: Record<
  string,
  { label: string; value: CareerEmploymentType }
> = {
  '1': { label: 'Full Time', value: 'full_time' },
  '2': { label: 'Part Time', value: 'part_time' },
  '3': { label: 'Part Time to Full Time', value: 'part_time_to_full_time' },
  '4': { label: 'Temporary', value: 'temporary' },
  '5': { label: 'Temporary to Full Time', value: 'temporary_to_full_time' },
  '6': { label: 'Contract', value: 'contract' },
  '7': { label: 'Contract to Full Time', value: 'contract_to_full_time' },
  '8': { label: 'Internship', value: 'internship' },
  '9': { label: 'Internship to Full Time', value: 'internship_to_full_time' },
  '10': { label: 'Volunteer', value: 'volunteer' },
  '11': { label: 'Seasonal', value: 'seasonal' },
  contracted: { label: 'Contract', value: 'contract' },
  contract: { label: 'Contract', value: 'contract' },
  'contracted to full time': {
    label: 'Contract to Full Time',
    value: 'contract_to_full_time',
  },
  'full time': { label: 'Full Time', value: 'full_time' },
  internship: { label: 'Internship', value: 'internship' },
  'internship to full time': {
    label: 'Internship to Full Time',
    value: 'internship_to_full_time',
  },
  'part time': { label: 'Part Time', value: 'part_time' },
  'part time to full time': {
    label: 'Part Time to Full Time',
    value: 'part_time_to_full_time',
  },
  seasonal: { label: 'Seasonal', value: 'seasonal' },
  temporary: { label: 'Temporary', value: 'temporary' },
  'temporary to full time': {
    label: 'Temporary to Full Time',
    value: 'temporary_to_full_time',
  },
  volunteer: { label: 'Volunteer', value: 'volunteer' },
}

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  ndash: '–',
  nbsp: ' ',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : ''
}

function flag(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  return ['1', 'true', 'yes', 'y'].includes(text(value).toLowerCase())
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (match, hex: string) => {
      const codePoint = Number.parseInt(hex, 16)
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match
    })
    .replace(/&#(\d+);/g, (match, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10)
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match
    })
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      Object.hasOwn(ENTITY_MAP, name.toLowerCase())
        ? ENTITY_MAP[name.toLowerCase()]
        : match,
    )
}

export function jazzHrHtmlToText(value: string): string {
  const withStructure = value
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\/\s*(p|div|section|article|h[1-6]|li|ul|ol)\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')

  return decodeEntities(withStructure)
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ +([,.;:!?])/g, '$1')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function slugifyCareerTitle(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function normalizeEmploymentType(value: unknown): {
  label: string
  value: CareerEmploymentType
} {
  const raw = text(value)
  const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ').trim()
  return (
    EMPLOYMENT_TYPES[normalized] || {
      label: raw || 'Employment type not specified',
      value: 'other' as const,
    }
  )
}

function normalizeWorkArrangement(
  title: string,
  locationParts: string[],
  description: string,
): CareerWorkArrangement {
  const source =
    `${title} ${locationParts.join(' ')} ${description.slice(0, 500)}`
      .toLowerCase()
      .replace(/[-–—]/g, ' ')

  if (/\bhybrid\b/.test(source)) return 'hybrid'
  if (/\b(remote|work from home|wfh)\b/.test(source)) return 'remote'
  if (/\b(on site|onsite|in office)\b/.test(source)) return 'onsite'
  return 'unspecified'
}

function normalizeDate(value: unknown): string | null {
  const raw = text(value)
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function uniqueLocationParts(parts: string[]): string[] {
  const seen = new Set<string>()
  return parts.filter((part) => {
    const normalized = part.toLowerCase()
    if (!part || seen.has(normalized) || /^\d+$/.test(part)) return false
    seen.add(normalized)
    return true
  })
}

function summarize(description: string): string | null {
  const firstBlock = description.split(/\n\n+/)[0]?.replace(/^•\s*/, '').trim()
  if (!firstBlock) return null
  if (firstBlock.length <= 220) return firstBlock
  return `${firstBlock.slice(0, 217).trimEnd()}…`
}

export function normalizeJazzHrJob(raw: JazzHrRecord): CareerJob | null {
  const id = text(raw.id || raw.job_id)
  const boardCode = text(raw.board_code || raw.boardCode)
  const title = text(raw.title)
  const status = text(raw.status).toLowerCase()

  if (!id || !boardCode || !title || (status && status !== 'open')) return null
  if (flag(raw.private) || flag(raw.confidential)) return null

  const descriptionText = jazzHrHtmlToText(text(raw.description))
  const city = text(raw.city) || null
  const state = text(raw.state) || null
  const country = text(raw.country || raw.country_id) || null
  const rawLocation = text(raw.location)
  const locationParts = uniqueLocationParts(
    (rawLocation ? [rawLocation] : [city, state, country]).filter(
      (part): part is string => Boolean(part),
    ),
  )
  const workArrangement = normalizeWorkArrangement(
    title,
    locationParts,
    descriptionText,
  )
  const location =
    workArrangement === 'remote' && locationParts.length === 0
      ? 'Remote'
      : locationParts.join(', ') || 'Location not specified'
  const employmentType = normalizeEmploymentType(
    raw.type || raw.employment_type,
  )
  const titleSlug = slugifyCareerTitle(title) || 'open-role'
  const slug = `${boardCode}-${titleSlug}`

  return {
    applyPath: `/careers/${slug}/apply`,
    boardCode,
    city,
    country,
    department: text(raw.department) || null,
    descriptionText,
    employmentType: employmentType.value,
    employmentTypeLabel: employmentType.label,
    id,
    location,
    minimumExperience: text(raw.minimum_experience) || null,
    publishedAt: normalizeDate(raw.original_open_date || raw.open_date),
    questionnaireId:
      text(
        raw.questionnaire || raw.custom_questions_id || raw.questionnaire_id,
      ) || null,
    slug,
    state,
    summary: summarize(descriptionText),
    title,
    workArrangement,
  }
}

const QUESTION_FORMATS: Record<string, CareerQuestionFormat> = {
  checkbox: 'checkbox',
  'check boxes': 'checkbox',
  date: 'date',
  number: 'number',
  'drop-down menu': 'select',
  dropdown: 'select',
  select: 'select',
  text: 'text',
  'text field': 'text',
  textarea: 'textarea',
  'text box (multi-line)': 'textarea',
}

export function normalizeJazzHrQuestion(
  raw: JazzHrRecord,
): CareerQuestion | null {
  const order = Number.parseInt(text(raw.question_order || raw.order), 10)
  const label = text(raw.question_text || raw.label)
  const rawFormat = text(raw.question_format || raw.format).toLowerCase()
  const format = QUESTION_FORMATS[rawFormat]

  if (
    !Number.isInteger(order) ||
    order < 1 ||
    order > 20 ||
    !label ||
    !format
  ) {
    return null
  }

  const rawOptions = raw.question_answers || raw.options
  const options = Array.isArray(rawOptions)
    ? rawOptions.map(text).filter(Boolean)
    : text(rawOptions)
        .split(/\r?\n/)
        .map((option) => option.trim())
        .filter(Boolean)

  if ((format === 'select' || format === 'checkbox') && options.length === 0) {
    return null
  }

  return {
    fieldName: `question_${String(order).padStart(2, '0')}`,
    format,
    label,
    mandatory: flag(raw.question_mandatory || raw.mandatory),
    maxLength: format === 'textarea' ? 5000 : format === 'text' ? 500 : null,
    options: [...new Set(options)],
    order,
  }
}

export function isJazzHrRecord(value: unknown): value is JazzHrRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
