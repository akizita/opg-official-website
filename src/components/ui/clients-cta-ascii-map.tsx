import React from 'react'

const LEFT_LAND_POINTS: readonly [number, number][] = [
  [10, 10], [24, 10], [38, 10], [10, 24], [24, 24], [38, 24],
  [38, 38], [52, 38], [66, 38], [80, 38], [94, 38], [108, 38], [122, 38], [136, 38], [150, 38], [164, 38],
  [38, 52], [52, 52], [66, 52], [80, 52], [94, 52], [108, 52], [122, 52], [136, 52], [150, 52], [164, 52],
  [38, 66], [52, 66], [66, 66], [80, 66], [94, 66], [108, 66], [122, 66], [136, 66], [150, 66], [164, 66],
  [94, 80], [108, 80], [122, 80], [136, 80],
  [164, 94], [178, 94], [192, 94], [206, 94], [220, 94], [234, 94], [248, 94],
  [164, 108], [178, 108], [192, 108], [206, 108], [220, 108], [234, 108], [248, 108],
  [164, 122], [178, 122], [192, 122], [206, 122], [220, 122], [234, 122], [248, 122],
  [178, 136], [192, 136], [206, 136], [220, 136], [234, 136], [248, 136],
  [178, 150], [192, 150], [206, 150], [220, 150], [234, 150], [248, 150],
  [192, 164], [206, 164], [220, 164],
]

const RIGHT_LAND_POINTS: readonly [number, number][] = [
  [10, 10], [24, 10], [38, 10], [52, 10], [66, 10], [80, 10], [94, 10], [108, 10], [122, 10], [136, 10], [150, 10], [164, 10], [178, 10], [192, 10], [206, 10],
  [10, 24], [24, 24], [38, 24], [52, 24], [66, 24], [80, 24], [94, 24], [108, 24], [122, 24], [136, 24], [150, 24], [164, 24], [178, 24], [192, 24], [206, 24],
  [10, 38], [24, 38], [38, 38], [52, 38], [66, 38], [80, 38], [94, 38], [108, 38], [122, 38], [136, 38], [150, 38], [164, 38],
  [10, 52], [24, 52], [38, 52], [52, 52], [66, 52], [80, 52], [94, 52], [108, 52], [122, 52], [136, 52], [150, 52], [164, 52],
  [10, 66], [24, 66], [38, 66], [52, 66], [66, 66], [80, 66], [94, 66], [108, 66], [122, 66], [136, 66], [150, 66], [164, 66],
  [10, 80], [24, 80], [38, 80], [94, 80], [108, 80], [122, 80], [136, 80], [150, 80], [164, 80],
  [10, 94], [24, 94], [38, 94], [94, 94], [108, 94], [122, 94], [136, 94], [150, 94], [164, 94],
  [94, 108], [108, 108], [122, 108], [136, 108],
  [136, 150], [150, 150], [164, 150], [178, 150], [192, 150], [206, 150], [220, 150], [234, 150], [248, 150],
  [136, 164], [150, 164], [164, 164], [178, 164], [192, 164], [206, 164], [220, 164], [234, 164], [248, 164],
]

export function ClientsCtaAsciiMapCorners() {
  return (
    <>
      {/* Bottom-Left Dotted ASCII Map Corner: Americas / Pacific Grid */}
      <div
        className="clients-cta-corner clients-cta-corner--left"
        aria-hidden="true"
      >
        <div className="clients-cta-corner__halo" />
        <svg
          viewBox="0 0 260 180"
          className="clients-cta-corner__svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="cta-ascii-grid-left"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="0.75" fill="rgba(245, 179, 1, 0.12)" />
            </pattern>
          </defs>

          {/* Background Matrix Dots */}
          <rect width="260" height="180" fill="url(#cta-ascii-grid-left)" />

          {/* Dotted ASCII Continents */}
          {LEFT_LAND_POINTS.map(([x, y]) => (
            <circle
              key={`left-${x}-${y}`}
              cx={x}
              cy={y}
              r={1.5}
              fill="#f5b301"
              opacity={0.78}
            />
          ))}

          {/* Connection Arc Trails */}
          <path
            d="M 38 52 Q 94 22 150 52"
            stroke="rgba(245, 179, 1, 0.45)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <path
            d="M 38 52 Q 110 88 178 136"
            stroke="rgba(242, 159, 4, 0.32)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
          />

          {/* Active Hub Beacons */}
          <g>
            <circle cx={38} cy={52} r={3} fill="#f5b301" />
            <circle
              cx={38}
              cy={52}
              r={6.5}
              stroke="rgba(245, 179, 1, 0.55)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <circle
              cx={38}
              cy={52}
              r={10.5}
              stroke="rgba(242, 159, 4, 0.22)"
              strokeWidth="0.6"
            />
            <text
              x={38}
              y={38}
              fill="rgba(245, 179, 1, 0.75)"
              fontSize="6.5"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.06em"
            >
              + US-POD
            </text>
          </g>

          <g>
            <circle cx={150} cy={52} r={2.4} fill="#f5b301" opacity={0.9} />
            <circle
              cx={150}
              cy={52}
              r={5.5}
              stroke="rgba(245, 179, 1, 0.4)"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
          </g>

          {/* Corner ASCII Telemetry */}
          <text
            x={10}
            y={174}
            fill="rgba(245, 179, 1, 0.32)"
            fontSize="6.5"
            fontFamily="monospace"
            letterSpacing="0.08em"
          >
            + [37.7°N 122.4°W] PACIFIC.GRID
          </text>
        </svg>
      </div>

      {/* Bottom-Right Dotted ASCII Map Corner: APAC / Australia / EMEA Grid */}
      <div
        className="clients-cta-corner clients-cta-corner--right"
        aria-hidden="true"
      >
        <div className="clients-cta-corner__halo" />
        <svg
          viewBox="0 0 260 180"
          className="clients-cta-corner__svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="cta-ascii-grid-right"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="0.75" fill="rgba(245, 179, 1, 0.12)" />
            </pattern>
          </defs>

          {/* Background Matrix Dots */}
          <rect width="260" height="180" fill="url(#cta-ascii-grid-right)" />

          {/* Dotted ASCII Continents */}
          {RIGHT_LAND_POINTS.map(([x, y]) => (
            <circle
              key={`right-${x}-${y}`}
              cx={x}
              cy={y}
              r={1.5}
              fill="#f5b301"
              opacity={0.78}
            />
          ))}

          {/* Connection Arc Trails */}
          <path
            d="M 136 108 Q 182 122 206 150"
            stroke="rgba(245, 179, 1, 0.5)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <path
            d="M 136 108 Q 72 60 10 38"
            stroke="rgba(242, 159, 4, 0.32)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
          />

          {/* Active Hub Beacons */}
          <g>
            <circle cx={136} cy={108} r={3.2} fill="#f5b301" />
            <circle
              cx={136}
              cy={108}
              r={7}
              stroke="rgba(245, 179, 1, 0.65)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <circle
              cx={136}
              cy={108}
              r={11}
              stroke="rgba(242, 159, 4, 0.28)"
              strokeWidth="0.6"
            />
            <text
              x={136}
              y={94}
              fill="rgba(245, 179, 1, 0.85)"
              fontSize="6.5"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.06em"
            >
              + PH-HQ
            </text>
          </g>

          <g>
            <circle cx={206} cy={150} r={2.8} fill="#f5b301" opacity={0.9} />
            <circle
              cx={206}
              cy={150}
              r={6}
              stroke="rgba(245, 179, 1, 0.45)"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
            <text
              x={206}
              y={138}
              fill="rgba(245, 179, 1, 0.7)"
              fontSize="6.5"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.06em"
            >
              + AU-POD
            </text>
          </g>

          {/* Corner ASCII Telemetry */}
          <text
            x={130}
            y={174}
            fill="rgba(245, 179, 1, 0.32)"
            fontSize="6.5"
            fontFamily="monospace"
            letterSpacing="0.08em"
          >
            + [14.6°N 121.0°E] GLOBAL.PODS
          </text>
        </svg>
      </div>
    </>
  )
}
