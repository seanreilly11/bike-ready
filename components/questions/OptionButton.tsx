'use client'

import { useEffect, useRef, useState } from 'react'
import type { Option } from '@/types'

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'unselected-after-answer'

interface OptionButtonProps {
  option:   Option
  state:    OptionState
  onClick:  () => void
  disabled: boolean
}

const stateClasses: Record<OptionState, string> = {
  'idle':                    'bg-white border-stone-200 text-stone-900 hover:border-stone-400',
  'selected':                'bg-orange-light border-orange text-stone-900',
  'correct':                 'bg-green-light border-green text-green-dark',
  'incorrect':               'bg-red-light border-red text-red-dark',
  'unselected-after-answer': 'bg-white border-stone-200 text-stone-400',
}

const stateIndicator: Partial<Record<OptionState, string>> = {
  correct:   '✓',
  incorrect: '✗',
}

export default function OptionButton({ option, state, onClick, disabled }: OptionButtonProps) {
  const prevState = useRef<OptionState>(state)
  const [burst, setBurst] = useState<'pop' | 'shake' | null>(null)

  useEffect(() => {
    const prev = prevState.current
    if (prev !== 'correct' && state === 'correct') setBurst('pop')
    if (prev !== 'incorrect' && state === 'incorrect') setBurst('shake')
    prevState.current = state
  }, [state])

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      onAnimationEnd={() => setBurst(null)}
      className={[
        'w-full flex items-center gap-3 rounded-xl border px-4 py-3 min-h-[44px]',
        'text-left font-display text-base leading-relaxed',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        disabled ? 'cursor-default' : 'cursor-pointer',
        stateClasses[state],
        burst === 'pop'   ? 'animate-pop'   : '',
        burst === 'shake' ? 'animate-shake' : '',
      ].join(' ')}
    >
      <span className="font-mono text-xs uppercase tracking-wide text-stone-400 shrink-0 w-4">
        {option.id}
      </span>
      <span className="flex-1">{option.label}</span>
      {stateIndicator[state] && (
        <span className={[
          'shrink-0 font-bold',
          state === 'correct'   ? 'text-green-dark' : '',
          state === 'incorrect' ? 'text-red-dark'   : '',
        ].join(' ')}>
          {stateIndicator[state]}
        </span>
      )}
    </button>
  )
}
