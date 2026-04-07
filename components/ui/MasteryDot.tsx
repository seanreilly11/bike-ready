import type { DotState } from '@/types'

interface MasteryDotProps {
  state: DotState
}

const stateClasses: Record<DotState, string> = {
  unseen:  'bg-stone-200',
  seen:    'bg-orange',
  correct: 'bg-green',
  active:  'bg-orange ring-2 ring-orange ring-offset-1',
  locked:  'bg-stone-300 flex items-center justify-center',
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 8 9"
      className="w-[5px] h-[6px]"
      fill="currentColor"
      aria-hidden
    >
      <rect x="0" y="4" width="8" height="5" rx="1" />
      <path
        d="M2 4V2.5a2 2 0 0 1 4 0V4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function MasteryDot({ state }: MasteryDotProps) {
  return (
    <div
      className={[
        'w-2.5 h-2.5 rounded-full transition-colors duration-200 text-stone-500',
        stateClasses[state],
      ].join(' ')}
    >
      {state === 'locked' && <LockIcon />}
    </div>
  )
}
