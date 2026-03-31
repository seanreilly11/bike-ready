import type { Difficulty } from '@/types'

type BadgeVariant = Difficulty | 'earned' | 'locked'

interface BadgeProps {
  variant: BadgeVariant
  label?:  string
  emoji?:  string
}

const variantClasses: Record<BadgeVariant, string> = {
  easy:   'bg-green-light text-green-dark border-green-mid',
  medium: 'bg-yellow-light text-yellow-dark border-yellow',
  hard:   'bg-red-light text-red-dark border-red-mid',
  earned: 'bg-yellow-light text-yellow-dark border-yellow',
  locked: 'bg-stone-100 text-stone-400 border-stone-200',
}

export default function Badge({ variant, label, emoji }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1',
        'font-mono text-xs uppercase tracking-wide',
        'rounded-full px-2 py-0.5',
        'border',
        variantClasses[variant],
      ].join(' ')}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </span>
  )
}
