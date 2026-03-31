'use client'

import type { Question, LocalProgress, DotState } from '@/types'
import { FREE_PER_MODULE } from '@/types'
import MasteryDot from '@/components/ui/MasteryDot'

interface DotMapProps {
  questions:   Question[]
  progress:    LocalProgress
  currentId:   string
  isPremium:   boolean
  onDotClick:  (index: number) => void
}

function getDotState(questionId: string, progress: LocalProgress, currentId: string): DotState {
  if (questionId === currentId) return 'active'
  const p = progress[questionId]
  if (!p) return 'unseen'
  if (p.correct) return 'correct'
  return 'seen'
}

export default function DotMap({
  questions,
  progress,
  currentId,
  isPremium,
  onDotClick,
}: DotMapProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, index) => {
        const isGated = !isPremium && index >= FREE_PER_MODULE
        const state   = getDotState(q.id, progress, currentId)

        return (
          <button
            key={q.id}
            onClick={() => !isGated && onDotClick(index)}
            disabled={isGated}
            aria-label={`Question ${index + 1}: ${state}`}
            className={[
              'p-2 -m-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-1',
              isGated ? 'cursor-default' : 'cursor-pointer',
            ].join(' ')}
          >
            <div style={{ opacity: isGated ? 0.35 : 1 }}>
              <MasteryDot state={state} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
