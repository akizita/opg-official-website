import React from 'react'

export type ClientLogoType =
  | 'northstar'
  | 'meridian'
  | 'harborline'
  | 'atlas'
  | 'veridian'

export interface ClientLogoProps {
  type: ClientLogoType
  className?: string
}

export function ClientLogo({ type, className = '' }: ClientLogoProps) {
  switch (type) {
    case 'northstar':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-nl-primary"
              x1="4"
              y1="4"
              x2="44"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f2b705" />
              <stop offset="1" stopColor="#f29f04" />
            </linearGradient>
            <linearGradient
              id="client-logo-nl-facet"
              x1="12"
              y1="12"
              x2="36"
              y2="36"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fde047" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M24 3L28.8 19.2L45 24L28.8 28.8L24 45L19.2 28.8L3 24L19.2 19.2L24 3Z"
            fill="url(#client-logo-nl-primary)"
          />
          <path
            d="M24 11L27.2 20.8L37 24L27.2 27.2L24 37L20.8 27.2L11 24L20.8 20.8L24 11Z"
            fill="url(#client-logo-nl-facet)"
          />
          <circle cx="24" cy="24" r="2.5" fill="#0d0d0d" />
        </svg>
      )
    case 'meridian':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-mh-border"
              x1="6"
              y1="6"
              x2="42"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
            <linearGradient
              id="client-logo-mh-pulse"
              x1="10"
              y1="24"
              x2="38"
              y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#059669" />
              <stop offset="1" stopColor="#f2b705" />
            </linearGradient>
          </defs>
          <rect
            x="6"
            y="6"
            width="36"
            height="36"
            rx="12"
            stroke="url(#client-logo-mh-border)"
            strokeWidth="3"
          />
          <path
            d="M13 24H18L21.5 15L26.5 33L30 24H35"
            stroke="url(#client-logo-mh-pulse)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26.5" cy="24" r="2.5" fill="#f29f04" />
        </svg>
      )
    case 'harborline':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-hf-shield"
              x1="8"
              y1="4"
              x2="40"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4f46e5" />
              <stop offset="1" stopColor="#312e81" />
            </linearGradient>
            <linearGradient
              id="client-logo-hf-pillars"
              x1="18"
              y1="16"
              x2="30"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f2b705" />
              <stop offset="1" stopColor="#f29f04" />
            </linearGradient>
          </defs>
          <path
            d="M24 5L41 14V28C41 36.5 33.8 42.5 24 45C14.2 42.5 7 36.5 7 28V14L24 5Z"
            stroke="url(#client-logo-hf-shield)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M19 18V30M24 15V33M29 18V30"
            stroke="url(#client-logo-hf-pillars)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'atlas':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-ac-prism"
              x1="6"
              y1="6"
              x2="42"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
            <linearGradient
              id="client-logo-ac-fill"
              x1="6"
              y1="6"
              x2="42"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#fef3c7" stopOpacity="0.4" />
              <stop offset="1" stopColor="#f59e0b" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <polygon
            points="24,5 42,15.5 42,32.5 24,43 6,32.5 6,15.5"
            fill="url(#client-logo-ac-fill)"
            stroke="url(#client-logo-ac-prism)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M24 5V43M6 15.5L42 32.5M6 32.5L42 15.5"
            stroke="url(#client-logo-ac-prism)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="24" r="3.5" fill="#f29f04" />
        </svg>
      )
    case 'veridian':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-vo-grad"
              x1="8"
              y1="8"
              x2="40"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0ea5e9" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path
            d="M24 7L39 19.5L24 32L9 19.5L24 7Z"
            stroke="url(#client-logo-vo-grad)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M13 25L24 35L35 25"
            stroke="#f29f04"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 32L24 39L30.5 32"
            stroke="#f2b705"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="19.5" r="3" fill="#0d0d0d" />
        </svg>
      )
  }
}
