'use client'

import type { Question, LocalProgress, DotState, ModuleStatus } from '@/types'
import { FREE_PER_MODULE } from '@/types'
import MasteryDot from '@/components/ui/MasteryDot'
import { useAuth } from '@/hooks/useAuth'

interface DotMapProps {
  questions:     Question[]
  progress:      LocalProgress
  currentId:     string
  onDotClick:    (index: number) => void
  alwaysFree?:   boolean
  moduleStatus?: ModuleStatus
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
  onDotClick,
  alwaysFree = false,
  moduleStatus,
}: DotMapProps) {
  const { isPremium } = useAuth()
  const isMastered = moduleStatus === 'mastered'

  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, index) => {
        const isGated = !alwaysFree && !isPremium && index >= FREE_PER_MODULE
        // A mastered module shows all dots gold — a module-level signal that
        // overrides individual question state.
        const state: DotState = isMastered
          ? 'mastered'
          : isGated
            ? 'locked'
            : getDotState(q.id, progress, currentId)

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
            <MasteryDot state={state} />
          </button>
        )
      })}
    </div>
  )
}
