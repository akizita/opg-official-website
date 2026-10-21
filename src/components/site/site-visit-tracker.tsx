'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

const VISIT_RECORDED_KEY = 'opg.site.visit.recorded'

export function SiteVisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth') ||
      window.sessionStorage.getItem(VISIT_RECORDED_KEY)
    ) {
      return
    }

    window.sessionStorage.setItem(VISIT_RECORDED_KEY, 'true')
    const supabase = createClient()

    void supabase.rpc('record_site_visit').then(({ error }) => {
      if (error) window.sessionStorage.removeItem(VISIT_RECORDED_KEY)
    })
  }, [pathname])

  return null
}
