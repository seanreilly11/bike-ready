'use client'

import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

interface AuthState {
  user:        User | null
  isPremium:   boolean
  isLoading:   boolean
}

interface UseAuthReturn extends AuthState {
  sendMagicLink: (email: string) => Promise<void>
  signOut:       () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({
    user:      null,
    isPremium: false,
    isLoading: true,
  })

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single()
    return data?.is_premium ?? false
  }, [supabase])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const user = session?.user ?? null
      const isPremium = user ? await fetchProfile(user.id) : false
      setState({ user, isPremium, isLoading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        const user = session?.user ?? null
        const isPremium = user ? await fetchProfile(user.id) : false
        setState({ user, isPremium, isLoading: false })
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, supabase.auth])

  const sendMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }, [supabase.auth])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase.auth])

  return { ...state, sendMagicLink, signOut }
}
