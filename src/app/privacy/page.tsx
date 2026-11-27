import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Building01Icon,
  File01Icon,
  InformationCircleIcon,
  LockKeyIcon,
  Mail01Icon,
  SecurityCheckIcon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { getSiteUrl, siteConfig } from '@/lib/site-config'

import styles from './privacy.module.css'

export const revalidate = 86400 // 24 hours ISR

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/privacy', siteUrl).toString()

  return {
    title: `Privacy Notice | ${siteConfig.shortName}`,
    description:
      'Official Privacy Notice detailing how Outsourced Pro Global collects, secures, retains, and processes personal information across accounts, inquiries, job applications, newsletters, and client portals.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `Privacy Notice | ${siteConfig.name}`,
      description:
        'How Outsourced Pro Global protects personal data across contact inquiries, career applications, account authentication, and partner workflows.',
      url: pageUrl,
      siteName: siteConfig.name,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

const SECTIONS = [
  { id: 'section-1', num: '01', title: 'Scope & Data Controller' },
  { id: 'section-2', num: '02', title: 'Information We Collect' },
  { id: 'section-3', num: '03', title: 'How We Use Your Information' },
  { id: 'section-4', num: '04', title: 'Third-Party Infrastructure & Processors' },
  { id: 'section-5', num: '05', title: 'Data Retention Schedules' },
  { id: 'section-6', num: '06', title: 'Technical & Organizational Safeguards' },
  { id: 'section-7', num: '07', title: 'Cross-Border Data Transfers' },
  { id: 'section-8', num: '08', title: 'Your Privacy Rights & Choices' },
  { id: 'section-9', num: '09', title: 'Session Storage & Essential Cookies' },
  { id: 'section-10', num: '10', title: 'Updates & Privacy Contacts' },
] as const

export default function PrivacyNoticePage() {
  return (
    <div className={`${styles.privacyPage} privacy-page`}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Privacy Notice</h1>
          <p className={styles.pageSubtitle}>
            This Privacy Notice explains how Outsourced Pro Global collects,
            uses, stores, protects, and retains personal data across our public
            website, authenticated user portals, contact inquiry workflows,
            career applications, and newsletter communications.
          </p>

          <div className={styles.headerMetaRow}>
            <div className={styles.metaItem}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.metaIcon}
                icon={File01Icon}
                size={16}
              />
              <span>Effective Date: November 27, 2026</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaBadge}>Version 1.0</span>
            </div>
            <div className={styles.metaItem}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.metaIcon}
                icon={Building01Icon}
                size={16}
              />
              <span>
                Operating Hubs: Manila (HQ) · Sydney · Singapore · London · New
                York
              </span>
            </div>
          </div>
        </header>

        {/* Layout: Sticky TOC + Content */}
        <div className={styles.layoutGrid}>
          <aside
            aria-label="Privacy Notice Table of Contents"
            className={styles.tocSidebar}
          >
            <div className={styles.tocTitle}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.tocTitleIcon}
                icon={ShieldCheckIcon}
                size={18}
              />
              <span>Table of Contents</span>
            </div>

            <nav className={styles.tocNav}>
              <ul className={styles.tocList}>
                {SECTIONS.map((sec) => (
                  <li key={sec.id}>
                    <a className={styles.tocLink} href={`#${sec.id}`}>
                      {sec.num}. {sec.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.tocSupportNote}>
              <p>
                Need to exercise a data access, correction, or deletion right,
                or ask about inquiry retention?
              </p>
              <Link className={styles.tocSupportLink} href="/contact">
                Contact Privacy Team &rarr;
              </Link>
            </div>
          </aside>

          <main className={styles.contentArea}>
            <div className={styles.leadNotice}>
              <strong>Transparency &amp; Accountability.</strong> Outsourced Pro
              Global collects only the personal data strictly needed to respond
              to client or talent inquiries, process job applications, operate
              verified accounts, deliver double opt-in newsletters, and safeguard
              platform integrity.
            </div>

            {/* Section 1 */}
            <section className={styles.sectionBlock} id="section-1">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>01</span>
                <h2 className={styles.sectionHeading}>
                  Scope &amp; Data Controller
                </h2>
              </div>
              <p className={styles.paragraph}>
                <strong>Outsourced Pro Global</strong> (&ldquo;OPG&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) acts
                as the data controller for personal information collected
                through our official digital platform at{' '}
                <strong>{siteConfig.canonicalUrl}</strong>, including:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  Authenticated user accounts, sign-in portals, and profile
                  preferences.
                </li>
                <li className={styles.bulletItem}>
                  Business and talent inquiries submitted through our{' '}
                  <Link className={styles.inlineLink} href="/contact">
                    Contact Us
                  </Link>{' '}
                  form.
                </li>
                <li className={styles.bulletItem}>
                  Job applications and résumés submitted through{' '}
                  <Link className={styles.inlineLink} href="/careers">
                    Careers
                  </Link>
                  .
                </li>
                <li className={styles.bulletItem}>
                  Candidate testimonial submissions, executive endorsements, and
                  verified newsletter subscriptions.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className={styles.sectionBlock} id="section-2">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>02</span>
                <h2 className={styles.sectionHeading}>
                  Information We Collect Across the System
                </h2>
              </div>
              <p className={styles.paragraph}>
                The categories of personal data processed depend on how you
                interact with our platform:
              </p>

              <div className={styles.dataTableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>System Feature</th>
                      <th>Data Collected</th>
                      <th>Protection &amp; Consent Mechanism</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>User Accounts</strong> (`/sign-in`, `/sign-up`,
                        `/account`)
                      </td>
                      <td>
                        Email address, full name, password credentials or Google
                        OAuth identity, profile avatar URL, and admin TOTP
                        multi-factor state (where applicable).
                      </td>
                      <td>
                        Authenticated session cookies, role-based access control
                        (RBAC), and AAL2 authenticator verification for staff.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Contact Inquiries</strong> (`/contact`)
                      </td>
                      <td>
                        Full name, account-verified email address, inquiry
                        routing intent (Client or Talent), subject, message, and
                        a one-way SHA-256 IP hash.
                      </td>
                      <td>
                        Requires signed-in account verification, explicit
                        Privacy Notice consent checkbox, rate limiting, and
                        anti-bot verification.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Careers &amp; Applications</strong> (`/careers`)
                      </td>
                      <td>
                        Applicant name, email, contact details, screening
                        questionnaire responses, cover details, and résumé files
                        (PDF, DOC, DOCX, or TXT).
                      </td>
                      <td>
                        Transmitted directly over TLS to our recruitment ATS
                        (JazzHR); résumés are not exposed in public storage.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Testimonials &amp; Endorsements</strong>{' '}
                        (`/testimonials`)
                      </td>
                      <td>
                        Contributor name, verified account email, role title,
                        relationship type, star rating, testimonial quote, and
                        optional profile photo.
                      </td>
                      <td>
                        Explicit publication consent checkbox required;
                        contributor photos are stored in a private bucket and
                        accessed via signed URLs.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Newsletter</strong>
                      </td>
                      <td>
                        Email address and subscription verification status.
                      </td>
                      <td>
                        Double opt-in confirmation (`/newsletter/confirm`) and
                        instant one-click `/newsletter/unsubscribe`.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>FAQ Assistant &amp; Engagement Telemetry</strong>
                      </td>
                      <td>
                        Questions typed into the interactive FAQ assistant;
                        anonymous aggregate article view/like and daily page
                        visit counts.
                      </td>
                      <td>
                        No cross-site advertising pixels or behavioral tracking;
                        users should avoid entering sensitive secrets in FAQ
                        chat prompts.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={`${styles.calloutNotice} ${styles.calloutNoticeGold}`}>
                <div className={styles.calloutHeader}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className={styles.calloutIcon}
                    icon={SecurityCheckIcon}
                    size={16}
                  />
                  <span>Privacy-Preserving Abuse Prevention</span>
                </div>
                <p className={styles.calloutText}>
                  When you submit a contact inquiry, our server computes an
                  irreversible SHA-256 cryptographic hash of the request IP
                  address strictly for anti-spam throttling. Raw client IP
                  addresses are not persisted inside the inquiry inbox table.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className={styles.sectionBlock} id="section-3">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>03</span>
                <h2 className={styles.sectionHeading}>
                  How &amp; Why We Use Your Information
                </h2>
              </div>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Inquiry Triage &amp; Direct Response:</strong> To
                  evaluate enterprise staffing inquiries or candidate support
                  requests, issue a trackable Reference ID (`OPG-...`), route
                  alerts to our operations or recruitment team, and send direct
                  email replies.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Recruitment &amp; Placement:</strong> To review job
                  applications, assess candidate qualifications, and coordinate
                  interviews with hiring managers.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Portal Security &amp; Access Verification:</strong> To
                  authenticate user logins, maintain session integrity, enforce
                  multi-factor authentication for administrative workspaces, and
                  block automated abuse.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Showcase &amp; Publications:</strong> To display team
                  rosters, client partner profiles, approved articles, and
                  consented candidate or client testimonials.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Confirmed Communications:</strong> To dispatch
                  newsletters strictly to confirmed double opt-in subscribers.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className={styles.sectionBlock} id="section-4">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>04</span>
                <h2 className={styles.sectionHeading}>
                  Third-Party Infrastructure &amp; Sub-Processors
                </h2>
              </div>
              <p className={styles.paragraph}>
                Outsourced Pro Global{' '}
                <strong>does not sell or rent your personal data</strong>. We
                rely solely on vetted infrastructure providers necessary to
                deliver our platform reliably:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Supabase:</strong> Core PostgreSQL data storage with
                  Row-Level Security (RLS), user authentication, and encrypted
                  object storage (`public-media` for approved showcase assets
                  and private `candidate-profile-photos` for submission
                  portraits).
                </li>
                <li className={styles.bulletItem}>
                  <strong>JazzHR (Applicant Tracking System):</strong> Synchronizes
                  active job listings and receives candidate applications,
                  questionnaires, and uploaded résumé documents submitted on{' '}
                  <Link className={styles.inlineLink} href="/careers">
                    /careers
                  </Link>
                  .
                </li>
                <li className={styles.bulletItem}>
                  <strong>Resend:</strong> Transactional email provider used to
                  deliver official replies to contact inquiries and newsletter
                  confirmation messages.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Cloudflare Turnstile:</strong> Automated bot-mitigation
                  challenge used to protect public submission workflows where
                  enabled.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Google OAuth &amp; Google Gemini API:</strong>{' '}
                  Optional Google sign-in authentication and AI-assisted answer
                  formatting for visitor FAQ queries grounded in OPG&apos;s
                  published FAQ documentation.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className={styles.sectionBlock} id="section-5">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>05</span>
                <h2 className={styles.sectionHeading}>
                  Data Retention Schedules
                </h2>
              </div>
              <p className={styles.paragraph}>
                We retain personal information only for as long as needed to
                fulfill the operational, contractual, or legal purpose for which
                it was collected:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Contact Inquiries:</strong> Stored with an automated{' '}
                  <strong>365-day retention schedule</strong> from submission,
                  unless archived earlier, extended by an ongoing business or
                  legal relationship, or deleted upon verified request.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Candidate Applications &amp; Résumés:</strong> Retained
                  inside JazzHR in alignment with active recruitment cycles and
                  applicable employment recordkeeping obligations.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Newsletter Subscriptions:</strong> Retained until you
                  withdraw consent via the unsubscribe link present in every
                  communication.
                </li>
                <li className={styles.bulletItem}>
                  <strong>User Accounts &amp; Testimonials:</strong> Retained
                  while your account or approved publication remains active, or
                  removed promptly following moderation or an erasure request.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className={styles.sectionBlock} id="section-6">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>06</span>
                <h2 className={styles.sectionHeading}>
                  Technical &amp; Organizational Safeguards
                </h2>
              </div>
              <div className={styles.calloutNotice}>
                <div className={styles.calloutHeader}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className={styles.calloutIcon}
                    icon={LockKeyIcon}
                    size={16}
                  />
                  <span>Defense-in-Depth Architecture</span>
                </div>
                <p className={styles.calloutText}>
                  All traffic is protected via TLS 1.3 transport encryption,
                  database-enforced Row-Level Security (RLS) policies, audited
                  role permissions, mandatory authenticator MFA (AAL2) for
                  administrative operations, and private time-limited signed URLs
                  for candidate uploads.
                </p>
              </div>
              <p className={styles.paragraph}>
                For complete infrastructure security details, review our{' '}
                <Link className={styles.inlineLink} href="/security">
                  Security Policy
                </Link>
                .
              </p>
            </section>

            {/* Section 7 */}
            <section className={styles.sectionBlock} id="section-7">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>07</span>
                <h2 className={styles.sectionHeading}>
                  Cross-Border Data Transfers
                </h2>
              </div>
              <p className={styles.paragraph}>
                As a cross-border talent solutions organization operating hubs
                across the Philippines (Manila HQ), Hong Kong SAR, Australia
                (Sydney), Singapore, the United Kingdom (London), and the United
                States (New York), authorized personnel and integrated
                processors may access data across jurisdictions strictly under
                least-privilege authorization and contractual safeguards aligned
                with the Hong Kong PDPO, Philippine Data Privacy Act of 2012,
                Australian Privacy Principles, and GDPR/UK GDPR standards where
                applicable.
              </p>
            </section>

            {/* Section 8 */}
            <section className={styles.sectionBlock} id="section-8">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>08</span>
                <h2 className={styles.sectionHeading}>
                  Your Privacy Rights &amp; Choices
                </h2>
              </div>
              <p className={styles.paragraph}>
                Depending on your jurisdiction, you may request to:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Access or Export:</strong> Obtain confirmation of the
                  personal data we hold about you (including referencing your{' '}
                  <code>OPG-...</code> inquiry ID).
                </li>
                <li className={styles.bulletItem}>
                  <strong>Correct Inaccuracies:</strong> Update account profile
                  details via{' '}
                  <Link className={styles.inlineLink} href="/account">
                    Account Settings
                  </Link>{' '}
                  or ask our team to correct submitted records.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Delete / Erase:</strong> Request deletion of your
                  account, contact inquiries, candidate profile data, or
                  published testimonials subject to statutory retention duties.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Withdraw Consent:</strong> Opt out of newsletters
                  anytime via{' '}
                  <Link
                    className={styles.inlineLink}
                    href="/newsletter/unsubscribe"
                  >
                    Newsletter Unsubscribe
                  </Link>{' '}
                  or request removal of a published testimonial.
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className={styles.sectionBlock} id="section-9">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>09</span>
                <h2 className={styles.sectionHeading}>
                  Session Storage &amp; Essential Cookies
                </h2>
              </div>
              <p className={styles.paragraph}>
                Our platform uses strictly necessary authentication cookies
                (Supabase session tokens) to keep signed-in users authenticated,
                plus temporary browser <code>sessionStorage</code> keys (such as
                <code>opg_contact_draft_v1</code>) so your message draft is not
                lost if you sign in before submitting. Draft storage is
                automatically cleared upon successful submission. We do not use
                third-party advertising trackers or sell browsing profiles. See
                our{' '}
                <Link className={styles.inlineLink} href="/cookies">
                  Cookie Notice
                </Link>{' '}
                for further details.
              </p>
            </section>

            {/* Section 10 */}
            <section className={styles.sectionBlock} id="section-10">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>10</span>
                <h2 className={styles.sectionHeading}>
                  Notice Updates &amp; Privacy Contacts
                </h2>
              </div>
              <p className={styles.paragraph}>
                We review this Privacy Notice whenever platform capabilities,
                retention controls, or regulatory requirements change, updating
                the Effective Date and Version number at the top of this page.
              </p>

              <div className={styles.legalFooterSection}>
                <div className={styles.legalFooterTop}>
                  <h3 className={styles.legalFooterTitle}>
                    Data Privacy &amp; Governance Contacts
                  </h3>
                  <p className={styles.legalFooterDesc}>
                    To exercise a privacy right or contact our Data Protection
                    Officer, reach out via any verified channel below:
                  </p>
                </div>

                <div className={styles.legalContactGrid}>
                  <a
                    className={styles.contactPill}
                    href="mailto:privacy@opglobal.com.hk"
                  >
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={Mail01Icon}
                      size={18}
                    />
                    <span>privacy@opglobal.com.hk</span>
                  </a>

                  <a
                    className={styles.contactPill}
                    href="mailto:inquiries@opglobal.com.hk"
                  >
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={Mail01Icon}
                      size={18}
                    />
                    <span>inquiries@opglobal.com.hk</span>
                  </a>

                  <Link className={styles.contactPill} href="/contact">
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={InformationCircleIcon}
                      size={18}
                    />
                    <span>Contact Inquiries Portal</span>
                  </Link>

                  <Link className={styles.contactPill} href="/terms">
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={ShieldCheckIcon}
                      size={18}
                    />
                    <span>View Terms of Service</span>
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
