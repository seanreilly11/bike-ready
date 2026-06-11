'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
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

const stateHasIndicator = new Set<OptionState>(['correct', 'incorrect'])

export default function OptionButton({ option, state, onClick, disabled }: OptionButtonProps) {
  const [burst, setBurst] = useState<'pop' | 'shake' | null>(null)
  const [prevState, setPrevState] = useState<OptionState>(state)

  if (state !== prevState) {
    if (prevState !== 'correct' && state === 'correct') setBurst('pop')
    if (prevState !== 'incorrect' && state === 'incorrect') setBurst('shake')
    setPrevState(state)
  }

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
      {stateHasIndicator.has(state) && (
        <span className={[
          'shrink-0',
          state === 'correct'   ? 'text-green-dark' : '',
          state === 'incorrect' ? 'text-red-dark'   : '',
        ].join(' ')}>
          {state === 'correct' ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
        </span>
      )}
    </button>
  )
}
