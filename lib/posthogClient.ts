import type { PostHog } from 'posthog-js'

// Lazy client-side PostHog loader.
//
// posthog-js (and posthog-js/react) is ~78KB and was previously in the initial
// JS bundle, gating hydration on slow connections. This module keeps it OUT of
// the initial bundle: the core is pulled in via dynamic import() only when the
// first event fires (or on idle), and events that occur before it resolves are
// buffered and flushed on load — so no analytics are lost.
//
// Only `import type` references posthog-js here, which is erased at build time.

// Must match the key written by components/layout/CookieConsentBanner.
const CONSENT_KEY = 'cookie_consent'

let instance: PostHog | null = null
let loading: Promise<PostHog | null> | null = null
let disabled = false
const queue: Array<(ph: PostHog) => void> = []

/** Begins loading + initialising PostHog. Idempotent. */
export function ensurePostHog(): Promise<PostHog | null> {
  if (instance) return Promise.resolve(instance)
  if (loading) return loading
  if (typeof window === 'undefined') return Promise.resolve(null)

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!key || !apiHost) {
    console.warn(
      'PostHog is not configured properly. Please check your environment variables.',
    )
    disabled = true
    queue.length = 0
    loading = Promise.resolve(null)
    return loading
  }

  loading = import('posthog-js').then(({ default: posthog }) => {
    const hasConsent = localStorage.getItem(CONSENT_KEY) === 'accepted'
    posthog.init(key, {
      api_host: apiHost,
      ui_host: 'https://eu.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      opt_out_capturing_by_default: !hasConsent,
      persistence: 'localStorage',
      disable_surveys: true,
    })
    instance = posthog
    while (queue.length) queue.shift()!(posthog)
    return posthog
  })
  return loading
}

/** Runs `fn` against the live instance, loading + buffering as needed. */
function withPostHog(fn: (ph: PostHog) => void): void {
  if (instance) {
    fn(instance)
    return
  }
  if (disabled) return
  queue.push(fn)
  void ensurePostHog()
}

export function phCapture(event: string, properties: Record<string, unknown>): void {
  withPostHog((ph) => ph.capture(event, properties))
}

export function phIdentify(userId: string, properties: Record<string, unknown>): void {
  withPostHog((ph) => ph.identify(userId, properties))
}

export function phOptIn(): void {
  withPostHog((ph) => ph.opt_in_capturing())
}
