'use client'

import { useState } from 'react'
import type { DotState } from '@/types'

interface MasteryDotProps {
  state: DotState
}

const stateClasses: Record<DotState, string> = {
  unseen:   'bg-stone-200',
  seen:     'bg-orange',
  correct:  'bg-green',
  active:   'bg-orange ring-2 ring-orange ring-offset-1',
  locked:   'bg-stone-300',
  mastered: 'bg-gold',
}

export default function MasteryDot({ state }: MasteryDotProps) {
  const [popping, setPopping] = useState(false)
  const [prevState, setPrevState] = useState<DotState>(state)

  if (state !== prevState) {
    if (prevState !== 'correct' && state === 'correct') {
      setPopping(true)
    }
    setPrevState(state)
  }

  return (
    <div
      className={[
        'w-2.5 h-2.5 rounded-full transition-colors duration-200',
        stateClasses[state],
        popping ? 'animate-pop' : '',
      ].join(' ')}
      onAnimationEnd={() => setPopping(false)}
    />
  )
}
