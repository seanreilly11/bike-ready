import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBadges } from '@/hooks/useBadges'
import { useAppStore } from '@/stores/appStore'
import { useUIStore } from '@/stores/uiStore'
import { activeQuestions } from '@/hooks/useQuestions'

function resetStores() {
  useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false })
  useUIStore.setState({ newBadgeId: null, showAuth: false, authReason: null, showGate: false, showUpgradeToast: false, onboardingDone: false, showReturnBanner: true })
}

function completeModule(moduleId: string) {
  const qs = activeQuestions.filter((q) => q.module === moduleId)
  for (const q of qs) {
    useAppStore.getState().answerQuestion(q.id, true)
  }
}

describe('useBadges', () => {
  beforeEach(resetStores)

  describe('earnedIds', () => {
    it('returns empty Set initially', () => {
      const { result } = renderHook(() => useBadges())
      expect(result.current.earnedIds.size).toBe(0)
    })

    it('reflects badges earned via store', () => {
      useAppStore.getState().earnBadge('badge_priority')
      const { result } = renderHook(() => useBadges())
      expect(result.current.earnedIds.has('badge_priority')).toBe(true)
    })
  })

  describe('newBadge', () => {
    it('returns null when no badge pending', () => {
      const { result } = renderHook(() => useBadges())
      expect(result.current.newBadge).toBeNull()
    })

    it('returns badge definition when newBadgeId is set', () => {
      useUIStore.getState().showBadge('badge_priority')
      const { result } = renderHook(() => useBadges())
      expect(result.current.newBadge?.id).toBe('badge_priority')
      expect(result.current.newBadge?.name).toBe('Priority Pro')
    })
  })

  describe('checkModuleBadge', () => {
    it('awards badge when all module questions are seen', async () => {
      completeModule('priority')
      const { result } = renderHook(() => useBadges())
      await act(async () => {
        await result.current.checkModuleBadge('priority')
      })
      expect(useAppStore.getState().earned).toContain('badge_priority')
    })

    it('shows badge in UI store after awarding', async () => {
      completeModule('priority')
      const { result } = renderHook(() => useBadges())
      await act(async () => {
        await result.current.checkModuleBadge('priority')
      })
      expect(useUIStore.getState().newBadgeId).toBe('badge_priority')
    })

    it('does not award badge when module is incomplete', async () => {
      const qs = activeQuestions.filter((q) => q.module === 'priority')
      for (const q of qs.slice(0, -1)) {
        useAppStore.getState().answerQuestion(q.id, true)
      }
      const { result } = renderHook(() => useBadges())
      await act(async () => {
        await result.current.checkModuleBadge('priority')
      })
      expect(useAppStore.getState().earned).not.toContain('badge_priority')
    })

    it('is idempotent — calling twice does not duplicate badge', async () => {
      completeModule('priority')
      const { result } = renderHook(() => useBadges())
      await act(async () => {
        await result.current.checkModuleBadge('priority')
        await result.current.checkModuleBadge('priority')
      })
      const earned = useAppStore.getState().earned
      expect(earned.filter((id) => id === 'badge_priority')).toHaveLength(1)
    })
  })

  describe('dismissNewBadge', () => {
    it('clears newBadgeId in UI store', () => {
      useUIStore.getState().showBadge('badge_priority')
      const { result } = renderHook(() => useBadges())
      act(() => result.current.dismissNewBadge())
      expect(useUIStore.getState().newBadgeId).toBeNull()
    })
  })
})
