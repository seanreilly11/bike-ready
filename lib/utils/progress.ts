import type { LocalProgress, Question } from '@/types'

// Union of two progress maps. seen/correct are OR'd per question so a sign-in
// sync can never downgrade an answer. This is the sync-conflict merge only -
// distinct from upsert_question_progress in Postgres, which is last-answer-wins.
export function mergeProgress(
  local: LocalProgress,
  server: LocalProgress
): LocalProgress {
  const merged: LocalProgress = { ...local }
  for (const [id, row] of Object.entries(server)) {
    const existing = merged[id]
    merged[id] = {
      seen: (existing?.seen ?? false) || row.seen,
      correct: (existing?.correct ?? false) || row.correct,
    }
  }
  return merged
}

// Local answers the server doesn't know about yet: seen locally but missing
// server-side, or correct locally while the server row is still wrong.
export function progressToUpload(
  local: LocalProgress,
  server: LocalProgress
): { questionId: string; correct: boolean }[] {
  return Object.entries(local)
    .filter(([id, row]) => {
      if (!row.seen) return false
      const serverRow = server[id]
      if (!serverRow) return true
      return row.correct && !serverRow.correct
    })
    .map(([questionId, { correct }]) => ({ questionId, correct }))
}

export function isMastered(
  moduleId: string,
  progress: Record<string, { seen: boolean; correct: boolean }>,
  questions: Question[]
): boolean {
  const moduleQuestions = questions.filter(
    (q) => q.module === moduleId && q.status === 'active'
  )
  if (moduleQuestions.length === 0) return false
  return moduleQuestions.every((q) => progress[q.id]?.correct === true)
}
