'use client'

import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/hooks/useAuthModal'
import { createClient } from '@/lib/supabase'

export function useUnlock(onClose?: () => void) {
  const { refreshPremiumStatus } = useAuth()
  const openAuth = useAuthModal()

  return useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = (await res.json()) as { alreadyPremium?: boolean; url?: string }
      if (data.alreadyPremium) {
        await refreshPremiumStatus()
        onClose?.()
        return
      }
      window.location.href = data.url!
    } else {
      onClose?.()
      openAuth({ reason: 'upgrade' })
    }
  }, [refreshPremiumStatus, openAuth, onClose])
}
