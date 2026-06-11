'use client'

import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { useAnalytics } from '@/hooks/useAnalytics'
import { createClient } from '@/lib/supabase'

export function useUnlock(onClose?: () => void) {
  const { refreshPremiumStatus } = useAuth()
  const openAuth = useUIStore((s) => s.openAuth)
  const { track } = useAnalytics()

  return useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = (await res.json()) as { alreadyPremium?: boolean; url?: string }
      if (data.alreadyPremium) {
        await refreshPremiumStatus()
        track('gate_converted', {})
        onClose?.()
        return
      }
      track('checkout_started', {})
      window.location.href = data.url!
    } else {
      onClose?.()
      openAuth('upgrade')
    }
  }, [refreshPremiumStatus, openAuth, onClose, track])
}
