import { useId } from 'react'

export const OPG_SWOOSH_PATH =
  'M 9.5 61.5 A 44 44 0 1 1 95 40.5 C 78 40 50 51 28 72 L 56 71 L 52 62 Q 72 53 95 51 A 44 44 0 0 1 20.5 81 Q 11.5 78 13 72.5 Q 42 46 74 35 L 46 26.5 L 49 34.5 Q 26 44 9.5 61.5 Z'

export interface OpgLogoMarkProps {
  size?: number
  className?: string
  outlineClassName?: string
  fillClassName?: string
  shineClassName?: string
}

export function OpgLogoMark({
  size = 64,
  className,
  outlineClassName,
  fillClassName,
  shineClassName,
}: OpgLogoMarkProps) {
  const uid = useId().replace(/:/g, '')
  const fillGradId = `opg-amber-fill-${uid}`
  const shineGradId = `opg-shine-grad-${uid}`
  const clipPathId = `opg-swoosh-clip-${uid}`

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 100 100"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={fillGradId}
          x1="12"
          x2="90"
          y1="14"
          y2="88"
        >
          <stop offset="0%" stopColor="#f2b705" />
          <stop offset="55%" stopColor="#f29f04" />
          <stop offset="100%" stopColor="#d48a00" />
        </linearGradient>

        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={shineGradId}
          x1="0"
          x2="42"
          y1="0"
          y2="0"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <clipPath id={clipPathId}>
          <path d={OPG_SWOOSH_PATH} />
        </clipPath>
      </defs>

      {/* 1. Draw-in swoosh outline */}
      <path
        className={outlineClassName}
        d={OPG_SWOOSH_PATH}
        fill="none"
        pathLength={1000}
        stroke="#f29f04"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />

      {/* 2. Solid amber fill */}
      <path
        className={fillClassName}
        d={OPG_SWOOSH_PATH}
        fill={`url(#${fillGradId})`}
      />

      {/* 3. Diagonal sheen sweep clipped cleanly to the swoosh silhouette */}
      <g clipPath={`url(#${clipPathId})`}>
        <g transform="rotate(28 50 50)">
          <rect
            className={shineClassName}
            fill={`url(#${shineGradId})`}
            height="170"
            width="42"
            x="0"
            y="-35"
          />
        </g>
      </g>
    </svg>
  )
}
