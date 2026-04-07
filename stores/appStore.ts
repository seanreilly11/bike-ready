import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { LocalProgress } from '@/types'

interface AppState {
  progress: LocalProgress
  earned: string[]
  user: User | null
  isPremium: boolean

  setUser: (user: User | null) => void
  setPremium: (isPremium: boolean) => void
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
      isPremium: false,

      setUser: (user) => set({ user }),
      setPremium: (isPremium) => set({ isPremium }),
      hydrateProgress: (progress) => set({ progress }),
      resetProgress: () => set({ progress: {}, earned: [] }),
      answerQuestion: (id, isCorrect) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [id]: {
              seen: true,
              correct: state.progress[id]?.correct || isCorrect,
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
      name: 'bikeready_store',
      partialize: (state) => ({ progress: state.progress, earned: state.earned }),
    },
  ),
)
