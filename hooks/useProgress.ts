'use client'

import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type {
  LocalProgress,
  ModuleId,
  Question,
  DotState,
  ModuleStatus,
} from '@/types'
import { FREE_PER_MODULE } from '@/types'
import { createClient } from '@/lib/supabase'
import questions from '@/data/questions.json'

const STORAGE_KEY = 'bikeready_progress'
const activeQuestions = (questions as Question[]).filter(q => q.status === 'active')

function loadLocalProgress(): LocalProgress {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LocalProgress) : {}
  } catch {
    return {}
  }
}

function saveLocalProgress(progress: LocalProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function useProgress(user: User | null) {
  const supabase = createClient()
  const [progress, setProgress] = useState<LocalProgress>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load on mount: Supabase if authenticated, localStorage otherwise
  useEffect(() => {
    async function load() {
      if (user) {
        const { data } = await supabase
          .from('question_progress')
          .select('question_id, seen, correct')
          .eq('user_id', user.id)

        if (data) {
          const merged: LocalProgress = {}
          for (const row of data) {
            merged[row.question_id] = { seen: row.seen, correct: row.correct }
          }
          setProgress(merged)
        }
      } else {
        setProgress(loadLocalProgress())
      }
      setIsLoaded(true)
    }
    load()
  }, [user, supabase])

  // Record an answer: optimistic update + background write
  const recordAnswer = useCallback(async (questionId: string, correct: boolean) => {
    setProgress(prev => {
      const existing = prev[questionId]
      const next: LocalProgress = {
        ...prev,
        [questionId]: {
          seen:    true,
          correct: existing?.correct || correct,
        },
      }
      if (!user) saveLocalProgress(next)
      return next
    })

    if (user) {
      await supabase.rpc('upsert_question_progress', {
        p_user_id:     user.id,
        p_question_id: questionId,
        p_correct:     correct,
      })
    }
  }, [user, supabase])

  // Migrate localStorage progress to Supabase after sign-up
  const migrateLocalProgress = useCallback(async (userId: string) => {
    const local = loadLocalProgress()
    const entries = Object.entries(local)
    if (entries.length === 0) return

    await Promise.all(
      entries.map(([questionId, { correct }]) =>
        supabase.rpc('upsert_question_progress', {
          p_user_id:     userId,
          p_question_id: questionId,
          p_correct:     correct,
        })
      )
    )

    localStorage.removeItem(STORAGE_KEY)
  }, [supabase])

  // ---------------------------------------------------------------------------
  // Derived helpers
  // ---------------------------------------------------------------------------

  function getDotState(questionId: string, currentId: string): DotState {
    if (questionId === currentId) return 'active'
    const p = progress[questionId]
    if (!p) return 'unseen'
    if (p.correct) return 'correct'
    return 'seen'
  }

  function getModuleStatus(moduleId: ModuleId, isPremium: boolean): ModuleStatus {
    const moduleQuestions = activeQuestions.filter(q => q.module === moduleId)
    const seen = moduleQuestions.filter(q => progress[q.id]?.seen)

    if (seen.length === 0) return 'not_started'
    if (seen.length === moduleQuestions.length) return 'complete'
    if (!isPremium && seen.length >= FREE_PER_MODULE) return 'preview_done'
    return 'in_progress'
  }

  function getReviewQueue(): Question[] {
    return activeQuestions.filter(q => {
      const p = progress[q.id]
      return p?.seen && !p?.correct
    })
  }

  function getModuleSeen(moduleId: ModuleId): number {
    return activeQuestions.filter(q => q.module === moduleId && progress[q.id]?.seen).length
  }

  function getTotalSeen(): number {
    return activeQuestions.filter(q => progress[q.id]?.seen).length
  }

  function isPreviewComplete(isPremium: boolean): boolean {
    if (isPremium) return false
    const moduleIds: ModuleId[] = ['priority', 'signs', 'roadusers', 'infrastructure', 'legal', 'vocabulary']
    return moduleIds.every(id => getModuleSeen(id) >= FREE_PER_MODULE)
  }

  return {
    progress,
    isLoaded,
    recordAnswer,
    migrateLocalProgress,
    getDotState,
    getModuleStatus,
    getReviewQueue,
    getModuleSeen,
    getTotalSeen,
    isPreviewComplete,
  }
}
