import type { Metadata } from 'next'
import Link from 'next/link'
import {
  AlertCircleIcon,
  Building01Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  InformationCircleIcon,
  LockKeyIcon,
  Mail01Icon,
  SafeIcon,
  SecurityCheckIcon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { getSiteUrl, siteConfig } from '@/lib/site-config'

import styles from './security.module.css'

export const revalidate = 86400 // 24 hours ISR

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/security', siteUrl).toString()

  return {
    title: `Security Policy | ${siteConfig.shortName}`,
    description:
      'Learn about Outsource Pro Global enterprise security standards, data encryption, Zero Trust access controls, physical hub protection, and compliance frameworks.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `Security Policy | ${siteConfig.name}`,
      description:
        'Enterprise security, cryptographic protection, Zero Trust architecture, and global talent pod compliance at Outsource Pro Global.',
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
  { id: 'sec-1', num: '01', title: 'Security Commitment & Governance' },
  { id: 'sec-2', num: '02', title: 'Data Protection & Cryptography' },
  { id: 'sec-3', num: '03', title: 'Identity & Access Control (Zero Trust)' },
  { id: 'sec-4', num: '04', title: 'Talent Pod & Endpoint Security' },
  { id: 'sec-5', num: '05', title: 'Global Hub Physical Security' },
  { id: 'sec-6', num: '06', title: 'Network Architecture & Perimeter' },
  { id: 'sec-7', num: '07', title: 'Personnel Screening & Training' },
  { id: 'sec-8', num: '08', title: 'Vulnerability Management & Audits' },
  { id: 'sec-9', num: '09', title: 'Incident Response & Continuity' },
  { id: 'sec-10', num: '10', title: 'Responsible Disclosure Program' },
]

export default function SecurityPolicyPage() {
  return (
    <div className={`${styles.securityPage} security-page`}>
      <div className={styles.container}>
        {/* Unboxed Header */}
        <header className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Security Policy</h1>
          <p className={styles.pageSubtitle}>
            Outsource Pro Global maintains rigorous physical, technical, and
            organizational safeguards to protect enterprise client operations,
            proprietary work product, and candidate data worldwide.
          </p>

          <div className={styles.headerMetaRow}>
            <div className={styles.metaItem}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.metaIcon}
                icon={File01Icon}
                size={16}
              />
              <span>Last Reviewed: November 2026</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaBadgeGreen}>SOC 2 Type II Aligned</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaBadge}>ISO/IEC 27001 Controls</span>
            </div>
            <div className={styles.metaItem}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.metaIcon}
                icon={Building01Icon}
                size={16}
              />
              <span>Global Security Operations Center (GSOC) · Manila HQ</span>
            </div>
          </div>
        </header>

        {/* Security Pillars (4 Pillars) */}
        <section
          aria-label="Core Security Pillars"
          className={styles.pillarsGrid}
        >
          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.pillarIcon}
                icon={LockKeyIcon}
                size={20}
              />
              <h2 className={styles.pillarTitle}>Data Encryption</h2>
            </div>
            <p className={styles.pillarDesc}>
              256-bit TLS 1.3 encryption in transit with strict HSTS; AES-256
              encryption for all database stores, backups, and credentials at
              rest.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.pillarIcon}
                icon={SecurityCheckIcon}
                size={20}
              />
              <h2 className={styles.pillarTitle}>Zero Trust Access</h2>
            </div>
            <p className={styles.pillarDesc}>
              Mandatory Multi-Factor Authentication (MFA), role-based access
              controls (RBAC), and least-privilege permission models across all
              tiers.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.pillarIcon}
                icon={Building01Icon}
                size={20}
              />
              <h2 className={styles.pillarTitle}>Hub Facility Controls</h2>
            </div>
            <p className={styles.pillarDesc}>
              Biometric access, 24/7 CCTV surveillance, clean-desk policies, and
              managed hardware across our global hubs in Manila, Sydney, and
              beyond.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.pillarIcon}
                icon={SafeIcon}
                size={20}
              />
              <h2 className={styles.pillarTitle}>Continuous Assurance</h2>
            </div>
            <p className={styles.pillarDesc}>
              Annual independent third-party penetration testing, automated
              vulnerability scanning, and strict 48-hour incident notification
              SLAs.
            </p>
          </div>
        </section>

        {/* Layout Grid: Sticky Sidebar + Main Body */}
        <div className={styles.layoutGrid}>
          {/* Table of Contents Sidebar */}
          <aside
            aria-label="Security Policy Table of Contents"
            className={styles.tocSidebar}
          >
            <div className={styles.tocTitle}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.tocTitleIcon}
                icon={ShieldCheckIcon}
                size={18}
              />
              <span>Security Navigation</span>
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
                Need to complete a vendor security assessment or request our SOC
                2 Type II report?
              </p>
              <Link className={styles.tocSupportLink} href="/contact">
                Contact Enterprise Security &rarr;
              </Link>
            </div>
          </aside>

          {/* Policy Document Content Area */}
          <main className={styles.contentArea}>
            <div className={styles.leadNotice}>
              <strong>Enterprise Security Baseline:</strong> Outsource Pro
              Global is committed to safeguarding client intellectual property,
              cross-border workforce infrastructure, and digital portal
              integrity. This Security Policy outlines the technical and
              operational controls enforced across all OPG systems and global
              operating hubs.
            </div>

            {/* Section 1 */}
            <section className={styles.sectionBlock} id="sec-1">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>01</span>
                <h2 className={styles.sectionHeading}>
                  Security Commitment &amp; Governance
                </h2>
              </div>
              <p className={styles.paragraph}>
                Security is embedded in every layer of Outsource Pro Global
                operations. Our executive leadership team and dedicated Chief
                Information Security Officer (CISO) mandate strict compliance
                with international cybersecurity frameworks, including{' '}
                <strong>SOC 2 Type II</strong> trust services criteria and{' '}
                <strong>ISO/IEC 27001:2022</strong> information security
                management standards.
              </p>
              <p className={styles.paragraph}>
                All policies undergo formal annual reviews and mandatory
                re-evaluations following any major architectural updates,
                regulatory amendments, or material risk assessments.
              </p>
            </section>

            {/* Section 2 */}
            <section className={styles.sectionBlock} id="sec-2">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>02</span>
                <h2 className={styles.sectionHeading}>
                  Data Protection &amp; Cryptography
                </h2>
              </div>
              <p className={styles.paragraph}>
                We employ defense-in-depth cryptographic architectures to secure
                client records, candidate dossiers, and communication channels:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Data in Transit:</strong> All web traffic, API
                  endpoints, and administrative portals enforce modern Transport
                  Layer Security (TLS 1.3 and TLS 1.2 minimum) with strict
                  forward secrecy cipher suites. HTTP Strict Transport Security
                  (HSTS) is enabled with preloading across all production domains.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Data at Rest:</strong> Database tables, document
                  storage volumes, media repositories, and off-site backup
                  snapshots are encrypted using industry-standard{' '}
                  <strong>AES-256</strong> cryptographic algorithms with
                  hardware-backed key management.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Key Management:</strong> Encryption keys are
                  regularly rotated, securely segregated from data stores, and
                  managed via enterprise Key Management Services (KMS) with strict
                  least-privilege access rules.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className={styles.sectionBlock} id="sec-3">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>03</span>
                <h2 className={styles.sectionHeading}>
                  Identity &amp; Access Control (Zero Trust)
                </h2>
              </div>
              <div className={`${styles.calloutNotice} ${styles.calloutNoticeGold}`}>
                <div className={styles.calloutHeader}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className={styles.calloutIcon}
                    icon={SecurityCheckIcon}
                    size={16}
                  />
                  <span>Zero Trust Principle: Never Trust, Always Verify</span>
                </div>
                <p className={styles.calloutText}>
                  Every access request—whether originating from within our
                  physical hub network or externally through remote portal
                  gateways—is authenticated, authorized, and cryptographically
                  verified before access is granted.
                </p>
              </div>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Multi-Factor Authentication (MFA):</strong> MFA is
                  strictly enforced for all internal personnel, administrative
                  accounts, and client portal operations via Time-based
                  One-Time Password (TOTP) protocols or hardware security keys.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Role-Based Access Control (RBAC):</strong> Access
                  privileges are assigned strictly according to operational
                  necessity. Developers, talent pod members, and administrative
                  managers are granted the minimum permissions required to
                  perform their specific roles.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Session Hygiene:</strong> Portal authentication
                  tokens utilize secure, SameSite, HTTP-only cookie storage with
                  automated idle timeouts and immediate server-side revocation
                  upon sign-out.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className={styles.sectionBlock} id="sec-4">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>04</span>
                <h2 className={styles.sectionHeading}>
                  Talent Pod &amp; Endpoint Security
                </h2>
              </div>
              <p className={styles.paragraph}>
                Dedicated talent pods working on behalf of enterprise clients
                adhere to rigorous workstation and endpoint security protocols:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Managed Enterprise Workstations:</strong> All
                  hardware is company-issued and enrolled in centralized Mobile
                  Device Management (MDM). Personal devices (BYOD) are strictly
                  prohibited from accessing client code repositories or
                  confidential environments.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Endpoint Protection:</strong> Automated Endpoint
                  Detection and Response (EDR) software continuously monitors
                  workstations for anomalous activity, malware execution, and
                  unauthorized binary execution.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Port &amp; Peripheral Lockdown:</strong> USB ports and
                  external removable storage devices are blocked by MDM policy
                  on all talent workstations, preventing unauthorized data
                  exfiltration.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Clean-Desk Policy:</strong> Workstation areas enforce
                  strict clean-desk and clean-screen standards. Screen privacy
                  filters are deployed for teams handling sensitive financial,
                  medical, or confidential client records.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className={styles.sectionBlock} id="sec-5">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>05</span>
                <h2 className={styles.sectionHeading}>
                  Global Hub Physical Security
                </h2>
              </div>
              <p className={styles.paragraph}>
                Our operational facilities across{' '}
                <strong>Manila HQ, Sydney, Singapore, London, and New York</strong>{' '}
                are architected with multi-layered perimeter defense:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Biometric Access Control:</strong> Entry to talent
                  production floors and network server rooms requires biometric
                  fingerprint or facial verification paired with RFID security
                  badges.
                </li>
                <li className={styles.bulletItem}>
                  <strong>24/7 CCTV &amp; Security Guards:</strong> High-definition
                  surveillance covers all entry points, server rooms, and floor
                  workspaces with video footage archived securely for a minimum of
                  ninety (90) days.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Environmental &amp; Power Redundancy:</strong> All
                  production hubs feature automated fire suppression systems,
                  climate control, dual enterprise fiber feeds, and uninterruptible
                  power supplies (UPS) backed by on-site diesel generator systems.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className={styles.sectionBlock} id="sec-6">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>06</span>
                <h2 className={styles.sectionHeading}>
                  Network Architecture &amp; Perimeter
                </h2>
              </div>
              <p className={styles.paragraph}>
                OPG network architecture is isolated into segmented Virtual
                Private Cloud (VPC) zones:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Web Application Firewall (WAF):</strong> Enterprise
                  WAF systems filter incoming application traffic, shielding
                  portals from OWASP Top 10 vulnerabilities including SQL
                  injection, Cross-Site Scripting (XSS), and automated credential
                  stuffing attacks.
                </li>
                <li className={styles.bulletItem}>
                  <strong>DDoS Shielding:</strong> Multi-tiered Distributed
                  Denial of Service (DDoS) mitigation guarantees portal uptime
                  and absorbs volumetric network anomalies.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Network Segmentation:</strong> Client project
                  environments, talent pod subnets, and corporate administration
                  networks operate within distinct, firewall-segregated zones with
                  zero cross-contamination.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className={styles.sectionBlock} id="sec-7">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>07</span>
                <h2 className={styles.sectionHeading}>
                  Personnel Screening &amp; Training
                </h2>
              </div>
              <div className={`${styles.calloutNotice} ${styles.calloutNoticeGreen}`}>
                <div className={styles.calloutHeader}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className={styles.calloutIconGreen}
                    icon={CheckmarkCircle02Icon}
                    size={16}
                  />
                  <span>100% Background-Vetted Global Workforce</span>
                </div>
                <p className={styles.calloutText}>
                  Every candidate and employee undergoes comprehensive background
                  screening prior to employment, including identity validation,
                  criminal background history, reference checks, and credential
                  verification.
                </p>
              </div>
              <p className={styles.paragraph}>
                <strong>Security Awareness Training:</strong> All employees
                complete mandatory security onboarding and quarterly refresher
                modules covering phishing prevention, social engineering, data
                classification, and confidential document handling.
              </p>
            </section>

            {/* Section 8 */}
            <section className={styles.sectionBlock} id="sec-8">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>08</span>
                <h2 className={styles.sectionHeading}>
                  Vulnerability Management &amp; Audits
                </h2>
              </div>
              <p className={styles.paragraph}>
                We maintain a proactive stance toward threat identification and
                remediation:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <strong>Automated Code Scanning:</strong> All application code
                  is analyzed through Static Application Security Testing (SAST)
                  and Software Composition Analysis (SCA) to detect known CVEs
                  before deployment.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Annual Penetration Testing:</strong> Independent,
                  CREST-accredited cybersecurity firms perform comprehensive
                  annual black-box and white-box penetration tests on our
                  infrastructure. Executive summaries are available to
                  enterprise clients under NDA.
                </li>
                <li className={styles.bulletItem}>
                  <strong>Patch Management:</strong> Critical and high-severity
                  vulnerabilities are remediated within 7 days of discovery, with
                  standard patches deployed within 30 days.
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className={styles.sectionBlock} id="sec-9">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>09</span>
                <h2 className={styles.sectionHeading}>
                  Incident Response &amp; Continuity
                </h2>
              </div>
              <p className={styles.paragraph}>
                Our Security Incident Response Team (SIRT) maintains a 24/7/365
                vigil to identify, contain, and remediate potential security
                events.
              </p>

              <div className={styles.slaRow}>
                <div className={styles.slaBox}>
                  <div className={styles.slaMetric}>&le; 48 hrs</div>
                  <div className={styles.slaLabel}>Breach Notification</div>
                  <div className={styles.slaSub}>
                    Guaranteed written notification for confirmed incidents.
                  </div>
                </div>

                <div className={styles.slaBox}>
                  <div className={styles.slaMetric}>&lt; 1 hr</div>
                  <div className={styles.slaLabel}>Recovery Point (RPO)</div>
                  <div className={styles.slaSub}>
                    Automated encrypted multi-region database backups.
                  </div>
                </div>

                <div className={styles.slaBox}>
                  <div className={styles.slaMetric}>&lt; 4 hrs</div>
                  <div className={styles.slaLabel}>Recovery Time (RTO)</div>
                  <div className={styles.slaSub}>
                    Redundant cluster failover and disaster recovery SLA.
                  </div>
                </div>
              </div>

              <p className={styles.paragraph}>
                In the event of a verified security incident affecting client
                data, OPG will immediately execute containment protocols,
                initiate forensic investigations, and deliver formal updates to
                designated client security contacts.
              </p>
            </section>

            {/* Section 10 */}
            <section className={styles.sectionBlock} id="sec-10">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>10</span>
                <h2 className={styles.sectionHeading}>
                  Responsible Disclosure Program
                </h2>
              </div>
              <p className={styles.paragraph}>
                We value contributions from security researchers and the global
                infosec community. If you discover a potential vulnerability
                within any Outsource Pro Global web application or service:
              </p>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  Promptly email technical details, replication steps, and proof
                  of concept to <strong>security@opglobal.com.hk</strong>.
                </li>
                <li className={styles.bulletItem}>
                  Provide us a reasonable window of time to investigate and
                  mitigate the vulnerability before public disclosure.
                </li>
                <li className={styles.bulletItem}>
                  Do not exploit the vulnerability to view, alter, or exfiltrate
                  user data, nor cause service disruption (DoS/DDoS).
                </li>
              </ul>
              <p className={styles.paragraph}>
                OPG operates under a Safe Harbor policy: we will not pursue legal
                action against researchers who act in good faith and adhere to
                these responsible disclosure guidelines.
              </p>

              {/* Security Contacts Footer (Unboxed) */}
              <div className={styles.securityFooterSection}>
                <div className={styles.securityFooterTop}>
                  <h3 className={styles.securityFooterTitle}>
                    Security &amp; Incident Reporting
                  </h3>
                  <p className={styles.securityFooterDesc}>
                    For urgent security disclosures, vendor security reviews, or
                    SOC 2 compliance requests:
                  </p>
                </div>

                <div className={styles.securityContactGrid}>
                  <a
                    className={styles.contactPill}
                    href="mailto:security@opglobal.com.hk"
                  >
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={Mail01Icon}
                      size={18}
                    />
                    <span>security@opglobal.com.hk</span>
                  </a>

                  <Link className={styles.contactPill} href="/terms">
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={InformationCircleIcon}
                      size={18}
                    />
                    <span>Terms of Service</span>
                  </Link>

                  <Link className={styles.contactPill} href="/privacy">
                    <HugeiconsIcon
                      aria-hidden="true"
                      className={styles.contactPillIcon}
                      icon={AlertCircleIcon}
                      size={18}
                    />
                    <span>Privacy Notice</span>
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
