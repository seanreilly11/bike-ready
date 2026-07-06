'use client'

import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { useAnalytics } from '@/hooks/useAnalytics'
import { createClient } from '@/lib/supabase'
import { logError } from '@/lib/logger'

export function useUnlock(onClose?: () => void) {
  const { refreshPremiumStatus } = useAuth()
  const openAuth = useUIStore((s) => s.openAuth)
  const { track } = useAnalytics()

  return useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      onClose?.()
      openAuth('upgrade')
      return
    }

    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      if (!res.ok) {
        throw new Error(`Checkout request failed (${res.status})`)
      }
      const data = (await res.json()) as { alreadyPremium?: boolean; url?: string }
      if (data.alreadyPremium) {
        await refreshPremiumStatus()
        track('gate_converted', {})
        onClose?.()
        return
      }
      if (!data.url) {
        throw new Error('Checkout session has no URL')
      }
      track('checkout_started', {})
      window.location.href = data.url
    } catch (err) {
      // Swallow so the CTA doesn't crash the page; the user can retry.
      logError('useUnlock', err)
    }
  }, [refreshPremiumStatus, openAuth, onClose, track])
}
