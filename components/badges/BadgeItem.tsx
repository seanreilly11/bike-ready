import type { Badge } from '@/types'

interface BadgeItemProps {
  badge:    Badge
  earned:   boolean
  mastered: boolean
  size?:    'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { outer: 'size-9',    emoji: 'text-base',   pip: 'size-3.5',    svg: 'size-[7px]'  },
  md: { outer: 'size-14',   emoji: 'text-[25px]', pip: 'size-[18px]', svg: 'size-[9px]'  },
  lg: { outer: 'size-[72px]', emoji: 'text-[32px]', pip: 'size-[22px]', svg: 'size-[11px]' },
}

export default function BadgeItem({ badge, earned, mastered, size = 'md' }: BadgeItemProps) {
  const classes = sizeClasses[size]

  const borderColor = mastered ? '#f5a623' : earned ? '#4ade80' : '#E8E4DC'
  const borderWidth = mastered || earned ? 2.5 : 1
  const bg          = mastered ? '#fffbea' : '#F4F2EE'
  const opacity     = earned ? 1 : 0.4
  const emoji       = earned ? badge.emoji : '🔒'

  return (
    <div className="relative inline-block">
      <div
        className={`${classes.outer} ${classes.emoji} rounded-full flex items-center justify-center select-none`}
        style={{ background: bg, border: `${borderWidth}px solid ${borderColor}`, opacity, lineHeight: 1 }}
        aria-label={badge.name}
      >
        {emoji}
      </div>

      {mastered && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${classes.pip} rounded-full flex items-center justify-center border-2 border-white`}
          style={{ background: '#f5a623' }}
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
