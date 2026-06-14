import { Lock } from 'lucide-react'
import type { Badge } from '@/types'
import { colors } from '@/lib/tokens'

interface BadgeItemProps {
  badge:    Badge
  earned:   boolean
  mastered: boolean
  size?:    'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { outer: 'size-9',      icon: 16, pip: 'size-3.5',    svg: 'size-[7px]',  lock: 15 },
  md: { outer: 'size-14',     icon: 24, pip: 'size-[18px]', svg: 'size-[9px]',  lock: 20 },
  lg: { outer: 'size-[72px]', icon: 30, pip: 'size-[22px]', svg: 'size-[11px]', lock: 26 },
}

export default function BadgeItem({ badge, earned, mastered, size = 'md' }: BadgeItemProps) {
  const classes = sizeClasses[size]
  const Icon = badge.icon

  const borderColor = mastered ? colors.gold : earned ? colors.green : colors.stone200
  const borderWidth = mastered || earned ? 2.5 : 1
  const bg          = mastered ? colors.goldLight : colors.stone100
  const opacity     = earned ? 1 : 0.4
  const iconColor   = mastered ? colors.gold : colors.orange

  return (
    <div className="relative inline-block">
      <div
        className={`${classes.outer} rounded-full flex items-center justify-center select-none`}
        style={{ background: bg, border: `${borderWidth}px solid ${borderColor}`, opacity }}
        aria-label={badge.name}
      >
        {earned ? (
          <Icon size={classes.icon} strokeWidth={1.75} style={{ color: iconColor }} aria-hidden="true" />
        ) : (
          <Lock size={classes.lock} className="text-stone-500" aria-hidden="true" />
        )}
      </div>

      {mastered && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${classes.pip} rounded-full flex items-center justify-center border-2 border-white`}
          style={{ background: colors.gold }}
        >
          <svg
            viewBox="0 0 10 10"
            fill="white"
            className={classes.svg}
            aria-hidden="true"
          >
            <polygon points="5,1 6.2,3.8 9.5,4.1 7.1,6.2 7.9,9.5 5,7.8 2.1,9.5 2.9,6.2 0.5,4.1 3.8,3.8" />
          </svg>
        </div>
      )}
    </div>
  )
}
