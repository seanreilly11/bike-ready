import type { Badge } from '@/types'

interface BadgeItemProps {
  badge:    Badge
  earned:   boolean
}

export default function BadgeItem({ badge, earned }: BadgeItemProps) {
  return (
    <div className={[
      'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center',
      earned
        ? 'bg-yellow-light border-yellow'
        : 'bg-stone-100 border-stone-200 opacity-50',
    ].join(' ')}>
      <span className={['text-2xl', earned ? '' : 'grayscale'].join(' ')}>
        {badge.emoji}
      </span>
      <p className="font-display font-bold text-xs text-stone-900 leading-tight">
        {badge.name}
      </p>
      {!earned && (
        <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
          Locked
        </span>
      )}
    </div>
  )
}
