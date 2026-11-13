import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Building01Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  InformationCircleIcon,
  LockKeyIcon,
  Mail01Icon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { getSiteUrl, siteConfig } from '@/lib/site-config'

import styles from './terms.module.css'

export const revalidate = 86400 // 24 hours ISR

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/terms', siteUrl).toString()

  return {
    title: `Terms of Service | ${siteConfig.shortName}`,
    description:
      'Official Terms of Service governing enterprise client engagements, dedicated talent pods, digital portal access, and candidate recruitment at Outsource Pro Global.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `Terms of Service | ${siteConfig.name}`,
      description:
        'Official Terms of Service governing enterprise talent operations, digital portal access, and cross-border staffing at Outsource Pro Global.',
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
  { id: 'section-1', num: '01', title: 'Agreement & Acceptance' },
  { id: 'section-2', num: '02', title: 'Scope of Services & Talent Operations' },
  { id: 'section-3', num: '03', title: 'User Accounts & Portal Security' },
  { id: 'section-4', num: '04', title: 'Client Engagements & Dedicated Pods' },
  { id: 'section-5', num: '05', title: 'Candidate & Professional Terms' },
  { id: 'section-6', num: '06', title: 'Intellectual Property & Work Product' },
  { id: 'section-7', num: '07', title: 'Confidentiality & Non-Disclosure' },
  { id: 'section-8', num: '08', title: 'Data Privacy & Cross-Border Compliance' },
  { id: 'section-9', num: '09', title: 'Acceptable Use Policy' },
  { id: 'section-10', num: '10', title: 'Commercial Billing & Invoicing' },
  { id: 'section-11', num: '11', title: 'Service Warranties & Standard of Care' },
  { id: 'section-12', num: '12', title: 'Limitation of Liability' },
  { id: 'section-13', num: '13', title: 'Term, Suspension & Orderly Exit' },
  { id: 'section-14', num: '14', title: 'Governing Law & Dispute Resolution' },
  { id: 'section-15', num: '15', title: 'Amendments & Legal Contacts' },
]

export default function TermsPage() {
  return (
    <div className={`${styles.termsPage} terms-page`}>
      <div className={styles.container}>
        {/* Unboxed Header Section */}
        <header className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Terms of Service</h1>
          <p className={styles.pageSubtitle}>
            These Terms of Service govern your access to Outsource Pro Global
            digital portals, enterprise staffing operations, dedicated
            cross-border talent pods, and candidate career discovery services.
          </p>

          <div className={styles.headerMetaRow}>
            <div className={styles.metaItem}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.metaIcon}
                icon={File01Icon}
                size={16}
              />
              <span>Effective Date: November 13, 2026</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaBadge}>Version 2.4</span>
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

        {/* Layout Grid: Sticky Sidebar + Main Body */}
        <div className={styles.layoutGrid}>
          {/* Table of Contents Sidebar */}
          <aside
            aria-label="Terms of Service Table of Contents"
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
                Have questions regarding custom enterprise terms or Master
                Services Agreements (MSA)?
              </p>
              <Link className={styles.tocSupportLink} href="/contact">
                Contact Enterprise Legal &rarr;
              </Link>
            </div>
          </aside>

          {/* Legal Document Content */}
          <main className={styles.contentArea}>
            <div className={styles.leadNotice}>
              <strong>Please read these Terms carefully.</strong> By registering
              for an account, accessing our digital portals, submitting an
              inquiry, or engaging Outsource Pro Global for dedicated talent
              services, you confirm your acceptance of these Terms and agree to
              be bound by all provisions herein.
            </div>

            {/* Section 1 */}
            <section className={styles.sectionBlock} id="section-1">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>01</span>
                <h2 className={styles.sectionHeading}>
                  Agreement &amp; Acceptance
                </h2>
              </div>
              <p className={styles.paragraph}>
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a
                legally binding contract between{' '}
                <strong>Outsource Pro Global</strong> (&ldquo;OPG&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) and
                the individual, enterprise, or corporate entity
                (&ldquo;Client&rdquo;, &ldquo;Candidate&rdquo;, &ldquo;User&rdquo;,
                or &ldquo;you&rdquo;) accessing our official websites, client
                management portals, talent discovery systems, and digital
                services (collectively, the &ldquo;Platform&rdquo;).
              </p>
              <p className={styles.paragraph}>
                If you are entering into these Terms on behalf of a company,
                partnership, or other legal entity, you represent and warrant
                that you have full legal authority to bind that entity to these
                Terms. If you do not possess such authority, or if you do not
                agree with any part of these Terms, you must not access the
                Platform or engage OPG services.
              </p>
            </section>

            {/* Section 2 */}
            <section className={styles.sectionBlock} id="section-2">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>02</span>
                <h2 className={styles.sectionHeading}>
                  Scope of Services &amp; Talent Operations
                </h2>
              </div>
              <p className={styles.paragraph}>
                Outsource Pro Global provides specialized cross-border talent
                solutions, offshore staffing services, and digital management
                infrastructure connecting organizations with qualified
                professionals. Our core operations encompass:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Dedicated Talent Pods:</strong> Formation, deployment,
                  and management of cross-border technical, operational, and
                  creative talent teams operating from our global hubs.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Digital Management Portal:</strong> A unified
                  enterprise interface enabling clients to manage operational
                  records, monitor recruitment pipelines, and review staffing
                  metrics.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Candidate Discovery &amp; Screening:</strong> Career
                  placement infrastructure, skills assessments, and applicant
                  tracking systems powered by verified talent workflows.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Strategic Advisory:</strong> Discovery consultations,
                  staffing assessments, and capacity planning for enterprise
                  expansion.
                </li>
              </ul>
              <p className={styles.paragraph}>
                Specific commercial terms, service levels, deliverables, and fee
                schedules for dedicated staffing engagements are further governed
                by executed Statements of Work (SOW) or Master Services
                Agreements (MSA), which incorporate these Terms by reference.
              </p>
            </section>

            {/* Section 3 */}
            <section className={styles.sectionBlock} id="section-3">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>03</span>
                <h2 className={styles.sectionHeading}>
                  User Accounts &amp; Portal Security
                </h2>
              </div>
              <p className={styles.paragraph}>
                Access to restricted portal features, inquiry tracking, and
                management workspaces requires registration of an authenticated
                account. When creating an account, you agree to:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  Provide accurate, current, and complete corporate and contact
                  information.
                </li>
                <li className={styles.bulletItem}>
                  Maintain the absolute confidentiality of your credentials,
                  including passwords and OAuth authentication tokens.
                </li>
                <li className={styles.bulletItem}>
                  Promptly notify OPG security teams at{' '}
                  <strong>security@opglobal.com.hk</strong> upon discovering or
                  suspecting any unauthorized access, compromised session, or
                  credential exposure.
                </li>
                <li className={styles.bulletItem}>
                  Accept responsibility for all activities, actions, and
                  transactions conducted through your authenticated credentials.
                </li>
              </ul>
              <div className={styles.calloutNotice}>
                <div className={styles.calloutHeader}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className={styles.calloutIcon}
                    icon={LockKeyIcon}
                    size={16}
                  />
                  <span>Enterprise Multi-Layer Encryption</span>
                </div>
                <p className={styles.calloutText}>
                  All portal sessions utilize 256-bit TLS encryption and
                  enterprise session verification. OPG reserves the right to
                  suspend credentials that exhibit suspicious behavior or violate
                  security thresholds.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className={styles.sectionBlock} id="section-4">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>04</span>
                <h2 className={styles.sectionHeading}>
                  Enterprise Client Engagements &amp; Dedicated Pods
                </h2>
              </div>
              <p className={styles.paragraph}>
                When an enterprise engages OPG for dedicated talent pods or
                offshore staffing solutions:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Operational Integration:</strong> Talent pods operate
                  as dedicated extensions of the Client&apos;s team, adhering to
                  designated working schedules, technical guidelines, and project
                  milestones agreed upon in the applicable SOW.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Hub Oversight:</strong> OPG provides physical office
                  infrastructure, enterprise hardware, redundant high-speed
                  connectivity, and on-site operational HR management across our
                  hubs in Manila (HQ), Sydney, Singapore, London, and New York.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Non-Solicitation &amp; Anti-Circumvention:</strong>{' '}
                  During the engagement and for twelve (12) months following the
                  conclusion of an SOW, Client agrees not to directly or
                  indirectly solicit, recruit, or hire any OPG personnel, talent
                  pod member, or contractor without prior written consent and
                  payment of the established conversion placement fee.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className={styles.sectionBlock} id="section-5">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>05</span>
                <h2 className={styles.sectionHeading}>
                  Candidate &amp; Professional Terms
                </h2>
              </div>
              <p className={styles.paragraph}>
                For candidates, applicants, and talent community members seeking
                opportunities through OPG:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Truthful Representations:</strong> All resumes,
                  certifications, work samples, portfolios, and biographical
                  data submitted must be truthful, accurate, and not misleading.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Assessment &amp; Screening:</strong> Submission of an
                  application authorizes OPG and its recruitment partners to
                  perform standard background verifications, employment history
                  validations, and technical competency assessments.
                </li>
                <li className={styles.bulletItem}>
                  <strong>No Guarantee of Placement:</strong> While OPG actively
                  matches qualified talent with international enterprise roles,
                  submitting an application does not guarantee employment or an
                  interview offer.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className={styles.sectionBlock} id="section-6">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>06</span>
                <h2 className={styles.sectionHeading}>
                  Intellectual Property &amp; Client Work Product
                </h2>
              </div>
              <div className={`${styles.calloutNotice} ${styles.calloutNoticeGold}`}>
                <div className={styles.calloutHeader}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className={styles.calloutIcon}
                    icon={CheckmarkCircle02Icon}
                    size={16}
                  />
                  <span>100% Client Ownership Guarantee</span>
                </div>
                <p className={styles.calloutText}>
                  All software code, designs, documentation, databases,
                  deliverables, and business assets created by dedicated talent
                  pods exclusively for a Client shall be deemed &ldquo;work made
                  for hire&rdquo; and belong 100% to the Client upon payment of
                  applicable service fees.
                </p>
              </div>
              <p className={styles.paragraph}>
                <strong>OPG Proprietary Assets:</strong> OPG retains all rights,
                title, and interest in and to its platform software, websites,
                APIs, brand marks, logos, recruitment methodologies, and
                pre-existing operational toolkits. You may not copy, reverse
                engineer, modify, or create derivative works of any OPG
                proprietary technology.
              </p>
            </section>

            {/* Section 7 */}
            <section className={styles.sectionBlock} id="section-7">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>07</span>
                <h2 className={styles.sectionHeading}>
                  Confidentiality &amp; Non-Disclosure
                </h2>
              </div>
              <p className={styles.paragraph}>
                &ldquo;Confidential Information&rdquo; refers to all non-public
                information disclosed by one party (&ldquo;Discloser&rdquo;) to
                the other (&ldquo;Recipient&rdquo;), including proprietary code,
                business plans, customer records, technical specifications, and
                financial data. Both parties agree to:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  Exercise at least a reasonable standard of enterprise care to
                  prevent unauthorized disclosure or use.
                </li>
                <li className={styles.bulletItem}>
                  Use Confidential Information solely to execute or receive the
                  contracted services.
                </li>
                <li className={styles.bulletItem}>
                  Restrict disclosure strictly to authorized employees, talent
                  pod members, and professional advisors bound by written
                  confidentiality obligations no less stringent than these Terms.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className={styles.sectionBlock} id="section-8">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>08</span>
                <h2 className={styles.sectionHeading}>
                  Data Privacy &amp; Cross-Border Compliance
                </h2>
              </div>
              <p className={styles.paragraph}>
                OPG operates in compliance with applicable international data
                privacy statutes, including the General Data Protection
                Regulation (GDPR), the Philippine Data Privacy Act of 2012 (RA
                10173), and the Australian Privacy Act 1988.
              </p>
              <p className={styles.paragraph}>
                Personal information collected through portal registrations, job
                applications, or client inquiries is processed in accordance with
                our{' '}
                <Link className={styles.tocSupportLink} href="/privacy">
                  Privacy Notice
                </Link>
                . We maintain rigorous organizational, physical, and technical
                safeguards across all cross-border data transfers.
              </p>
            </section>

            {/* Section 9 */}
            <section className={styles.sectionBlock} id="section-9">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>09</span>
                <h2 className={styles.sectionHeading}>
                  Acceptable Use Policy
                </h2>
              </div>
              <p className={styles.paragraph}>
                You agree not to use the Platform, portals, or services to:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  Probe, scan, or test the vulnerability of any OPG system,
                  network, or infrastructure without explicit written authorization.
                </li>
                <li className={styles.bulletItem}>
                  Scrape, crawl, harvest, or aggregate portal data, candidate
                  profiles, or client information via automated bots, scripts, or
                  spiders.
                </li>
                <li className={styles.bulletItem}>
                  Transmit malicious software, worms, viruses, or disruptive
                  payloads.
                </li>
                <li className={styles.bulletItem}>
                  Impersonate any individual, corporate representative, or OPG
                  team member.
                </li>
                <li className={styles.bulletItem}>
                  Engage in unlawful discrimination, harassment, or violations
                  of cross-border labor regulations.
                </li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className={styles.sectionBlock} id="section-10">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>10</span>
                <h2 className={styles.sectionHeading}>
                  Commercial Billing &amp; Invoicing
                </h2>
              </div>
              <p className={styles.paragraph}>
                Commercial rates, invoicing cycles, and payment terms for client
                engagements are stipulated in individual SOWs. Unless otherwise
                specified in writing:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  Invoices are issued monthly in advance for dedicated pod
                  retainers or monthly in arrears for time-and-materials
                  agreements.
                </li>
                <li className={styles.bulletItem}>
                  Payments are due within thirty (30) days of invoice date in the
                  designated billing currency (USD, AUD, GBP, or SGD).
                </li>
                <li className={styles.bulletItem}>
                  Late payments may be subject to interest at 1.5% per month or
                  the statutory maximum, whichever is lower.
                </li>
              </ul>
            </section>

            {/* Section 11 */}
            <section className={styles.sectionBlock} id="section-11">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>11</span>
                <h2 className={styles.sectionHeading}>
                  Service Warranties &amp; Standard of Care
                </h2>
              </div>
              <p className={styles.paragraph}>
                OPG warrants that it will deliver staffing operations and talent
                deployment services in a professional, workmanlike manner
                consistent with established industry standards.
              </p>
              <p className={styles.paragraph}>
                Except as expressly provided in an executed MSA, the Platform and
                digital portal services are provided on an &ldquo;as is&rdquo;
                and &ldquo;as available&rdquo; basis without warranties of any
                kind, either express or implied, including warranties of
                merchantability or fitness for a particular purpose.
              </p>
            </section>

            {/* Section 12 */}
            <section className={styles.sectionBlock} id="section-12">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>12</span>
                <h2 className={styles.sectionHeading}>
                  Limitation of Liability
                </h2>
              </div>
              <p className={styles.paragraph}>
                To the maximum extent permitted by applicable law, neither party
                shall be liable to the other for any indirect, incidental,
                special, consequential, or punitive damages (including loss of
                profits, revenue, business opportunities, or goodwill).
              </p>
              <p className={styles.paragraph}>
                Except for breaches of confidentiality or indemnification
                obligations under an executed MSA, each party&apos;s aggregate
                liability arising out of or related to these Terms shall be
                limited to the total fees paid or payable by Client to OPG under
                the applicable SOW in the twelve (12) months preceding the event
                giving rise to liability.
              </p>
            </section>

            {/* Section 13 */}
            <section className={styles.sectionBlock} id="section-13">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>13</span>
                <h2 className={styles.sectionHeading}>
                  Term, Suspension &amp; Orderly Exit
                </h2>
              </div>
              <p className={styles.paragraph}>
                These Terms remain effective for as long as you access the
                Platform or maintain an active staffing engagement. Either party
                may terminate an SOW according to its written notice provisions
                (typically thirty (30) to sixty (60) days written notice).
              </p>
              <p className={styles.paragraph}>
                Upon termination, OPG will facilitate an orderly transition of
                client deliverables, credentials, and operational workflows. All
                provisions relating to Intellectual Property, Confidentiality,
                Limitation of Liability, and Non-Solicitation shall survive
                termination.
              </p>
            </section>

            {/* Section 14 */}
            <section className={styles.sectionBlock} id="section-14">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>14</span>
                <h2 className={styles.sectionHeading}>
                  Governing Law &amp; Dispute Resolution
                </h2>
              </div>
              <p className={styles.paragraph}>
                These Terms shall be governed by and construed in accordance
                with the laws of the jurisdiction specified in your client SOW,
                or in the absence thereof, the laws of the Hong Kong Special
                Administrative Region, without regard to conflict of laws
                principles.
              </p>
              <p className={styles.paragraph}>
                In the event of any controversy or claim, the parties agree to
                first attempt informal, good-faith executive escalation for a
                period of thirty (30) days before initiating arbitration or legal
                proceedings.
              </p>
            </section>

            {/* Section 15 */}
            <section className={styles.sectionBlock} id="section-15">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>15</span>
                <h2 className={styles.sectionHeading}>
                  Amendments &amp; Legal Contacts
                </h2>
              </div>
              <p className={styles.paragraph}>
                We may periodically update these Terms to reflect operational,
                legal, or regulatory changes. Updated versions will be published
                on this page with a revised &ldquo;Effective Date&rdquo;.
                Continued use of the Platform after changes are posted
                constitutes acceptance of the revised Terms.
              </p>

              {/* Unboxed Legal Inquiries Footer */}
              <div className={styles.legalFooterSection}>
                <div className={styles.legalFooterTop}>
                  <h3 className={styles.legalFooterTitle}>
                    Legal &amp; Compliance Inquiries
                  </h3>
                  <p className={styles.legalFooterDesc}>
                    For inquiries regarding custom MSAs, compliance disclosures,
                    or privacy audits, reach our corporate governance team:
                  </p>
                </div>

                <div className={styles.legalContactGrid}>
                  <a
                    className={styles.contactPill}
                    href="mailto:legal@opglobal.com.hk"
                  >
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={Mail01Icon}
                      size={18}
                    />
                    <span>legal@opglobal.com.hk</span>
                  </a>

                  <Link className={styles.contactPill} href="/contact">
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={InformationCircleIcon}
                      size={18}
                    />
                    <span>Enterprise Inquiries Portal</span>
                  </Link>

                  <Link className={styles.contactPill} href="/privacy">
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={ShieldCheckIcon}
                      size={18}
                    />
                    <span>View Privacy Notice</span>
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
