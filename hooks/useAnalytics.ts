'use client'

import { useCallback } from 'react'
import * as Sentry from '@sentry/nextjs'
import { usePostHog } from 'posthog-js/react'
import type { AnalyticsEvents } from '@/types'

const ANON_ID_KEY = 'anon_id'

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
  const posthog = usePostHog()

  const track = useCallback(<K extends keyof AnalyticsEvents>(
    event: K,
    properties: AnalyticsEvents[K],
  ) => {
    try {
      posthog?.capture(event as string, {
        ...(properties as Record<string, unknown>),
        anonymous_id: getAnonId(),
      })
    } catch (err) {
      Sentry.captureException(err)
    }
  }, [posthog])

  const identify = useCallback((userId: string) => {
    try {
      posthog?.identify(userId, { anonymous_id: getAnonId() })
    } catch (err) {
      Sentry.captureException(err)
    }
  }, [posthog])

  return { track, identify }
}
