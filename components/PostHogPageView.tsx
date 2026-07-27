'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { phCapture } from '@/lib/posthogClient'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    let url = window.location.origin + pathname
    const sp = searchParams.toString()
    if (sp) url += '?' + sp
    phCapture('$pageview', { '$current_url': url })
  }, [pathname, searchParams])

  return null
}
