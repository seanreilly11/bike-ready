import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { LocalProgress } from '@/types'
import { PREMIUM_ENABLED } from '@/lib/config'
import { mergeProgress } from '@/lib/utils/progress'

interface AppState {
  progress: LocalProgress
  earned: string[]
  user: User | null
  isPremium: boolean
  // Owned by useAuthBootstrap; every screen gates its first render on this.
  authLoading: boolean

  setUser: (user: User | null) => void
  setPremium: (isPremium: boolean) => void
  setAuthLoading: (authLoading: boolean) => void
  hydrateProgress: (progress: LocalProgress) => void
  resetProgress: () => void
  answerQuestion: (id: string, isCorrect: boolean) => void
  earnBadge: (badgeId: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      progress: {},
      earned: [],
      user: null,
      isPremium: !PREMIUM_ENABLED ? true : false,
      authLoading: true,

      setUser: (user) => set({ user }),
      setAuthLoading: (authLoading) => set({ authLoading }),
      setPremium: (isPremium) => {
        if (!PREMIUM_ENABLED) return
        set({ isPremium })
      },
      hydrateProgress: (progress) =>
        set((state) => ({ progress: mergeProgress(state.progress, progress) })),
      resetProgress: () => set({ progress: {}, earned: [] }),
      answerQuestion: (id, isCorrect) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [id]: {
              seen: true,
              // Last answer wins: missing a previously-correct question puts
              // it back in the review queue.
              correct: isCorrect,
            },
          },
        })),
      earnBadge: (badgeId) =>
        set((state) => ({
          earned: state.earned.includes(badgeId)
            ? state.earned
            : [...state.earned, badgeId],
        })),
    }),
    {
      name: 'store',
      partialize: (state) => ({ progress: state.progress, earned: state.earned }),
    },
  ),
)
