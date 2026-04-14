'use client'

import { useState, useEffect } from 'react'
import { assignVariant, getStoredVariant } from '@/lib/abTest'
import { useAnalytics } from '@/hooks/useAnalytics'

/**
 * Assigns and returns a stable A/B variant for the given test.
 *
 * - Same user always gets the same variant (stored in localStorage).
 * - Returns null until the component mounts (SSR-safe).
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
): T | null {
  const { track } = useAnalytics()
  const [variant, setVariant] = useState<T | null>(null)

  useEffect(() => {
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
