import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuestions, activeQuestions } from '@/hooks/useQuestions'
import modules from '@/data/modules'

describe('activeQuestions', () => {
  it('contains only questions with status "active"', () => {
    const nonActive = activeQuestions.filter((q) => q.status !== 'active')
    expect(nonActive).toHaveLength(0)
  })

  it('contains at least one question', () => {
    expect(activeQuestions.length).toBeGreaterThan(0)
  })
})

describe('useQuestions', () => {
  describe('questionsByModule', () => {
    it('returns only questions belonging to the requested module', () => {
      const { result } = renderHook(() => useQuestions())
      const qs = result.current.questionsByModule('priority')
      expect(qs.every((q) => q.module === 'priority')).toBe(true)
    })

    it('returns a non-empty array for each defined module', () => {
      const { result } = renderHook(() => useQuestions())
      for (const mod of modules) {
        const qs = result.current.questionsByModule(mod.id as any)
        expect(qs.length, `${mod.id} should have active questions`).toBeGreaterThan(0)
      }
    })
  })

  describe('buildTestSet', () => {
    it('returns questions from all modules', () => {
      const { result } = renderHook(() => useQuestions())
      const testSet = result.current.buildTestSet()
      const moduleIds = new Set(testSet.map((q) => q.module))
      expect(moduleIds.size).toBe(modules.length)
    })

    it('contains at most 3 questions per module', () => {
      const { result } = renderHook(() => useQuestions())
      const testSet = result.current.buildTestSet()
      for (const mod of modules) {
        const count = testSet.filter((q) => q.module === mod.id).length
        expect(count, `${mod.id} should have at most 3 in test set`).toBeLessThanOrEqual(3)
      }
    })

    it('is deterministic — same result on repeated calls', () => {
      const { result } = renderHook(() => useQuestions())
      const a = result.current.buildTestSet().map((q) => q.id)
      const b = result.current.buildTestSet().map((q) => q.id)
      expect(a).toEqual(b)
    })
  })
})
