const TEAM_STORAGE_BASE_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/team'

export const OPG_TEAM_PHOTO_FILES = [
  'Armi.png',
  'Hanna.png',
  'Allen.png',
  'Ella.png',
  'Joy.png',
  'Aki.png',
  'Je.png',
  'Glam.png',
  'Kyla.png',
  'Migs.png',
  'Aph.png',
] as const

export type OpgTeamPhotoFile = (typeof OPG_TEAM_PHOTO_FILES)[number]

export function getTeamPhotoUrl(fileName: OpgTeamPhotoFile): string {
  return `${TEAM_STORAGE_BASE_URL}/${fileName}`
}

export interface OpgTeamMember {
  id: string
  name: string
  role: string
  department: string
  headline: string
  bio: string
  image: string
  alt: string
  linkedin: string
  masonryHeight: number
}

const DEFAULT_COMPANY_LINKEDIN =
  'https://www.linkedin.com/company/outsourced-pro-global'

export const OPG_TEAM_MEMBERS: readonly OpgTeamMember[] = [
  {
    id: 'armi-escamilla',
    name: 'Armi Escamilla',
    role: 'Talent Acquisition Team Leader',
    department: 'Talent Acquisition Leadership',
    headline: 'Guiding recruiter pods to deliver consistent, high-caliber client shortlists.',
    bio: 'Leads OPG’s recruitment team and sourcing operations, setting quality benchmarks and ensuring fast, well-matched candidate shortlists for every partner.',
    image: getTeamPhotoUrl('Armi.png'),
    alt: 'Armi Escamilla, Talent Acquisition Team Leader at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 420,
  },
  {
    id: 'hanna-marino',
    name: 'Hanna Mariño',
    role: 'Technical Talent Acquisition Specialist',
    department: 'Technical Recruitment',
    headline: 'Matching specialized engineering and IT professionals to client stacks.',
    bio: 'Specializes in sourcing and assessing technical and IT talent, pairing domain-specific screening with close alignment to client engineering requirements.',
    image: getTeamPhotoUrl('Hanna.png'),
    alt: 'Hanna Mariño, Technical Talent Acquisition Specialist at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 380,
  },
  {
    id: 'allen-guevara',
    name: 'Allen Guevara',
    role: 'Talent Acquisition & HR Operations Specialist',
    department: 'Talent Acquisition & HR Ops',
    headline: 'Connecting structured recruitment with compliant HR operations.',
    bio: 'Bridges full-cycle candidate recruitment with day-to-day HR operations, supporting compliant onboarding, documentation, and smooth team integration.',
    image: getTeamPhotoUrl('Allen.png'),
    alt: 'Allen Guevara, Talent Acquisition & HR Operations Specialist at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 400,
  },
  {
    id: 'ella-lapitan',
    name: 'Ella Lapitan',
    role: 'Talent Acquisition Specialist',
    department: 'Talent Acquisition',
    headline: 'Building dependable talent pipelines tailored to client workflows.',
    bio: 'Manages targeted candidate sourcing, structured interviews, and active talent pipelines to connect partner teams with reliable offshore professionals.',
    image: getTeamPhotoUrl('Ella.png'),
    alt: 'Ella Lapitan, Talent Acquisition Specialist at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 360,
  },
  {
    id: 'joy-peduche',
    name: 'Joy Peduche',
    role: 'Talent Acquisition Specialist',
    department: 'Talent Acquisition',
    headline: 'Keeping screening, evaluation, and interview cycles moving smoothly.',
    bio: 'Drives end-to-end candidate screening, interview coordination, and applicant communication so hiring managers review only high-fit, vetted profiles.',
    image: getTeamPhotoUrl('Joy.png'),
    alt: 'Joy Peduche, Talent Acquisition Specialist at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 430,
  },
  {
    id: 'aki-zita',
    name: 'Aki Zita',
    role: 'Automation Specialist',
    department: 'Automation & Systems',
    headline: 'Engineering workflow automations and integrations across OPG operations.',
    bio: 'Builds and maintains workflow automations, internal tools, and system integrations that keep recruitment pipelines and operational processes fast and accurate.',
    image: getTeamPhotoUrl('Aki.png'),
    alt: 'Aki Zita, Automation Specialist at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 370,
  },
  {
    id: 'je-regalado',
    name: 'Je Regalado',
    role: 'Automation Specialist & Assistant Coordinator',
    department: 'Automation & Coordination',
    headline: 'Streamlining processes through automation and cross-team coordination.',
    bio: 'Develops process automations while coordinating cross-functional schedules and operational workflows, helping teams execute smoothly every day.',
    image: getTeamPhotoUrl('Je.png'),
    alt: 'Je Regalado, Automation Specialist & Assistant Coordinator at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 410,
  },
  {
    id: 'glam-tan',
    name: 'Glam Tan',
    role: 'Talent Attraction & Employer Branding Specialist',
    department: 'Talent Attraction & Branding',
    headline: 'Positioning OPG opportunities to attract top-performing talent.',
    bio: 'Crafts OPG’s employer branding and outreach campaigns, shaping role messaging and creative touchpoints that attract standout talent across regions.',
    image: getTeamPhotoUrl('Glam.png'),
    alt: 'Glam Tan, Talent Attraction & Employer Branding Specialist at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 350,
  },
  {
    id: 'kyla-alina',
    name: 'Kyla Alina',
    role: 'Background Specialist & Operations Support',
    department: 'Verification & Operations',
    headline: 'Safeguarding hiring quality through thorough verification and ops support.',
    bio: 'Oversees thorough candidate background verification and reference checks while supporting operational accuracy and compliance readiness.',
    image: getTeamPhotoUrl('Kyla.png'),
    alt: 'Kyla Alina, Background Specialist & Operations Support at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 440,
  },
  {
    id: 'migs-perez',
    name: 'Migs Perez',
    role: 'Business Marketing Specialist',
    department: 'Marketing & Growth',
    headline: 'Communicating OPG’s global workforce capabilities to growing businesses.',
    bio: 'Leads business marketing campaigns, strategic content, and brand communications that connect growing global organizations with OPG’s talent solutions.',
    image: getTeamPhotoUrl('Migs.png'),
    alt: 'Migs Perez, Business Marketing Specialist at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 390,
  },
  {
    id: 'aphrodite-abalos',
    name: 'Aphrodite Abalos',
    role: 'Talent Acquisition Intern',
    department: 'Talent Acquisition',
    headline: 'Supporting active sourcing and candidate coordination across global roles.',
    bio: 'Supports candidate sourcing, pipeline tracking, and interview scheduling while learning structured global recruitment practices alongside senior specialists.',
    image: getTeamPhotoUrl('Aph.png'),
    alt: 'Aphrodite Abalos, Talent Acquisition Intern at Outsourced Pro Global',
    linkedin: DEFAULT_COMPANY_LINKEDIN,
    masonryHeight: 355,
  },
] as const
