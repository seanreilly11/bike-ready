import type { Badge } from '@/types'

interface BadgeItemProps {
  badge:    Badge
  earned:   boolean
  mastered: boolean
  size?:    'sm' | 'md' | 'lg'
}

const sizeMap    = { sm: 36, md: 56, lg: 72 }
const pipSizeMap = { sm: 14, md: 18, lg: 22 }
const svgSizeMap = { sm: 7,  md: 9,  lg: 11 }

export default function BadgeItem({ badge, earned, mastered, size = 'md' }: BadgeItemProps) {
  const px    = sizeMap[size]
  const pipPx = pipSizeMap[size]
  const svgPx = svgSizeMap[size]

  const borderColor = mastered ? '#f5a623' : earned ? '#4ade80' : '#E8E4DC'
  const borderWidth = mastered || earned ? 2.5 : 1
  const bg          = mastered ? '#fffbea' : '#F4F2EE'
  const opacity     = earned ? 1 : 0.4
  const emoji       = earned ? badge.emoji : '🔒'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          width:          px,
          height:         px,
          boxSizing:      'content-box',
          borderRadius:   '50%',
          background:     bg,
          border:         `${borderWidth}px solid ${borderColor}`,
          opacity,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       Math.round(px * 0.45),
          lineHeight:     1,
          userSelect:     'none',
        }}
        aria-label={badge.name}
      >
        {emoji}
      </div>

      {mastered && (
        <div
          style={{
            position:       'absolute',
            bottom:         -2,
            right:          -2,
            width:          pipPx,
            height:         pipPx,
            borderRadius:   '50%',
            background:     '#f5a623',
            border:         '2px solid white',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <svg
            viewBox="0 0 10 10"
            fill="white"
            style={{ width: svgPx, height: svgPx }}
            aria-hidden="true"
          >
            <polygon points="5,1 6.2,3.8 9.5,4.1 7.1,6.2 7.9,9.5 5,7.8 2.1,9.5 2.9,6.2 0.5,4.1 3.8,3.8" />
          </svg>
        </div>
      )}
    </div>
  )
}
