'use client'

import { useCallback } from 'react'
import type { AnalyticsEvents } from '@/types'

const ANON_ID_KEY = 'bikeready_anon_id'

function getAnonId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}

async function getPosthog() {
  if (typeof window === 'undefined') return null
  const { default: posthog } = await import('posthog-js')
  const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'
  if (!key || posthog.__loaded) return posthog
  posthog.init(key, { api_host: host, capture_pageview: false })
  return posthog
}

export function useAnalytics() {
  const track = useCallback(async <K extends keyof AnalyticsEvents>(
    event: K,
    properties: AnalyticsEvents[K],
  ) => {
    try {
      const ph = await getPosthog()
      if (!ph) return
      ph.capture(event as string, {
        ...(properties as Record<string, unknown>),
        anonymous_id: getAnonId(),
      })
    } catch {
      // Analytics failures are silent
    }
  }, [])

  const identify = useCallback(async (userId: string) => {
    try {
      const ph = await getPosthog()
      if (!ph) return
      ph.identify(userId, { anonymous_id: getAnonId() })
    } catch {
      // Silent
    }
  }, [])

  return { track, identify }
}
