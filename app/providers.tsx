'use client'

import { useEffect } from 'react'
import { ensurePostHog, phOptIn } from '@/lib/posthogClient'

const CONSENT_ACCEPTED_EVENT = 'bikeready:consent-accepted'

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleConsentAccepted = () => phOptIn()
    window.addEventListener(CONSENT_ACCEPTED_EVENT, handleConsentAccepted)

    // Load PostHog off the critical path. Any event fired before this resolves
    // triggers the load itself and is buffered (see lib/posthogClient).
    const w = window as IdleWindow
    let handle: number
    if (w.requestIdleCallback) {
      handle = w.requestIdleCallback(() => void ensurePostHog(), { timeout: 4000 })
    } else {
      handle = window.setTimeout(() => void ensurePostHog(), 2000)
    }

    return () => {
      window.removeEventListener(CONSENT_ACCEPTED_EVENT, handleConsentAccepted)
      if (w.cancelIdleCallback) w.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [])

  return <>{children}</>
}
