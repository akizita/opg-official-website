import fs from 'node:fs'

const nw = fs.readFileSync('scratch/nw.txt', 'utf8')
const br = fs.readFileSync('scratch/br.txt', 'utf8')

const code = `'use client'

import React, { memo } from 'react'
import styles from '@/app/sign-in/sign-in.module.css'

/**
 * Authentic Dotted ASCII Map Corner & Side Accents for the Sign-In Portal.
 *
 * Stuck flush to the corners and flanks in the background:
 * - Top-Left: North America, Transatlantic & Europe (London, New York, San Francisco)
 * - Bottom-Right: East Asia, Southeast Asia, Philippines Manila HQ, Singapore, Australia (Sydney)
 *
 * Keeps the centered login card completely clean, prominent, and free of overlap.
 * Marked decorative: aria-hidden="true".
 */
const TOP_LEFT_ASCII_MAP_D =
  '${nw}'

const BOTTOM_RIGHT_ASCII_MAP_D =
  '${br}'

export const SignInAsciiBackground = memo(function SignInAsciiBackground() {
  return (
    <div aria-hidden="true" className={styles.asciiBg}>
      {/* Top-Left Corner & Flank ASCII Map */}
      <div className={\`\${styles.asciiCorner} \${styles.asciiCornerTopLeft}\`}>
        <div className={styles.asciiHalo} />
        <svg
          viewBox="76 250 336 205"
          preserveAspectRatio="xMinYMin meet"
          className={styles.asciiSvg}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="signInPillShadow" x="-25%" y="-35%" width="150%" height="170%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="rgba(74, 55, 20, 0.12)" />
            </filter>
          </defs>

          {/* Authentic Continental Dots */}
          <path
            d={TOP_LEFT_ASCII_MAP_D}
            stroke="rgba(217, 119, 6, 0.68)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Hub Beacons & White Pill Badges */}
          <g className={styles.asciiPillGroup}>
            {/* San Francisco / US West */}
            <circle cx={135} cy={388} r={5} fill="rgba(245, 158, 11, 0.35)" />
            <circle cx={135} cy={388} r={2.5} fill="#f59e0b" />

            {/* New York / US East */}
            <g>
              <circle cx={232} cy={375} r={5.5} fill="rgba(245, 158, 11, 0.35)" />
              <circle cx={232} cy={375} r={2.8} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />
              <line x1={232} y1={375} x2={232} y2={364} stroke="rgba(217, 119, 6, 0.45)" strokeWidth={1} />
              <rect x={192} y={342} width={80} height={22} rx={11} className={styles.hubPillBg} filter="url(#signInPillShadow)" />
              <text x={232} y={353} textAnchor="middle" className={styles.hubPillText}>
                New York
              </text>
            </g>

            {/* London / Europe */}
            <g>
              <circle cx={398} cy={345} r={5.5} fill="rgba(245, 158, 11, 0.35)" />
              <circle cx={398} cy={345} r={2.8} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />
              <line x1={398} y1={345} x2={375} y2={334} stroke="rgba(217, 119, 6, 0.45)" strokeWidth={1} />
              <rect x={340} y={312} width={70} height={22} rx={11} className={styles.hubPillBg} filter="url(#signInPillShadow)" />
              <text x={375} y={323} textAnchor="middle" className={styles.hubPillText}>
                London
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Bottom-Right Corner & Flank ASCII Map */}
      <div className={\`\${styles.asciiCorner} \${styles.asciiCornerBottomRight}\`}>
        <div className={styles.asciiHalo} />
        <svg
          viewBox="630 380 186 324"
          preserveAspectRatio="xMaxYMax meet"
          className={styles.asciiSvg}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="signInPillShadowHq" x="-30%" y="-40%" width="160%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(234, 88, 12, 0.2)" />
            </filter>
          </defs>

          {/* Authentic Continental Dots */}
          <path
            d={BOTTOM_RIGHT_ASCII_MAP_D}
            stroke="rgba(217, 119, 6, 0.68)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Hub Beacons & White Pill Badges */}
          <g className={styles.asciiPillGroup}>
            {/* Philippines Global Operations HQ (Manila) - Dominant Beacon */}
            <g>
              {/* Pulsing Radar Ring */}
              <circle
                className={styles.asciiPulseRing}
                cx={704}
                cy={498}
                r={16}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.5}
              />
              <circle cx={704} cy={498} r={8.5} fill="rgba(245, 158, 11, 0.3)" />
              <circle cx={704} cy={498} r={5} fill="#ea580c" stroke="#ffffff" strokeWidth={1.5} />
              <circle cx={704} cy={498} r={2} fill="#ffffff" />
              <line x1={704} y1={498} x2={704} y2={480} stroke="#ea580c" strokeWidth={1.2} />
              <rect x={655} y={456} width={98} height={24} rx={12} className={styles.hubPillBgHq} filter="url(#signInPillShadowHq)" />
              <text x={704} y={468} textAnchor="middle" className={styles.hubPillTextHq}>
                Manila (HQ)
              </text>
            </g>

            {/* Singapore */}
            <g>
              <circle cx={658} cy={528} r={5} fill="rgba(245, 158, 11, 0.35)" />
              <circle cx={658} cy={528} r={2.5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />
              <line x1={658} y1={528} x2={665} y2={548} stroke="rgba(217, 119, 6, 0.45)" strokeWidth={1} />
              <rect x={634} y={548} width={78} height={22} rx={11} className={styles.hubPillBg} filter="url(#signInPillShadow)" />
              <text x={673} y={559} textAnchor="middle" className={styles.hubPillText}>
                Singapore
              </text>
            </g>

            {/* Sydney / Australia */}
            <g>
              <circle cx={715} cy={660} r={5.5} fill="rgba(245, 158, 11, 0.35)" />
              <circle cx={715} cy={660} r={2.8} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />
              <line x1={715} y1={660} x2={726} y2={659} stroke="rgba(217, 119, 6, 0.45)" strokeWidth={1} />
              <rect x={726} y={648} width={66} height={22} rx={11} className={styles.hubPillBg} filter="url(#signInPillShadow)" />
              <text x={759} y={659} textAnchor="middle" className={styles.hubPillText}>
                Sydney
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
})

/**
 * Backward compatibility alias for existing imports.
 */
export const SignInWorldMap = SignInAsciiBackground
`

fs.writeFileSync('src/components/ui/sign-in-world-map.tsx', code, 'utf8')
console.log('Successfully wrote src/components/ui/sign-in-world-map.tsx')
