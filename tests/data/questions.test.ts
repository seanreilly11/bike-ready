import { describe, expect, it } from 'vitest'
import questionsData from '@/data/questions.json'
import modules from '@/data/modules'
import type { Question } from '@/types'

const allQuestions = questionsData as Question[]
const activeQuestions = allQuestions.filter((q) => q.status === 'active')

describe('questions.json data integrity', () => {
  describe('IDs', () => {
    it('every question has a non-empty id', () => {
      for (const q of allQuestions) {
        expect(q.id, `question missing id`).toBeTruthy()
      }
    })

    it('all ids are unique', () => {
      const ids = allQuestions.map((q) => q.id)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    })
  })

  describe('required fields', () => {
    it('every question has a prompt', () => {
      for (const q of allQuestions) {
        expect(q.prompt, `${q.id} missing prompt`).toBeTruthy()
      }
    })

    it('every question has at least 2 options', () => {
      for (const q of allQuestions) {
        expect(q.options.length, `${q.id} needs at least 2 options`).toBeGreaterThanOrEqual(2)
      }
    })

    it('every question has a feedback.body', () => {
      for (const q of allQuestions) {
        expect(q.feedback.body, `${q.id} missing feedback.body`).toBeTruthy()
      }
    })

    it('every question has a feedback.rule', () => {
      for (const q of allQuestions) {
        expect(q.feedback.rule, `${q.id} missing feedback.rule`).toBeTruthy()
      }
    })

    it('every question has a feedback.tip', () => {
      for (const q of allQuestions) {
        expect(q.feedback.tip, `${q.id} missing feedback.tip`).toBeTruthy()
      }
    })

    it('no question has a feedback.title field', () => {
      for (const q of allQuestions) {
        expect((q.feedback as unknown as Record<string, unknown>).title, `${q.id} still has deprecated feedback.title`).toBeUndefined()
      }
    })

    it('every question has a skill', () => {
      for (const q of allQuestions) {
        expect(q.skill, `${q.id} missing skill`).toBeTruthy()
      }
    })

    it('every question has a valid type', () => {
      const validTypes = ['multiple_choice', 'true_false', 'scenario_decision']
      for (const q of allQuestions) {
        expect(validTypes, `${q.id} has invalid type "${q.type}"`).toContain(q.type)
      }
    })
  })

  describe('correct option reference', () => {
    it('correct field matches an option id', () => {
      for (const q of allQuestions) {
        const optionIds = q.options.map((o) => o.id)
        expect(optionIds, `${q.id} correct="${q.correct}" not in options`).toContain(q.correct)
      }
    })
  })

  describe('status', () => {
    it('all questions have a valid status', () => {
      const validStatuses = ['draft', 'active', 'archived']
      for (const q of allQuestions) {
        expect(validStatuses, `${q.id} has invalid status "${q.status}"`).toContain(q.status)
      }
    })

    it('at least one question is active', () => {
      expect(activeQuestions.length).toBeGreaterThan(0)
    })
  })

  describe('module membership', () => {
    // Derived from modules data so this test stays correct if a module is added/renamed
    const validModules = modules.map((m) => m.id)

    it('all questions reference a valid module', () => {
      for (const q of allQuestions) {
        expect(validModules, `${q.id} has unknown module "${q.module}"`).toContain(q.module)
      }
    })
  })

  describe('difficulty', () => {
    const validDifficulties = ['easy', 'medium', 'hard']

    it('all questions have a valid difficulty', () => {
      for (const q of allQuestions) {
        expect(validDifficulties, `${q.id} invalid difficulty "${q.difficulty}"`).toContain(q.difficulty)
      }
    })
  })

  describe('option ids', () => {
    it('all option ids within a question are unique', () => {
      for (const q of allQuestions) {
        const ids = q.options.map((o) => o.id)
        const unique = new Set(ids)
        expect(unique.size, `${q.id} has duplicate option ids`).toBe(ids.length)
      }
    })
  })

  describe('true/false questions', () => {
    it('true_false questions always have True=a and False=b', () => {
      const tfQuestions = allQuestions.filter((q) => q.type === 'true_false')
      for (const q of tfQuestions) {
        const optA = q.options.find((o) => o.id === 'a')
        const optB = q.options.find((o) => o.id === 'b')
        expect(optA?.label, `${q.id} option a should be "True"`).toBe('True')
        expect(optB?.label, `${q.id} option b should be "False"`).toBe('False')
      }
    })
  })
})
