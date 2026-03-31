import type { DotState } from '@/types'

interface MasteryDotProps {
  state: DotState
}

const stateClasses: Record<DotState, string> = {
  unseen:  'bg-stone-200',
  seen:    'bg-orange',
  correct: 'bg-green',
  active:  'bg-orange ring-2 ring-orange ring-offset-1',
}

export default function MasteryDot({ state }: MasteryDotProps) {
  return (
    <div
      className={[
        'w-2.5 h-2.5 rounded-full transition-colors duration-200',
        stateClasses[state],
      ].join(' ')}
    />
  )
}
