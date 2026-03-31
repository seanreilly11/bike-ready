import { HTMLAttributes } from 'react'

type Accent  = 'orange' | 'green' | 'red' | 'yellow' | null
type Variant = 'default' | 'muted'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?:  Accent
  hover?:   boolean
  variant?: Variant
}

const accentClasses: Record<NonNullable<Accent>, string> = {
  orange: 'border-l-[3px] border-l-orange',
  green:  'border-l-[3px] border-l-green',
  red:    'border-l-[3px] border-l-red',
  yellow: 'border-l-[3px] border-l-yellow',
}

export default function Card({
  accent   = null,
  hover    = false,
  variant  = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-stone-200 p-4',
        variant === 'muted' ? 'bg-stone-100' : 'bg-white',
        hover ? 'shadow-sm hover:shadow-md transition-shadow duration-200' : '',
        accent ? accentClasses[accent] : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
