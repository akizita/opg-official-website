'use client'

import React, { useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

export interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string
  spotlightColor?: string
  tabIndex?: number
  trackPointerWhileFocused?: boolean
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(242, 159, 4, 0.20)',
  tabIndex = 0,
  trackPointerWhileFocused = false,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState<number>(0)

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || (isFocused && !trackPointerWhileFocused)) return

    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setOpacity(1)
  }

  const handleFocus: React.FocusEventHandler<HTMLDivElement> = (e) => {
    setIsFocused(true)
    if (trackPointerWhileFocused && divRef.current) {
      const card = divRef.current.getBoundingClientRect()
      const target = e.target.getBoundingClientRect()
      setPosition({
        x: target.left + target.width / 2 - card.left,
        y: target.top + target.height / 2 - card.top,
      })
    }
    setOpacity(1)
  }

  const handleBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
    if (e.relatedTarget && divRef.current?.contains(e.relatedTarget as Node))
      return
    setIsFocused(false)
    setOpacity(0)
  }

  const handleMouseEnter = () => {
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  return (
    <div
      className={`rb-spotlight-card ${className}`.trim()}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={divRef}
      tabIndex={tabIndex}
    >
      <div
        aria-hidden="true"
        className="rb-spotlight-card__spotlight"
        style={{
          opacity,
          background: `radial-gradient(circle 320px at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="rb-spotlight-card__content">{children}</div>
    </div>
  )
}

export default SpotlightCard
