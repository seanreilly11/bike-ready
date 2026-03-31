'use client'

import { useEffect } from 'react'
import type { Badge } from '@/types'

interface BadgeToastProps {
  badge:      Badge
  onDismiss:  () => void
}

export default function BadgeToast({ badge, onDismiss }: BadgeToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-6 right-6 sm:bottom-6 sm:right-6',
        'left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0',
        'w-[calc(100vw-3rem)] sm:w-auto sm:max-w-xs',
        'bg-yellow-light border border-yellow rounded-2xl shadow-xl px-4 py-3',
        'flex items-center gap-3 animate-pop',
        'z-50',
      ].join(' ')}
    >
      <span className="text-2xl">{badge.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs uppercase tracking-wide text-yellow-dark mb-0.5">
          Badge earned
        </p>
        <p className="font-display font-bold text-stone-900 text-sm truncate">
          {badge.name}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-stone-400 hover:text-stone-900 transition-colors shrink-0 focus-visible:outline-none"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
