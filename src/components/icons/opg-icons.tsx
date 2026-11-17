import type { SVGProps } from 'react'

export type OpgIconProps = SVGProps<SVGSVGElement> & {
  className?: string
  size?: number | string
}

/* =========================================================================
   OPG BESPOKE ICON SUITE — MINIMAL & PROFESSIONAL
   Crafted with precision geometric balance, consistent 1.75px stroke dynamics,
   and clean uncluttered silhouettes for enterprise administration & editorial tools.
   ========================================================================= */

/**
 * 1. OPG Dashboard / Command Overview Icon
 * Minimal modern 4-panel asymmetric command grid.
 */
export function OpgIconDashboard({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <rect height="7" rx="1.5" width="7" x="3.5" y="3.5" />
      <rect height="7" rx="1.5" width="7" x="13.5" y="3.5" />
      <rect height="7" rx="1.5" width="7" x="3.5" y="13.5" />
      <rect height="7" rx="1.5" width="7" x="13.5" y="13.5" />
    </svg>
  )
}

/**
 * 2. OPG Articles / Editorial & Insights Icon
 * Minimalist editorial document with folded corner and clean pacing lines.
 */
export function OpgIconArticles({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
      <path d="M8 9h2" />
    </svg>
  )
}

/**
 * 3. OPG Testimonials / Candidate Endorsements Icon
 * Clean conversational speech bubble with dialogue pacing indicators.
 */
export function OpgIconTestimonials({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
      <path d="M8 10h8" />
      <path d="M8 13.5h5" />
    </svg>
  )
}

/**
 * 4. OPG Clients / Enterprise Alliances Icon
 * Precision corporate towers with architectural foundation.
 */
export function OpgIconClients({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M15 21v-8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8" />
      <path d="M9 7h2" />
      <path d="M9 11h2" />
      <path d="M9 15h2" />
    </svg>
  )
}

/**
 * 5. OPG Contacts / Inquiries Dispatch Icon
 * Minimal enterprise mail envelope.
 */
export function OpgIconContacts({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <rect height="14" rx="2" width="18" x="3" y="5" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

/**
 * 6. OPG Subscribers / Community Audience Icon
 * Minimal dual-member audience silhouette.
 */
export function OpgIconSubscribers({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

/**
 * 7. OPG Visits / Telemetry Ocular Icon
 * Sleek panoramic eye lens with central focus iris.
 */
export function OpgIconVisits({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/**
 * 8. OPG Views / Growth Performance Icon
 * Minimalist vertical performance pillars.
 */
export function OpgIconViews({ className, size = 24, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  )
}

/**
 * 9. OPG Likes / Reader Engagement Icon
 * Minimalist sculpted heart.
 */
export function OpgIconLikes({ className, size = 24, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

/**
 * 10. OPG Sign Out / Exit Gateway Icon
 * Portal gateway with direct departure trajectory.
 */
export function OpgIconSignOut({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

/**
 * 11. OPG Sidebar Toggle Icon
 * Clean rail panel with directional indicator.
 */
export function OpgIconSidebarToggle({
  className,
  collapsed = false,
  size = 24,
  ...props
}: OpgIconProps & { collapsed?: boolean | null }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M9 3v18" />
      {collapsed ? <path d="m13 15 3-3-3-3" /> : <path d="m15 9-3 3 3 3" />}
    </svg>
  )
}

/**
 * 12. OPG Warning Icon
 * Minimal rounded alert triangle.
 */
export function OpgIconWarning({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" strokeWidth={2.5} />
    </svg>
  )
}

/**
 * 13. OPG Danger Icon
 * Clean octagonal alert polygon.
 */
export function OpgIconDanger({
  className,
  size = 24,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" strokeWidth={2.5} />
    </svg>
  )
}

/**
 * 14. OPG Search Icon
 * Minimalist precision magnifying glass (20x20).
 */
export function OpgIconSearch({
  className,
  size = 20,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4.5 4.5" />
    </svg>
  )
}

/**
 * 15. OPG Reply Icon
 * Clean curved reply arrow (20x20).
 */
export function OpgIconReply({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="m7.5 4.5-5 5 5 5" />
      <path d="M2.5 9.5h9a5 5 0 0 1 5 5v1" />
    </svg>
  )
}

/**
 * 16. OPG External Mail / Outbound Icon (20x20)
 */
export function OpgIconExternalMail({
  className,
  size = 20,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="M15 10.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5H9.5" />
      <path d="M12.5 3.5h4v4" />
      <path d="m10 10 6.5-6.5" />
    </svg>
  )
}

/**
 * 17. OPG Template Icon (20x20)
 * Clean blueprint document template.
 */
export function OpgIconTemplate({
  className,
  size = 20,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <rect height="14" rx="2" width="13" x="3.5" y="3" />
      <path d="M7 7h6" />
      <path d="M7 10h6" />
      <path d="M7 13h3.5" />
    </svg>
  )
}

/**
 * 18. OPG Send Icon (20x20)
 * Precision aerodynamic launch glyph.
 */
export function OpgIconSend({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="m3 9.5 14-6.5-6.5 14-2.5-5-5-2.5Z" />
      <path d="m8 12 9-9" />
    </svg>
  )
}

/**
 * 19. OPG Filter Icon (20x20)
 * Clean funnel indicator.
 */
export function OpgIconFilter({
  className,
  size = 20,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="M3 4.5h14l-5.5 6.2v4.8l-3 1.5v-6.3L3 4.5Z" />
    </svg>
  )
}

/**
 * 20. OPG Chevron Icon (20x20)
 * Crisp modern directional chevron.
 */
export function OpgIconChevron({
  className,
  size = 20,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  )
}

/**
 * 21. OPG More (Three Dots) Icon (24x24)
 * Balanced horizontal triple-node indicator.
 */
export function OpgIconMore({ className, size = 24, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}

/**
 * 22. OPG Trash / Delete Icon (24x24)
 * Precision minimal bin with lid and vertical clearance channels.
 */
export function OpgIconTrash({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

/* =========================================================================
   ADDITIONAL CORE UTILITY & ACTION ICONS
   ========================================================================= */

/**
 * 23. OPG Check Icon (20x20)
 * Clean positive confirmation mark.
 */
export function OpgIconCheck({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="m4 10.5 4 4 8-9" />
    </svg>
  )
}

/**
 * 24. OPG Close / Dismiss Icon (20x20)
 * Precision diagonal cross.
 */
export function OpgIconClose({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="m5 5 10 10" />
      <path d="m15 5-10 10" />
    </svg>
  )
}

/**
 * 25. OPG Plus / Add Icon (20x20)
 * Crisp orthogonal addition cross.
 */
export function OpgIconPlus({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="M10 4v12" />
      <path d="M4 10h12" />
    </svg>
  )
}

/**
 * 26. OPG Edit / Pencil Icon (20x20)
 * Modern angled stylus with drafting tip.
 */
export function OpgIconEdit({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="M14.5 2.5a2.121 2.121 0 0 1 3 3L6.5 16.5 2 18l1.5-4.5L14.5 2.5Z" />
    </svg>
  )
}

/**
 * 27. OPG Copy Icon (20x20)
 * Dual-sheet clip matrix.
 */
export function OpgIconCopy({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <rect height="11" rx="1.5" width="11" x="6.5" y="6.5" />
      <path d="M4.5 13.5H3.5a1.5 1.5 0 0 1-1.5-1.5V3.5a1.5 1.5 0 0 1 1.5-1.5h8.5a1.5 1.5 0 0 1 1.5 1.5v1" />
    </svg>
  )
}

/**
 * 28. OPG Upload Icon (20x20)
 * Ingestion arrow into receiver tray.
 */
export function OpgIconUpload({
  className,
  size = 20,
  ...props
}: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="M3 13.5v2a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-2" />
      <path d="m6.5 7.5 3.5-4 3.5 4" />
      <path d="M10 3.5v9" />
    </svg>
  )
}

/**
 * 29. OPG Link Icon (20x20)
 * Minimal interlocking chain links.
 */
export function OpgIconLink({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L9.75 5.25" />
      <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1.25-1.25" />
    </svg>
  )
}

/**
 * 30. OPG User / Author Icon (20x20)
 * Minimal single profile avatar.
 */
export function OpgIconUser({ className, size = 20, ...props }: OpgIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 20 20"
      width={size}
      {...props}
    >
      <path d="M16 17v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 15.5V17" />
      <circle cx="10" cy="6.5" r="3.5" />
    </svg>
  )
}
