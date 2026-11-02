export type CareerWorkArrangement =
  'remote' | 'hybrid' | 'onsite' | 'unspecified'

export type CareerEmploymentType =
  | 'full_time'
  | 'part_time'
  | 'part_time_to_full_time'
  | 'temporary'
  | 'temporary_to_full_time'
  | 'contract'
  | 'contract_to_full_time'
  | 'internship'
  | 'internship_to_full_time'
  | 'volunteer'
  | 'seasonal'
  | 'other'

export type CareerQuestionFormat =
  'checkbox' | 'date' | 'number' | 'select' | 'text' | 'textarea'

export type CareerQuestion = {
  fieldName: string
  format: CareerQuestionFormat
  label: string
  mandatory: boolean
  maxLength: number | null
  options: string[]
  order: number
}

export type CareerJob = {
  applyPath: string
  boardCode: string
  city: string | null
  country: string | null
  department: string | null
  descriptionText: string
  employmentType: CareerEmploymentType
  employmentTypeLabel: string
  id: string
  location: string
  minimumExperience: string | null
  publishedAt: string | null
  questionnaireId: string | null
  slug: string
  state: string | null
  summary: string | null
  title: string
  workArrangement: CareerWorkArrangement
}

export type CareersFeed = {
  configured: boolean
  fetchedAt: string | null
  jobs: CareerJob[]
}
