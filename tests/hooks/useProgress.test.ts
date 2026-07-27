import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProgress } from '@/hooks/useProgress'
import { useAppStore } from '@/stores/appStore'
import { activeQuestions } from '@/hooks/useQuestions'
import { FREE_PER_MODULE } from '@/types'

function resetStore() {
  useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false })
}

const priorityQuestions = activeQuestions.filter((q) => q.module === 'priority')
const fundamentalsQuestions = activeQuestions.filter((q) => q.module === 'fundamentals')

function markSeen(questionIds: string[], correct = false) {
  for (const id of questionIds) {
    useAppStore.getState().answerQuestion(id, correct)
  }
}

describe('useProgress', () => {
  beforeEach(resetStore)

  describe('getDotState', () => {
    it('returns "active" for the current question id', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.getDotState('q1', 'q1')).toBe('active')
    })

    it('returns "unseen" for a question not in progress', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.getDotState('q1', 'other')).toBe('unseen')
    })

    it('returns "correct" for a correctly answered question', () => {
      useAppStore.getState().answerQuestion('q1', true)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getDotState('q1', 'other')).toBe('correct')
    })

    it('returns "seen" for a wrongly answered question', () => {
      useAppStore.getState().answerQuestion('q1', false)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getDotState('q1', 'other')).toBe('seen')
    })
  })

  describe('getModuleSeen', () => {
    it('returns 0 when no questions seen', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleSeen('priority')).toBe(0)
    })

    it('returns count of seen questions in module', () => {
      markSeen(priorityQuestions.slice(0, 2).map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleSeen('priority')).toBe(2)
    })

    it('does not count questions from other modules', () => {
      markSeen(fundamentalsQuestions.map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleSeen('priority')).toBe(0)
    })
  })

  describe('getTotalSeen', () => {
    it('returns 0 initially', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.getTotalSeen()).toBe(0)
    })

    it('counts across all modules', () => {
      markSeen([priorityQuestions[0].id, fundamentalsQuestions[0].id])
      const { result } = renderHook(() => useProgress())
      expect(result.current.getTotalSeen()).toBe(2)
    })
  })

  describe('getModuleStatus', () => {
    it('returns "not_started" when no questions seen', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleStatus('priority', false)).toBe('not_started')
    })

    it('returns "in_progress" when some but not all questions seen', () => {
      markSeen(priorityQuestions.slice(0, 1).map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleStatus('priority', false)).toBe('in_progress')
    })

    it('returns "complete" when all questions in module are seen', () => {
      markSeen(priorityQuestions.map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleStatus('priority', false)).toBe('complete')
    })

    it(`returns "preview_done" for free user at FREE_PER_MODULE (${FREE_PER_MODULE}) seen in gated module`, () => {
      markSeen(priorityQuestions.slice(0, FREE_PER_MODULE).map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleStatus('priority', false)).toBe('preview_done')
    })

    it('returns "in_progress" (not preview_done) when FREE_PER_MODULE - 1 seen', () => {
      markSeen(priorityQuestions.slice(0, FREE_PER_MODULE - 1).map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleStatus('priority', false)).toBe('in_progress')
    })

    it('returns "in_progress" for premium user even at FREE_PER_MODULE seen', () => {
      markSeen(priorityQuestions.slice(0, FREE_PER_MODULE).map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleStatus('priority', true)).toBe('in_progress')
    })

    it('returns "in_progress" (not "preview_done") for fundamentals (alwaysFree)', () => {
      markSeen(fundamentalsQuestions.slice(0, FREE_PER_MODULE).map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getModuleStatus('fundamentals', false)).toBe('in_progress')
    })
  })

  describe('getReviewQueue', () => {
    it('returns empty array when nothing answered', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.getReviewQueue()).toHaveLength(0)
    })

    it('includes incorrectly answered questions', () => {
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, false)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getReviewQueue().map((q) => q.id)).toContain(priorityQuestions[0].id)
    })

    it('excludes correctly answered questions', () => {
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, true)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getReviewQueue().map((q) => q.id)).not.toContain(priorityQuestions[0].id)
    })

    it('re-adds a previously-correct question when answered wrong again', () => {
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, true)
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, false)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getReviewQueue().map((q) => q.id)).toContain(priorityQuestions[0].id)
    })

    it('removes a question once the latest answer is correct', () => {
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, false)
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, true)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getReviewQueue().map((q) => q.id)).not.toContain(priorityQuestions[0].id)
    })
  })

  describe('isPreviewComplete', () => {
    it('returns false when nothing seen', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.isPreviewComplete(false)).toBe(false)
    })

    it('returns false for premium user even when all gated modules at FREE_PER_MODULE', () => {
      const gatedModuleIds = ['priority', 'signs', 'roadusers', 'infrastructure', 'legal', 'vocabulary'] as const
      for (const moduleId of gatedModuleIds) {
        const qs = activeQuestions.filter((q) => q.module === moduleId)
        markSeen(qs.slice(0, FREE_PER_MODULE).map((q) => q.id))
      }
      const { result } = renderHook(() => useProgress())
      expect(result.current.isPreviewComplete(true)).toBe(false)
    })

    it('returns true for free user when all gated modules have FREE_PER_MODULE seen', () => {
      const gatedModuleIds = ['priority', 'signs', 'roadusers', 'infrastructure', 'legal', 'vocabulary'] as const
      for (const moduleId of gatedModuleIds) {
        const qs = activeQuestions.filter((q) => q.module === moduleId)
        markSeen(qs.slice(0, FREE_PER_MODULE).map((q) => q.id))
      }
      const { result } = renderHook(() => useProgress())
      expect(result.current.isPreviewComplete(false)).toBe(true)
    })

    it('returns false when only 5 of 6 gated modules have FREE_PER_MODULE seen', () => {
      const gatedModuleIds = ['priority', 'signs', 'roadusers', 'infrastructure', 'legal'] as const
      for (const moduleId of gatedModuleIds) {
        const qs = activeQuestions.filter((q) => q.module === moduleId)
        markSeen(qs.slice(0, FREE_PER_MODULE).map((q) => q.id))
      }
      const { result } = renderHook(() => useProgress())
      expect(result.current.isPreviewComplete(false)).toBe(false)
    })

    it('fundamentals questions do not count toward isPreviewComplete', () => {
      markSeen(fundamentalsQuestions.map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.isPreviewComplete(false)).toBe(false)
    })
  })

  describe('getCurrentQuestionIndex', () => {
    it('returns 0 when no questions seen (start at beginning)', () => {
      const { result } = renderHook(() => useProgress())
      expect(result.current.getCurrentQuestionIndex('priority')).toBe(0)
    })

    it('returns index of first unseen question', () => {
      markSeen(priorityQuestions.slice(0, 2).map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getCurrentQuestionIndex('priority')).toBe(2)
    })

    it('returns 0 when all questions seen (restart from beginning)', () => {
      markSeen(priorityQuestions.map((q) => q.id))
      const { result } = renderHook(() => useProgress())
      expect(result.current.getCurrentQuestionIndex('priority')).toBe(0)
    })
  })
})
