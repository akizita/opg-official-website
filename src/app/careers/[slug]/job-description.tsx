import {
  Briefcase01Icon,
  CheckmarkCircle02Icon,
  Coins01Icon,
  Rocket01Icon,
  SparklesIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import styles from './job-detail.module.css'

type Section = {
  bullets: string[]
  heading: string
  isBenefit: boolean
  paragraphs: string[]
}

const HEADING_PATTERNS = [
  /^(?:benefits|compensation|what we offer|service fee)[\s:]*$/i,
  /^(?:essential requirements|requirements|qualifications|skills|key requirements|technical stack)[\s:]*$/i,
  /^(?:about the role|the opportunity|role overview|who you are|about this role)[\s:]*$/i,
  /^(?:duties & responsibilities|duties and responsibilities|responsibilities|what you will do|what you'll do|key responsibilities)[\s:]*$/i,
  /^(?:why join us|why join opg|company culture|working with us)[\s:]*$/i,
]

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length > 55) return false
  if (HEADING_PATTERNS.some((pattern) => pattern.test(trimmed))) return true
  // Any short line ending with a colon that isn't a bullet
  if (
    trimmed.endsWith(':') &&
    trimmed.length <= 45 &&
    !/^[•\-\*\d]/.test(trimmed)
  ) {
    return true
  }
  return false
}

function cleanHeadingText(line: string): string {
  return line.replace(/[:]+$/, '').trim()
}

function getSectionIcon(heading: string) {
  const lower = heading.toLowerCase()
  if (
    lower.includes('benefit') ||
    lower.includes('compensation') ||
    lower.includes('offer')
  ) {
    return Coins01Icon
  }
  if (
    lower.includes('requirement') ||
    lower.includes('qualification') ||
    lower.includes('skill') ||
    lower.includes('stack')
  ) {
    return CheckmarkCircle02Icon
  }
  if (
    lower.includes('role') ||
    lower.includes('opportunity') ||
    lower.includes('overview')
  ) {
    return SparklesIcon
  }
  if (lower.includes('responsibilit') || lower.includes('dut')) {
    return Briefcase01Icon
  }
  if (lower.includes('why') || lower.includes('culture')) {
    return UserGroupIcon
  }
  return Rocket01Icon
}

function parseJobDescription(text: string): Section[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const sections: Section[] = []
  let currentSection: Section = {
    bullets: [],
    heading: 'Overview',
    isBenefit: false,
    paragraphs: [],
  }

  for (const line of rawLines) {
    if (isHeadingLine(line)) {
      if (
        currentSection.paragraphs.length > 0 ||
        currentSection.bullets.length > 0
      ) {
        sections.push(currentSection)
      }
      const heading = cleanHeadingText(line)
      const lower = heading.toLowerCase()
      currentSection = {
        bullets: [],
        heading,
        isBenefit:
          lower.includes('benefit') ||
          lower.includes('compensation') ||
          lower.includes('offer'),
        paragraphs: [],
      }
      continue
    }

    // Bullet point detection
    if (/^[•\-\*]\s*|^\d+\.\s*/.test(line)) {
      const cleanBullet = line.replace(/^[•\-\*]\s*|^\d+\.\s*/, '').trim()
      if (cleanBullet) {
        // Filter out redundant "Job Type: ..." bullets
        if (/^job\s*type\s*:/i.test(cleanBullet)) {
          continue
        }
        currentSection.bullets.push(cleanBullet)
      }
      continue
    }

    // Regular paragraph line (filter out redundant "Job Type:" line)
    if (/^job\s*type\s*:/i.test(line)) {
      continue
    }
    currentSection.paragraphs.push(line)
  }

  if (
    currentSection.paragraphs.length > 0 ||
    currentSection.bullets.length > 0
  ) {
    sections.push(currentSection)
  }

  return sections
}

function renderParagraphContent(p: string) {
  const match = p.match(
    /^(About the Role|The Opportunity|Role Overview|About this Position|Who You Are|Company Culture|Why Join Us|Key Responsibilities|Qualifications|Requirements)[:.]?\s+([A-Z].*)/i,
  )
  if (match) {
    const [, lead, rest] = match
    return (
      <>
        <strong className={styles.paragraphLead}>{lead}</strong>
        <span>{rest}</span>
      </>
    )
  }
  return p
}

export function JobDescription({ text }: { text: string | null }) {
  if (!text) {
    return (
      <p className={styles.paragraph}>
        Full role details are available for this opportunity. Please submit your
        application below.
      </p>
    )
  }

  const sections = parseJobDescription(text)

  return (
    <div className={styles.descriptionContent}>
      {sections.map((section, idx) => {
        const IconComponent = getSectionIcon(section.heading)
        const isHighlight = section.isBenefit

        return (
          <section
            className={isHighlight ? styles.benefitsHighlight : styles.section}
            key={`${section.heading}-${idx}`}
          >
            <h3 className={styles.sectionHeading}>
              <span className={styles.sectionHeadingIcon}>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={IconComponent}
                  size={18}
                />
              </span>
              <span>{section.heading}</span>
            </h3>

            {section.paragraphs.length > 0 && (
              <div className={styles.paragraphs}>
                {section.paragraphs.map((p, pIdx) => (
                  <p className={styles.paragraph} key={pIdx}>
                    {renderParagraphContent(p)}
                  </p>
                ))}
              </div>
            )}

            {section.bullets.length > 0 && (
              <ul className={styles.list}>
                {section.bullets.map((bullet, bIdx) => (
                  <li className={styles.listItem} key={bIdx}>
                    <span aria-hidden="true" className={styles.listBullet} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

