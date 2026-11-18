'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { AnimatedContent } from '@/components/ui/animated-content'

export function AdminPageTransition({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const pathname = usePathname()

  return (
    <AnimatedContent
      key={pathname}
      animateOpacity
      className={className}
      delay={0}
      direction="vertical"
      distance={24}
      duration={0.5}
      ease="power3.out"
      initialOpacity={0}
      playOnMount
      scale={0.992}
    >
      {children}
    </AnimatedContent>
  )
}
