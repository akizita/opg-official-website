'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface PulseHeartProps {
  liked?: boolean
  likeCount: number
  onToggle?: (nextLiked: boolean) => void | Promise<void>
  disabled?: boolean
  className?: string
  size?: number
}

// Micro-sparkle particle directions for the React Bits burst effect
const PARTICLES = [
  { x: 0, y: -18, scale: 0.9 },
  { x: 13, y: -13, scale: 1 },
  { x: 18, y: 0, scale: 0.9 },
  { x: 13, y: 13, scale: 1 },
  { x: 0, y: 18, scale: 0.9 },
  { x: -13, y: 13, scale: 1 },
  { x: -18, y: 0, scale: 0.9 },
  { x: -13, y: -13, scale: 1 },
]

/**
 * PulseHeart Micro-Interaction Component
 * Reference: https://reactbits.dev/c/micro/pulse-heart
 *
 * An interactive like button featuring a pulsing heart contraction-burst animation,
 * radial sparkle particles, and an animated count rollover.
 */
export function PulseHeart({
  liked = false,
  likeCount = 0,
  onToggle,
  disabled = false,
  className = '',
  size = 20,
}: PulseHeartProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (disabled) return

    const nextLiked = !liked
    if (nextLiked) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 800)
    }

    if (onToggle) {
      await onToggle(nextLiked)
    }
  }

  return (
    <button
      aria-label={`${liked ? 'Unlike' : 'Like'} this article, ${likeCount} likes`}
      aria-pressed={liked}
      className={`pulse-heart-btn ${liked ? 'pulse-heart-btn--active' : ''} ${className}`.trim()}
      disabled={disabled}
      onClick={handleClick}
      type="button"
    >
      <div className="pulse-heart-wrapper" style={{ width: size, height: size }}>
        {/* Animated Shockwave Pulse Ring (Triggered on Like) */}
        <AnimatePresence>
          {isAnimating && (
            <motion.span
              animate={{ scale: [0.6, 2.2], opacity: [0.85, 0] }}
              className="pulse-heart-ring"
              exit={{ opacity: 0 }}
              initial={{ scale: 0.6, opacity: 0.85 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Radial Micro-Sparkle Particles */}
        <AnimatePresence>
          {isAnimating &&
            PARTICLES.map((particle, idx) => (
              <motion.span
                animate={{
                  x: particle.x,
                  y: particle.y,
                  scale: [1, particle.scale, 0],
                  opacity: [1, 0.9, 0],
                }}
                className="pulse-heart-sparkle"
                exit={{ opacity: 0 }}
                initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
                key={idx}
                transition={{ duration: 0.52, ease: [0.2, 0.8, 0.2, 1], delay: idx * 0.015 }}
              />
            ))}
        </AnimatePresence>

        {/* Pulsing Heart Glyph */}
        <motion.svg
          animate={
            isAnimating
              ? {
                  scale: [1, 0.65, 1.45, 0.92, 1.08, 1],
                  rotate: [0, -8, 8, -4, 2, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          className="pulse-heart-icon"
          fill={liked ? '#f43f5e' : 'none'}
          stroke={liked ? '#f43f5e' : 'currentColor'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={liked ? 0 : 2}
          style={{ width: size, height: size }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          viewBox="0 0 24 24"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.82 }}
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
        </motion.svg>
      </div>

      {/* Animated Numerical Counter */}
      <motion.span
        animate={{ scale: isAnimating ? [1, 1.22, 1] : 1 }}
        className="pulse-heart-count"
        transition={{ duration: 0.35 }}
      >
        <AnimatePresence mode="popLayout">
          <motion.strong
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            initial={{ y: 6, opacity: 0 }}
            key={likeCount}
            transition={{ duration: 0.2 }}
          >
            {likeCount.toLocaleString()}
          </motion.strong>
        </AnimatePresence>
      </motion.span>
    </button>
  )
}
