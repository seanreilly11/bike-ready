'use client'

import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  full?:    boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-orange text-white hover:bg-orange/90 disabled:bg-stone-200 disabled:text-stone-400',
  secondary: 'bg-white text-stone-900 border border-stone-200 hover:border-stone-400 disabled:opacity-50',
  ghost:     'bg-transparent text-stone-600 hover:text-stone-900 disabled:opacity-40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-2',
  md: 'text-base px-4 py-2.5',
  lg: 'text-base px-5 py-3',
}

export default function Button({
  variant = 'primary',
  size    = 'md',
  full    = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-xl font-display font-bold',
        'transition-all duration-150',
        'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        full ? 'w-full' : '',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
