'use client'

import { useState, useEffect } from 'react'
import { assignVariant, getStoredVariant, setStoredVariant } from '@/lib/abTest'
import { useAnalytics } from '@/hooks/useAnalytics'

/**
 * Assigns and returns a stable A/B variant for the given test.
 *
 * - Pass `initialVariant` when the variant was decided server-side (cookie via
 *   middleware). The hook then seeds state with it so the first client render
 *   matches the SSR HTML - no control→variant flash - and only mirrors the value
 *   into localStorage for analytics tagging. No re-render/swap occurs.
 * - Without `initialVariant` it falls back to client-only assignment: returns
 *   null until mounted, then hashes anon_id to pick a bucket (legacy path).
 * - Fires an `ab_variant_assigned` PostHog event on first assignment only.
 *
 * @example
 * const variant = useABTest('hero_cta', ['control', 'short_copy'] as const)
 * if (!variant) return null  // not yet mounted
 * return variant === 'short_copy' ? <ShortHero /> : <OriginalHero />
 */
export function useABTest<T extends string>(
  testName: string,
  variants: readonly [T, ...T[]],
  initialVariant?: T,
): T | null {
  const { track } = useAnalytics()
  const [variant, setVariant] = useState<T | null>(initialVariant ?? null)

  useEffect(() => {
    // Server-decided path: the cookie is authoritative, so keep the rendered
    // variant fixed and just sync localStorage (no setVariant → no swap).
    if (initialVariant !== undefined) {
      const isFirstAssignment = getStoredVariant(testName) === null
      if (getStoredVariant(testName) !== initialVariant) {
        setStoredVariant(testName, initialVariant)
      }
      if (isFirstAssignment) {
        track('ab_variant_assigned', { test: testName, variant: initialVariant })
      }
      return
    }

    // Legacy client-only path.
    const isFirstAssignment = getStoredVariant(testName) === null
    const assigned = assignVariant(testName, variants) as T
    setVariant(assigned)
    if (isFirstAssignment) {
      track('ab_variant_assigned', { test: testName, variant: assigned })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testName])

  return variant
}
