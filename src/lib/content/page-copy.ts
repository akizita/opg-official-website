import {
  extractMissionVisionContent,
  type RichTextBlock,
} from '@/lib/content/page-documents'
import { OPG_TEAM_MEMBERS } from '@/lib/content/team-media'

export type CopyField = {
  key: string
  label: string
  defaultValue: string
  multiline?: boolean
}

export type CopySection = {
  id: string
  title: string
  description: string
  fields: readonly CopyField[]
}

const field = (
  key: string,
  label: string,
  defaultValue: string,
  multiline = false,
): CopyField => ({
  key,
  label,
  defaultValue,
  multiline,
})

const teamMemberCopyDefaults = OPG_TEAM_MEMBERS.map((member) => ({
  name: member.name,
  position: member.role,
  department: member.department,
  bio: member.bio,
}))

const teamMemberCopyFields = teamMemberCopyDefaults.flatMap((member, index) =>
  (Object.entries(member) as Array<[string, string]>).map(([name, value]) =>
    field(
      `teamMember${index + 1}${name[0].toUpperCase()}${name.slice(1)}`,
      `${member.name} · ${name}`,
      value,
      name === 'bio',
    ),
  ),
)

export const ABOUT_COPY_SECTIONS: readonly CopySection[] = [
  {
    id: 'about-hero-details',
    title: 'Hero details',
    description: 'Badge, links, proof points, and image caption.',
    fields: [
      field('heroBadge', 'Badge', 'Global Offshore Network'),
      field('heroCta', 'Primary button', 'Build your offshore team'),
      field('heroScroll', 'Scroll link', 'Explore our approach'),
      field('heroProof1Value', 'Proof 1 value', '1,000+'),
      field('heroProof1Label', 'Proof 1 label', 'Talents placed'),
      field('heroProof2Value', 'Proof 2 value', '98%'),
      field('heroProof2Label', 'Proof 2 label', 'Client retention'),
      field('heroProof3Value', 'Proof 3 value', '7'),
      field('heroProof3Label', 'Proof 3 label', 'Global hubs'),
      field(
        'heroCaption',
        'Image caption',
        'Global delivery, human partnership',
      ),
      field(
        'heroCaptionStrong',
        'Image caption emphasis',
        'Built around your business.',
      ),
    ],
  },
  {
    id: 'about-who-details',
    title: 'Who we are and three cards',
    description: 'Section heading and every metric card field.',
    fields: [
      field('whoEyebrow', 'Eyebrow', 'About Us'),
      field(
        'whoTitle',
        'Heading',
        'Connecting Growing Businesses with the Right People',
      ),
      field('card1Tag', 'Card 1 tag', 'Talent Pool'),
      field('card1Metric', 'Card 1 metric', '1,000+'),
      field('card1Title', 'Card 1 title', 'Talents Placed'),
      field(
        'card1Description',
        'Card 1 description',
        'Rigorously vetted professionals and specialized pods matched with leading global organizations.',
        true,
      ),
      field('card2Tag', 'Card 2 tag', 'Proven Track Record'),
      field('card2Metric', 'Card 2 metric', '3+ Years'),
      field('card2Title', 'Card 2 title', 'Years in Service'),
      field(
        'card2Description',
        'Card 2 description',
        'Delivering sustained operational excellence, reliable cadence, and seamless remote team integration.',
        true,
      ),
      field('card3Tag', 'Card 3 tag', 'Partnership Trust'),
      field('card3Metric', 'Card 3 metric', '98%'),
      field('card3Title', 'Card 3 title', 'Client Retention'),
      field(
        'card3Description',
        'Card 3 description',
        'Building enduring human partnerships that transcend typical transactions to drive lasting business growth.',
        true,
      ),
    ],
  },
  {
    id: 'about-why-copy',
    title: 'Why work with us',
    description: 'Section heading and the four partnership value pillars.',
    fields: [
      field('whyEyebrow', 'Eyebrow', 'Our Advantage'),
      field('whyTitle', 'Heading', 'Why Work With Us'),
      field('why1Title', 'Pillar 1 heading', 'Tailored Workforce Solutions'),
      field(
        'why1Body',
        'Pillar 1 description',
        'Every business is unique. We match you with vetted talent specifically equipped to tackle your specific operational bottlenecks and goals.',
        true,
      ),
      field('why2Title', 'Pillar 2 heading', 'Agile & Scalable'),
      field(
        'why2Body',
        'Pillar 2 description',
        'Scale your support up or down without the friction, overhead, and delays associated with traditional in-house hiring.',
        true,
      ),
      field('why3Title', 'Pillar 3 heading', 'Uncompromising Quality'),
      field(
        'why3Body',
        'Pillar 3 description',
        'From initial sourcing to daily performance, our rigorous standards ensure your offshore team delivers consistent, high-impact results.',
        true,
      ),
      field('why4Title', 'Pillar 4 heading', 'Partnership Over Placement'),
      field(
        'why4Body',
        'Pillar 4 description',
        'We invest in long-term relationships, staying actively involved to ensure ongoing productivity, team retention, and seamless workflow integration.',
        true,
      ),
    ],
  },
  {
    id: 'about-services-copy',
    title: 'What we offer',
    description: 'Service introduction and OPG core service pillars.',
    fields: [
      field('servicesEyebrow', 'Eyebrow', 'What We Offer'),
      field('servicesTitlePrefix', 'Heading prefix', 'Our Core'),
      field(
        'servicesTitleAccent',
        'Highlighted heading text',
        'Services',
      ),
      field(
        'servicesLead',
        'Introduction',
        'From end-to-end talent acquisition and managed resume screening to compliant global HR and payroll, we deliver integrated workforce solutions built to scale with your business.',
        true,
      ),
      field('processEyebrow', 'Process eyebrow', 'Our Core Services'),
      field(
        'processTitle',
        'Process heading',
        'Three core services built for seamless scale.',
      ),
      field(
        'processLead',
        'Process introduction',
        'Explore how OPG manages hiring, candidate filtering, and cross-border workforce operations as an embedded extension of your business.',
        true,
      ),
      field('processCta', 'Process button', 'Explore Our Services'),
      field('service1Label', 'Service 1 navigation label', 'Acquisition'),
      field('service1Tag', 'Service 1 tag', 'Full-Cycle Hiring'),
      field('service1Title', 'Service 1 title', 'End-to-End Talent Acquisition'),
      field(
        'service1Summary',
        'Service 1 summary',
        'We manage the full recruitment lifecycle—from market mapping and direct headhunting to structured technical assessments and onboarding—operating as a seamless extension of your team.',
        true,
      ),
      field(
        'service1Bullets',
        'Service 1 bullets (one per line)',
        'Market mapping and direct headhunting across APAC & ANZ hubs\nStructured technical assessments and in-house quality vetting\nSeamless onboarding integrated directly into your team workflows',
        true,
      ),
      field('service2Label', 'Service 2 navigation label', 'Screening'),
      field('service2Tag', 'Service 2 tag', 'Pipeline Filtering'),
      field(
        'service2Title',
        'Service 2 title',
        'Managed Resume Screening as a Service',
      ),
      field(
        'service2Summary',
        'Service 2 summary',
        'Acting as a dedicated screening filter for your existing job ads and applicant pools, our recruiters review, grade, and shortlist incoming CVs so your hiring managers only interview top-tier candidates.',
        true,
      ),
      field(
        'service2Bullets',
        'Service 2 bullets (one per line)',
        'Dedicated screening filter for existing job ads and applicant pools\nRecruiter-led CV review, structured grading, and calibration\nVetted shortlists so hiring managers interview only top talent',
        true,
      ),
      field('service3Label', 'Service 3 navigation label', 'HR & Payroll'),
      field('service3Tag', 'Service 3 tag', 'Cross-Border Ops'),
      field('service3Title', 'Service 3 title', 'HR Admin & Global Payroll'),
      field(
        'service3Summary',
        'Service 3 summary',
        'We take the friction out of cross-border workforce management—handling timekeeping, compliance, record management, and accurate, on-time multi-currency salary disbursements.',
        true,
      ),
      field(
        'service3Bullets',
        'Service 3 bullets (one per line)',
        'Timekeeping, attendance tracking, and employee record management\nCross-border compliance and localized employment administration\nAccurate, on-time multi-currency salary disbursements',
        true,
      ),
    ],
  },
  {
    id: 'about-purpose-copy',
    title: 'Mission, vision, and values',
    description: 'All statements and five core values on the About page.',
    fields: [
      field('purposeEyebrow', 'Eyebrow', 'OUR PURPOSE & DIRECTION'),
      field(
        'purposeTitle',
        'Heading (line break allowed)',
        'Guided by Purpose.\nDriven by Impact.',
        true,
      ),
      field(
        'purposeLead',
        'Introduction',
        'The foundational commitments and forward-looking vision shaping how we empower businesses and build high-performing global teams.',
        true,
      ),
      field('missionTitle', 'Mission heading', 'Mission'),
      field(
        'missionBody',
        'Mission statement',
        'To empower businesses to scale with confidence by delivering exceptional outsourced solutions through skilled professionals, innovative strategies, and a culture of integrity and continuous improvement.',
        true,
      ),
      field('visionTitle', 'Vision heading', 'Vision'),
      field(
        'visionBody',
        'Vision statement',
        'To become a trusted outsourcing partner of choice, recognised for delivering consistent reliability, adaptability, and measurable growth for the businesses we serve.',
        true,
      ),
      field('valuesEyebrow', 'Values eyebrow', 'THE FOUNDATION'),
      field('valuesTitle', 'Values heading', 'Our Core Values'),
      field(
        'valuesLead',
        'Values introduction',
        'The non-negotiable principles that guide our people, culture, and partnerships every day.',
        true,
      ),
      field('value1Name', 'Value 1 name', 'Integrity First'),
      field(
        'value1Description',
        'Value 1 description',
        'Trust is our bedrock. We operate with complete transparency, accountability, and the courage to do what is right for our clients and talent alike.',
        true,
      ),
      field('value2Name', 'Value 2 name', 'Relentless Growth'),
      field(
        'value2Description',
        'Value 2 description',
        'We believe in continuous development. By turning challenges into learning opportunities, we consistently elevate the performance of our teams and partners.',
        true,
      ),
      field('value3Name', 'Value 3 name', 'True Collaboration'),
      field(
        'value3Description',
        'Value 3 description',
        'Shared success drives everything we do. We build bridges across teams, cultures, and borders, ensuring every contributor has a voice.',
        true,
      ),
      field('value4Name', 'Value 4 name', 'Smart Innovation'),
      field(
        'value4Description',
        'Value 4 description',
        'Markets change, and so do we. We continually refine our processes, implement smart tools, and find modern solutions that keep your operations ahead of the curve.',
        true,
      ),
      field('value5Name', 'Value 5 name', 'People at the Core'),
      field(
        'value5Description',
        'Value 5 description',
        'Technology and processes drive efficiency, but people drive outcomes. We foster an environment grounded in empathy, mutual respect, and career fulfillment.',
        true,
      ),
    ],
  },
  {
    id: 'about-network-copy',
    title: 'Global offshore network',
    description: 'Network heading, introduction, and three capability cards.',
    fields: [
      field('networkTitlePrefix', 'Heading prefix', 'More Than Recruitment.'),
      field(
        'networkTitleAccent',
        'Highlighted heading text',
        'A Complete Offshore Hub',
      ),
      field(
        'networkLead',
        'Introduction',
        'Connecting 1,000+ top-tier talents worldwide. Headquartered in the Philippines, Outsourced Pro Global bridges exceptional cross-border professionals with high-growth organizations across Australia, and talents all over the world.',
        true,
      ),
      field(
        'networkCard1Title',
        'Card 1 heading',
        'Strategic Philippine Operations Hub',
      ),
      field(
        'networkCard1Body',
        'Card 1 description',
        'Strong cultural alignment, high English proficiency, and deep cross-functional capabilities across engineering, finance, and operations.',
        true,
      ),
      field('networkCard2Title', 'Card 2 heading', '24/7 Timezone Alignment'),
      field(
        'networkCard2Body',
        'Card 2 description',
        'Dedicated teams synchronized directly to your business hours across Australia, APAC, and global market timezones.',
        true,
      ),
      field(
        'networkCard3Title',
        'Card 3 heading',
        'Turnkey Compliance & Retention',
      ),
      field(
        'networkCard3Body',
        'Card 3 description',
        'End-to-end management covering contracts, local labor law compliance, dedicated hardware logistics, and sustained team retention.',
        true,
      ),
    ],
  },
  {
    id: 'about-team-copy',
    title: 'Our people',
    description: 'Leadership showcase and department directory introductions.',
    fields: [
      field('teamEyebrow', 'Showcase eyebrow', 'Our People'),
      field(
        'teamTitlePrefix',
        'Showcase heading prefix',
        'The Leadership Driving',
      ),
      field('teamTitleAccent', 'Highlighted heading text', 'Global Excellence'),
      field(
        'teamLead',
        'Showcase introduction',
        'Meet the leaders and domain specialists orchestrating seamless cross-border recruitment, airtight compliance, and sustained remote team retention.',
        true,
      ),
      field('teamCta', 'Showcase button', 'Explore Careers'),
      field('directoryEyebrow', 'Directory eyebrow', 'Our People'),
      field(
        'directoryTitle',
        'Directory heading',
        'Leadership & Specialized Departments',
      ),
      field('directoryCta', 'Directory button', 'Join Our Team'),
      field(
        'directoryEmpty',
        'Empty department message',
        'Specialists in this group work directly within client engagements.',
        true,
      ),
    ],
  },
  {
    id: 'about-leadership-copy',
    title: 'Team showcase profiles',
    description: 'Names, roles, and descriptions for the team showcase cards.',
    fields: teamMemberCopyFields,
  },
  {
    id: 'about-cta-copy',
    title: 'Final call to action',
    description: 'Closing message and button labels.',
    fields: [
      field('ctaEyebrow', 'Eyebrow', 'Work With Outsourced Pro Global'),
      field(
        'ctaTitle',
        'Heading',
        'Experience the Difference Exceptional Offshore Talent Makes',
      ),
      field(
        'ctaBody',
        'Description',
        'Whether you are launching a dedicated offshore pod or exploring your next career move, our advisors are here to guide every step.',
        true,
      ),
      field('ctaPrimary', 'Primary button', 'Partner With Us'),
      field('ctaSecondary', 'Secondary button', 'Meet Our Clients'),
    ],
  },
]

export const HOME_COPY_SECTIONS: readonly CopySection[] = [
  {
    id: 'home-hero-copy',
    title: 'Hero details',
    description: 'Badge and both calls to action.',
    fields: [
      field('heroBadge', 'Badge', 'Global talent. Thoughtful partnerships.'),
      field('heroPrimary', 'Primary button', 'I’m building a team'),
      field('heroSecondary', 'Secondary button', 'I’m looking for a role'),
    ],
  },
  {
    id: 'home-cards-copy',
    title: 'Three highlight cards',
    description: 'All text in the three cards below the hero.',
    fields: [
      field('card1Tag', 'Card 1 tag', 'Talent Pool'),
      field('card1Metric', 'Card 1 metric', '1,000+'),
      field('card1Title', 'Card 1 title', 'Over 1,000+ Talents'),
      field(
        'card1Description',
        'Card 1 description',
        'Rigorously vetted professionals and specialized teams matched with leading international organizations.',
        true,
      ),
      field('card2Tag', 'Card 2 tag', 'Proven Track Record'),
      field('card2Metric', 'Card 2 metric', '3+ Years'),
      field('card2Title', 'Card 2 title', 'Over 3+ Years in Service'),
      field(
        'card2Description',
        'Card 2 description',
        'Delivering sustained operational excellence, reliable cadence, and seamless remote team integration.',
        true,
      ),
      field('card3Tag', 'Card 3 tag', 'Partnership Trust'),
      field('card3Metric', 'Card 3 metric', '98%'),
      field('card3Title', 'Card 3 title', 'Over 98% Client Retention'),
      field(
        'card3Description',
        'Card 3 description',
        'Building enduring human partnerships that transcend typical transactions to drive lasting business growth.',
        true,
      ),
    ],
  },
  {
    id: 'home-about-copy',
    title: 'About preview',
    description: 'Text beside the team image.',
    fields: [
      field('aboutEyebrow', 'Eyebrow', 'Who we are'),
      field('aboutTitle', 'Heading', 'About Us'),
      field(
        'aboutBody',
        'Introduction',
        'At Outsourced Pro Global Limited, we connect businesses with the right people — and people with the right opportunities. With a global reach and a personal touch, we make recruitment simple, smart, and effective. Our mission is to help companies grow stronger and professionals achieve their potential.',
        true,
      ),
      field(
        'aboutEmphasis',
        'Highlighted statement',
        'More than filling roles, we build lasting partnerships that drive success.',
        true,
      ),
      field('aboutCta', 'Button', 'Know more'),
    ],
  },
  {
    id: 'home-network-copy',
    title: 'Global offshore network',
    description: 'Map introduction, proof points, and link.',
    fields: [
      field('networkTitlePrefix', 'Heading prefix', 'Our Global'),
      field(
        'networkTitleAccent',
        'Highlighted heading text',
        'Offshore Network',
      ),
      field(
        'networkLead',
        'Introduction',
        'Headquartered in the Philippines, Outsourced Pro Global bridges exceptional cross-border professionals with high-growth organizations across Australia, and talents all over the world.',
        true,
      ),
      field('networkMetric1', 'Metric 1', '1,000+'),
      field('networkMetric1Label', 'Metric 1 label', 'Placed Talents'),
      field('networkMetric2', 'Metric 2', '7 Hubs'),
      field('networkMetric2Label', 'Metric 2 label', 'Global Reach'),
      field('networkMetric3', 'Metric 3', '98%'),
      field('networkMetric3Label', 'Metric 3 label', 'Retention'),
      field('networkCta', 'Button', 'Explore our complete offshore model →'),
    ],
  },
  {
    id: 'home-proof-copy',
    title: 'Partner proof and testimonial',
    description: 'Section labels and the text beside the featured testimonial.',
    fields: [
      field(
        'proofLabel',
        'Client strip label',
        'Trusted by high-yield global teams',
      ),
      field('proofCta', 'Client strip link', 'View all partners →'),
      field('testimonialEyebrow', 'Testimonial eyebrow', 'Client Endorsement'),
      field(
        'testimonialBody',
        'Supporting text',
        'Our partners experience genuine ownership, direct communication cadence, and technical alignment from their remote teams.',
        true,
      ),
      field('testimonialCta', 'Testimonial button', 'Read All Testimonials'),
    ],
  },
  {
    id: 'home-cta-copy',
    title: 'Final call to action',
    description: 'Closing message and two button labels.',
    fields: [
      field('ctaEyebrow', 'Eyebrow', 'Start a conversation'),
      field(
        'ctaTitle',
        'Heading (line break allowed)',
        'Your next hire.\nYour next role.',
        true,
      ),
      field(
        'ctaBody',
        'Description',
        'Whether you are scaling a dedicated remote pod or looking for your next career breakthrough, Outsourced Pro Global builds seamless offshore partnerships that drive tangible growth.',
        true,
      ),
      field('ctaPrimary', 'Primary button', 'Contact OPG'),
      field('ctaSecondary', 'Secondary button', 'View open roles'),
    ],
  },
]

const partnerCopyDefaults = [
  {
    name: 'Northstar Labs',
    badge: 'Enterprise Software',
    industry: 'Enterprise SaaS & Cloud Systems',
    region: 'North America (San Francisco, CA)',
    podCapability: 'Full-Stack Engineering & QA Automation Pod',
    talentCount: '14 Specialists Placed',
    tagline: 'Cloud-native enterprise workflow intelligence',
    description:
      'Northstar Labs engineers secure, cloud-native workflow automation platforms and distributed collaboration software serving high-growth technology scaleups and global enterprise clients.',
    heroDomain: 'Enterprise SaaS',
  },
  {
    name: 'Meridian Health',
    badge: 'Digital Health',
    industry: 'Healthcare Technology & Telehealth',
    region: 'Australia (Sydney, NSW)',
    podCapability: '24/7 Care Coordination & Medical Ops Pod',
    talentCount: '18 Specialists Placed',
    tagline: 'Coordinated telehealth and patient-first access',
    description:
      'A premier digital healthcare collective improving clinical access across Australasia through synchronized telehealth support, 24/7 triage workflows, and compassionate care navigation.',
    heroDomain: 'Healthcare Tech',
  },
  {
    name: 'Harborline Finance',
    badge: 'Fintech & Compliance',
    industry: 'Financial Services & Risk Management',
    region: 'United Kingdom (London)',
    podCapability: 'AML/KYC Compliance & Settlement Pod',
    talentCount: '9 Specialists Placed',
    tagline: 'Transparent cross-border algorithmic wealth tech',
    description:
      'A regulated fintech firm providing transparent cross-border asset management, algorithmic settlement infrastructure, and institutional-grade regulatory reporting systems.',
    heroDomain: 'Fintech & Compliance',
  },
  {
    name: 'Atlas Commerce',
    badge: 'E-Commerce & Retail',
    industry: 'Omnichannel Commerce & Logistics',
    region: 'Southeast Asia (Singapore)',
    podCapability: 'Catalog Ops, Retention & Growth Pod',
    talentCount: '16 Specialists Placed',
    tagline: 'Omnichannel marketplace scaling for lifestyle brands',
    description:
      'A fast-scaling multi-channel commerce platform enabling ambitious consumer brands to synchronize catalog feeds, streamline fulfillment pipelines, and accelerate regional marketplace growth.',
    heroDomain: 'Global E-Commerce',
  },
  {
    name: 'Veridian Operations',
    badge: 'Professional Services',
    industry: 'Management Consulting & Shared Services',
    region: 'Middle East (Dubai, UAE)',
    podCapability: 'Executive Shared Services & BI Pod',
    talentCount: '11 Specialists Placed',
    tagline: 'Resilient operating models and strategic execution',
    description:
      'A leading corporate advisory and management consultancy designing high-agility shared services, automated business intelligence pipelines, and resilient operating models for multinational enterprises.',
    heroDomain: 'Shared Services',
  },
] as const

const testimonialCopyDefaults = [
  {
    companyName: 'Northstar Labs',
    headline: 'Exceeded All Expectations on Velocity & Scale',
    authorName: 'Marcus Vance',
    authorRole: 'VP of Engineering & Product Infrastructure',
    metricBadge: '+160% Sprint Velocity',
    industry: 'Enterprise SaaS',
    quote:
      'Outsourced Pro Global integrated seamlessly into our GitHub and Jira workflows within two weeks. Their QA and full-stack engineering pod didn’t just execute sprint tickets—they overhauled our automated CI/CD pipeline, reducing release regression cycles by 65%. It feels like having our own senior in-house engineers down the hall.',
  },
  {
    companyName: 'Meridian Health',
    headline: 'Uncompromised Clinical Compliance & 24/7 Care',
    authorName: 'Dr. Eleanor Evans, MD',
    authorRole: 'Chief Medical & Operations Officer',
    metricBadge: '99.8% SLA Adherence',
    industry: 'Digital Health',
    quote:
      'In digital health, empathy and compliance cannot be compromised. OPG built us a dedicated 24/7 clinical coordination pod that achieved a 99.8% SLA adherence rate and full HIPAA/Privacy compliance from month one. Our patients receive compassionate care within seconds, day or night.',
  },
  {
    companyName: 'Harborline Finance',
    headline: 'Slashing Fintech OpEx & Model Backlog by 48%',
    authorName: 'Alistair Finch, CFA',
    authorRole: 'Head of Quantitative Risk & Regulatory Systems',
    metricBadge: '48% OpEx Efficiency',
    industry: 'Fintech & Compliance',
    quote:
      'Finding mathematically rigorous fintech talent with SOC 2 compliance discipline is notoriously difficult. The specialized modeling pod OPG assembled for Harborline exceeded every technical benchmark, slashing our model reconciliation backlog and lowering our operational overhead by 48%.',
  },
  {
    companyName: 'Atlas Commerce',
    headline: 'Flawless Peak Synchronization Across 14 Hubs',
    authorName: 'Elena Rostova',
    authorRole: 'Global Director of Supply Chain & E-Commerce Ops',
    metricBadge: '14 Hubs Synchronized',
    industry: 'Global E-Commerce',
    quote:
      'When seasonal demand surges during Q4 peak events, OPG’s dedicated operations pod scales with us effortlessly. Their multi-lingual support and vendor reconciliation pods have eliminated order bottlenecks across 14 international fulfillment hubs with near-zero error rates.',
  },
  {
    companyName: 'Veridian Operations',
    headline: 'The Gold Standard in Remote Delivery & Insights',
    authorName: 'David Sterling',
    authorRole: 'Managing Director & Principal Consultant',
    metricBadge: '35+ Hrs Saved Weekly',
    industry: 'Shared Services',
    quote:
      'OPG represents the gold standard in remote talent delivery. Their business intelligence pod engineered automated reporting pipelines that saved our executive team over 35 hours weekly in manual data assembly. The transparency, caliber, and proactive communication are unmatched.',
  },
] as const

const partnerFields = partnerCopyDefaults.flatMap((partner, index) =>
  (Object.entries(partner) as Array<[string, string]>).map(([name, value]) =>
    field(
      `partner${index + 1}${name[0].toUpperCase()}${name.slice(1)}`,
      `${partner.name} · ${name}`,
      value,
      name === 'description',
    ),
  ),
)

const testimonialFields = testimonialCopyDefaults.flatMap(
  (testimonial, index) =>
    (Object.entries(testimonial) as Array<[string, string]>).map(
      ([name, value]) =>
        field(
          `testimonial${index + 1}${name[0].toUpperCase()}${name.slice(1)}`,
          `${testimonial.companyName} · ${name}`,
          value,
          name === 'quote',
        ),
    ),
)

export const CLIENTS_COPY_SECTIONS: readonly CopySection[] = [
  {
    id: 'clients-hero-copy',
    title: 'Hero details',
    description: 'Hero badge and primary button.',
    fields: [
      field('heroBadge', 'Badge', 'Strategic Partnerships & Global Reach'),
      field('heroCta', 'Primary button', 'Partner with Us'),
      field('heroSecondary', 'Secondary link', 'Explore Client Work ↓'),
    ],
  },
  {
    id: 'clients-article-copy',
    title: 'Partnership playbook',
    description:
      'Article metadata, author, sidebar, metrics, sections, and list entries.',
    fields: [
      field('articleDate', 'Published label', 'Published Autumn 2026'),
      field('articleReadTime', 'Reading time', '4 min read'),
      field('authorName', 'Author name', 'OPG Strategic Advisory'),
      field('authorRole', 'Author role', 'Global Pod Operations'),
      field('relatedDate', 'Related article date', 'OCTOBER 2026 — 4 MIN READ'),
      field(
        'relatedTitle',
        'Related article title',
        'The Future of Dedicated Talent: Pod Economics & Retention Playbooks',
      ),
      field('relatedCta', 'Related article link', 'Read Now'),
      field('stat1Value', 'Statistic 1 value', '98%'),
      field('stat1Label', 'Statistic 1 label', 'Partner Retention'),
      field('stat2Value', 'Statistic 2 value', '4+ Hrs'),
      field('stat2Label', 'Statistic 2 label', 'Daily Timezone Overlap'),
      field('stat3Value', 'Statistic 3 value', '14 Days'),
      field('stat3Label', 'Statistic 3 label', 'Zero-Friction Ramp'),
      field(
        'articleIntro',
        'Article opening paragraphs (one per line)',
        'Outsourced Pro Global (OPG) wasn’t started by agency salespeople looking to chase placement fees. Our leadership team cut its teeth building and scaling high-volume internal talent engines across the Asia-Pacific and Oceania regions.\nTasked with solving complex hiring bottlenecks for fast-growing enterprises, we built an internal blueprint for sourcing, vetting, and onboarding top-tier remote and onsite professionals—consistently outperforming industry benchmarks for time-to-hire, retention, and cultural fit across South Asia, Southeast Asia, Australia, and New Zealand.\nOver time, we saw a recurring gap in the market: growing companies struggled to find recruitment partners who understood both emerging APAC talent hubs and established ANZ markets while operating with an in-house mindset.\nWe launched Outsourced Pro Global to bring that exact internal infrastructure to external partners—giving scaling businesses plug-and-play access to enterprise-grade recruitment without the overhead of building it from scratch.',
        true,
      ),
      field(
        'articleSection1Title',
        'First section heading',
        'Why Partners Choose an Embedded Model',
      ),
      field(
        'articleSection1Body',
        'First section paragraph',
        'Because our DNA is rooted in internal talent operations rather than transactional agency recruiting, we integrate directly into your workflows, culture, and commercial goals:',
        true,
      ),
      field(
        'articleSection1Items',
        'First section list (one per line)',
        'The In-House Standard: We don’t play a volume numbers game. Having sat on the internal side of the table, we know a bad hire drains leadership time and team morale—so we screen every candidate with the rigor of an internal HR team.\nTrue APAC & ANZ Reach: With deep operational roots across the Philippines, India, Australia, and New Zealand, we navigate local labor laws, compensation benchmarks, and cultural nuances seamlessly—whether you need an onsite executive in Sydney or a remote operations team in Manila.\nPlug-and-Play Infrastructure: You get immediate access to our proven sourcing tech stack, active talent pipelines, and structured vetting scorecards from day one.\nFlexible Scale: Whether you need rapid ramp-up for seasonal demand or targeted headhunting for niche senior roles, our model scales up or down with your business cycle.',
        true,
      ),
      field(
        'articleSection2Title',
        'Second section heading',
        'Our Core Services',
      ),
      field(
        'articleSection2Body',
        'Second section paragraph',
        'Targeted recruitment and workforce solutions built to operate seamlessly alongside your internal team:',
        true,
      ),
      field(
        'articleSection2Items',
        'Second section list (one per line)',
        'End-to-End Talent Acquisition: We manage the full recruitment lifecycle—from market mapping and direct headhunting to structured technical assessments and onboarding—operating as a seamless extension of your team.\nManaged Resume Screening as a Service: Acting as a dedicated screening filter for your existing job ads and applicant pools, our recruiters review, grade, and shortlist incoming CVs so your hiring managers only interview top-tier candidates.\nHR Admin & Global Payroll: We take the friction out of cross-border workforce management—handling timekeeping, compliance, record management, and accurate, on-time multi-currency salary disbursements.',
        true,
      ),
      field(
        'articleClosingTitle',
        'Closing section heading',
        'Ready to Upgrade Your Hiring Engine?',
      ),
      field(
        'articleClosingBody',
        'Closing section paragraph',
        'Whether you are scaling an offshore operations hub or searching for niche onshore talent, let’s talk through your upcoming hiring roadmap. Book a 15-minute pipeline consultation to see how an embedded talent model can cut your time-to-hire.',
        true,
      ),
    ],
  },
  {
    id: 'clients-testimonials-copy',
    title: 'Client endorsements',
    description: 'Heading above the testimonial carousel.',
    fields: [
      field(
        'testimonialsEyebrow',
        'Eyebrow',
        'Verified Executive Endorsements',
      ),
      field('testimonialsTitle', 'Heading', 'Hear from Brands That Trust Us'),
      field(
        'testimonialsLead',
        'Introduction',
        'Our clients’ success stories showcase the value we bring to every project. Here’s what they have to say about working with us.',
        true,
      ),
    ],
  },
  {
    id: 'clients-quotes-copy',
    title: 'Featured testimonial cards',
    description: 'The five featured carousel endorsements.',
    fields: testimonialFields,
  },
  {
    id: 'clients-directory-copy',
    title: 'Partner directory',
    description: 'Directory heading and introduction.',
    fields: [
      field('directoryEyebrow', 'Eyebrow', 'Partner Profiles'),
      field(
        'directoryTitle',
        'Heading',
        'Client Directory & Operational Footprint',
      ),
      field(
        'directoryLead',
        'Introduction',
        'A comprehensive view of each partner company, their industry specialization, the dedicated offshore pod powering their growth, and direct links to connect with their brand.',
        true,
      ),
    ],
  },
  {
    id: 'clients-profiles-copy',
    title: 'Featured partners and profiles',
    description:
      'The five featured hero cards and their full directory profiles.',
    fields: partnerFields,
  },
  {
    id: 'clients-cta-copy',
    title: 'Final call to action',
    description: 'Closing message and two button labels.',
    fields: [
      field('ctaEyebrow', 'Eyebrow', 'Build With OPG'),
      field(
        'ctaTitle',
        'Heading',
        'Ready to Build Your Dedicated Offshore Team?',
      ),
      field(
        'ctaBody',
        'Description',
        'Whether you need specialized software engineers, 24/7 customer support champions, or compliance professionals, OPG designs bespoke offshore pods ready to deliver from day one.',
        true,
      ),
      field('ctaPrimary', 'Primary button', 'Start a Conversation'),
      field('ctaSecondary', 'Secondary button', 'Explore Pod Services'),
    ],
  },
]

export const CAREERS_COPY_SECTIONS: readonly CopySection[] = [
  {
    id: 'careers-hero-copy',
    title: 'Hero',
    description: 'Career page heading and introduction.',
    fields: [
      field('heroTitle', 'Heading', 'Build Your Career with OPG'),
      field(
        'heroLead',
        'Introduction',
        'We connect high-performing professionals with forward-thinking global enterprises. Enjoy remote flexibility, competitive compensation, and meaningful career acceleration.',
        true,
      ),
    ],
  },
  {
    id: 'careers-benefits-copy',
    title: 'Why join OPG',
    description: 'The three benefit cards.',
    fields: [
      field('benefitsTitle', 'Section heading', 'Why Join OPG'),
      field('benefit1Title', 'Card 1 heading', '🌍 Truly Global & Flexible'),
      field(
        'benefit1Body',
        'Card 1 description',
        'Work from anywhere with asynchronous-friendly practices and respect for work-life integration.',
        true,
      ),
      field(
        'benefit2Title',
        'Card 2 heading',
        '🚀 High-Impact Enterprise Projects',
      ),
      field(
        'benefit2Body',
        'Card 2 description',
        'Collaborate directly with top-tier multinational clients on modern tech stacks and mission-critical workflows.',
        true,
      ),
      field(
        'benefit3Title',
        'Card 3 heading',
        '📈 Accelerated Professional Growth',
      ),
      field(
        'benefit3Body',
        'Card 3 description',
        'Continuous skill development, technical mentorship, and clear pathways to leadership roles.',
        true,
      ),
    ],
  },
  {
    id: 'careers-openings-copy',
    title: 'Open positions',
    description:
      'Jobs section headings, filters, buttons, and empty state. Individual jobs are managed in Careers.',
    fields: [
      field('openingsTitle', 'Heading before count', 'Open Positions'),
      field(
        'openingsLead',
        'Introduction',
        'Explore open roles across our global partner network. All applications are reviewed directly by our recruitment team.',
        true,
      ),
      field('filterAll', 'All roles filter', 'All Roles'),
      field('filterRemote', 'Remote filter', 'Remote'),
      field('filterHybrid', 'Hybrid filter', 'Hybrid'),
      field('emptyTitle', 'Empty state heading', 'No open positions right now'),
      field(
        'emptyMessage',
        'Empty state message',
        'We do not have any open positions at the moment. You can still share your CV or introduce yourself to recruitment@opglobal.com.hk for upcoming opportunities.',
        true,
      ),
      field('applyCta', 'Apply button', 'Apply Now ↗'),
      field('detailsCta', 'Details button', 'View Details'),
    ],
  },
]

export const ARTICLES_COPY_SECTIONS: readonly CopySection[] = [
  {
    id: 'articles-intro-copy',
    title: 'Page introduction',
    description: 'Accessible title and featured article label.',
    fields: [
      field('pageTitle', 'Page title', 'OPG articles and industry insights'),
      field('featuredLabel', 'Featured article label', 'Featured perspective'),
      field('latestTitle', 'Latest articles heading', 'Latest stories'),
    ],
  },
  {
    id: 'articles-collection-copy',
    title: 'Article collection',
    description:
      'Section heading and introduction. Individual stories are managed in Articles.',
    fields: [
      field('collectionEyebrow', 'Eyebrow', 'People & perspectives'),
      field('collectionTitle', 'Heading', 'Stories worth sharing'),
      field(
        'collectionLead',
        'Introduction',
        'Real experiences, practical lessons, and the people shaping work at OPG.',
        true,
      ),
    ],
  },
  {
    id: 'articles-empty-copy',
    title: 'Empty states',
    description: 'Messages when no articles are available.',
    fields: [
      field('emptyTitle', 'Empty state heading', 'No articles found'),
      field(
        'emptyCategory',
        'Empty category message',
        'No articles match this category yet. Explore another topic or check back soon.',
        true,
      ),
      field(
        'emptyAll',
        'No stories message',
        'Our editorial team is preparing new stories. Please check back shortly.',
        true,
      ),
    ],
  },
]

export const CONTACT_COPY_SECTIONS: readonly CopySection[] = [
  {
    id: 'contact-hero-copy',
    title: 'Hero',
    description: 'Page introduction.',
    fields: [
      field('heroEyebrow', 'Eyebrow', 'Get In Touch'),
      field('heroTitle', 'Heading', 'Contact Us'),
      field(
        'heroLead',
        'Introduction',
        'Whether you are evaluating dedicated cross-border pods or exploring your next career move, our global team is ready to assist.',
        true,
      ),
    ],
  },
  {
    id: 'contact-channels-copy',
    title: 'Official channels',
    description: 'Public contact details and legacy client inquiry copy.',
    fields: [
      field('channelsEyebrow', 'Card eyebrow', 'Official Channels'),
      field('channelsTitle', 'Card title', 'Contact Information'),
      field(
        'clientLabel',
        'Legacy client inquiry label',
        'Client & Institutional Inquiries:',
      ),
      field(
        'clientEmail',
        'Legacy client inquiry email',
        'inquiries@opglobal.com.hk',
      ),
      field(
        'clientDescription',
        'Legacy client inquiry description',
        'For staffing scopes, dedicated teams, and commercial agreements.',
        true,
      ),
      field('talentLabel', 'Contact email label', 'Email us'),
      field('talentEmail', 'Contact email', 'recruitment@opglobal.com.hk'),
      field(
        'talentDescription',
        'Contact email description',
        'For recruitment, partnerships, and general inquiries.',
        true,
      ),
    ],
  },
  {
    id: 'contact-teaser-copy',
    title: 'Articles teaser',
    description: 'Closing link to the Articles page.',
    fields: [
      field('teaserTitle', 'Heading', 'Looking for more insight?'),
      field(
        'teaserBody',
        'Description',
        'Explore practical perspectives on remote staffing, compliance, onboarding, and building high-performing global teams.',
        true,
      ),
      field('teaserCta', 'Button', 'Browse Articles →'),
    ],
  },
  {
    id: 'contact-form-copy',
    title: 'Inquiry form',
    description:
      'Tabs, field labels, help text, confirmation, and button copy.',
    fields: [
      field('clientTabTitle', 'Client tab title', 'Client Inquiry'),
      field(
        'clientTabDescription',
        'Client tab description',
        'For organizations seeking global talent solutions',
      ),
      field('talentTabTitle', 'Talent tab title', 'Talent Inquiry'),
      field(
        'talentTabDescription',
        'Talent tab description',
        'For professionals & candidate questions',
      ),
      field(
        'talentNotice',
        'Talent notice',
        'Looking for open positions? Browse active roles and apply directly through our official portal on the',
        true,
      ),
      field('careersLink', 'Careers link', 'Careers Page →'),
      field('successBadge', 'Success badge', '✓ Inquiry Received'),
      field('successTitle', 'Success heading', 'Thank you for reaching out'),
      field(
        'successBody',
        'Success description',
        'Your inquiry has been received by our global operations team.',
        true,
      ),
      field('referenceLabel', 'Reference label', 'Reference ID:'),
      field(
        'successSla',
        'Success response time',
        'Our team reviews all incoming inquiries and will respond within 1 business day.',
        true,
      ),
      field('againButton', 'Submit another button', 'Submit Another Inquiry'),
      field('nameLabel', 'Name label', 'Full Name'),
      field('namePlaceholder', 'Name placeholder', 'e.g. Eleanor Vance'),
      field('emailLabel', 'Email label', 'Work Email Address'),
      field(
        'emailPlaceholder',
        'Email placeholder',
        'e.g. eleanor.vance@enterprise.com',
      ),
      field('subjectLabel', 'Subject label', 'Subject'),
      field(
        'clientSubjectPlaceholder',
        'Client subject placeholder',
        'e.g. Scaling Engineering Pods in APAC',
      ),
      field(
        'talentSubjectPlaceholder',
        'Talent subject placeholder',
        'e.g. Candidate Operations Inquiry',
      ),
      field('messageLabel', 'Message label', 'Message'),
      field(
        'messagePlaceholder',
        'Message placeholder',
        'Please provide details about your organization, team requirements, timeline, or query...',
      ),
      field(
        'messageHint',
        'Message help text',
        'Minimum 20 characters. Include organizational scope or technical objectives.',
        true,
      ),
      field(
        'privacyPrefix',
        'Privacy consent wording',
        'I agree to the processing of my contact information in accordance with OPG’s',
        true,
      ),
      field('privacyLink', 'Privacy link', 'Privacy Notice'),
      field('sendingButton', 'Sending button', 'Sending Inquiry...'),
      field('submitButton', 'Submit button', 'Submit Inquiry'),
      field(
        'formSla',
        'Response time note',
        '⚡ SLA: Response typically within 1 business day',
      ),
    ],
  },
]

export const ADDITIONAL_PAGE_COPY = {
  careers: CAREERS_COPY_SECTIONS,
  articles: ARTICLES_COPY_SECTIONS,
  contact: CONTACT_COPY_SECTIONS,
} as const

export type AdditionalPage = keyof typeof ADDITIONAL_PAGE_COPY

export function getPageCopy(
  content: RichTextBlock[] | null | undefined,
  sections: readonly CopySection[],
) {
  const values: Record<string, string> = {}
  const named = new Map<string, string>()
  for (const block of Array.isArray(content) ? content : []) {
    if (block.type === 'paragraph' && block.key)
      named.set(block.key, block.content)
  }
  for (const section of sections) {
    for (const item of section.fields)
      values[item.key] = named.get(item.key) ?? item.defaultValue
  }
  return values
}

export function getAboutPageCopy(
  aboutContent: RichTextBlock[] | null | undefined,
  legacyMission:
    | { title: string; summary: string | null; content: RichTextBlock[] }
    | null
    | undefined,
) {
  const copy = getPageCopy(aboutContent, ABOUT_COPY_SECTIONS)
  if (!legacyMission) return copy
  const named = new Set(
    (Array.isArray(aboutContent) ? aboutContent : []).flatMap((block) =>
      block.type === 'paragraph' && block.key ? [block.key] : [],
    ),
  )
  const legacy = extractMissionVisionContent(legacyMission.content)
  const fallback: Record<string, string> = {
    purposeTitle: legacyMission.title,
    purposeLead: legacyMission.summary || copy.purposeLead,
    missionTitle: legacy.missionTitle,
    missionBody: legacy.missionBody,
    visionTitle: legacy.visionTitle,
    visionBody: legacy.visionBody,
    valuesLead: legacy.calloutText,
  }
  for (const [key, value] of Object.entries(fallback)) {
    if (!named.has(key) && value.trim()) copy[key] = value
  }
  return copy
}

export function readPageCopy(
  formData: FormData,
  sections: readonly CopySection[],
) {
  const values: Record<string, string> = {}
  const errors: Record<string, string> = {}
  for (const section of sections) {
    for (const item of section.fields) {
      const raw = formData.get(item.key)
      const value = typeof raw === 'string' ? raw.trim() : ''
      if (!value) errors[item.key] = `${item.label} is required.`
      else if (value.length > 5000)
        errors[item.key] = `${item.label} is too long.`
      else if (
        item.key.endsWith('Email') &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      )
        errors[item.key] = `${item.label} must be a valid email address.`
      values[item.key] = value
    }
  }
  return { values, errors }
}

export function pageCopyBlocks(
  values: Record<string, string>,
): RichTextBlock[] {
  return Object.entries(values).map(([key, content]) => ({
    type: 'paragraph',
    key,
    content,
  }))
}
