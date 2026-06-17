'use client'

import { useCallback } from 'react'
import * as Sentry from '@sentry/nextjs'
import { phCapture, phIdentify } from '@/lib/posthogClient'
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

export function useAnalytics() {
  const track = useCallback(<K extends keyof AnalyticsEvents>(
    event: K,
    properties: AnalyticsEvents[K],
  ) => {
    try {
      phCapture(event as string, {
        ...(properties as Record<string, unknown>),
        anonymous_id: getAnonId(),
      })
    } catch (err) {
      Sentry.captureException(err)
    }
  }, [])

  const identify = useCallback((userId: string) => {
    try {
      phIdentify(userId, { anonymous_id: getAnonId() })
    } catch (err) {
      Sentry.captureException(err)
    }
  }, [])

  return { track, identify }
}
