import type { Question } from '@/types'

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
