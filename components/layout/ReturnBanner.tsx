'use client'

import { X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ReturnBannerProps {
  onDismiss: () => void
}

export default function ReturnBanner({ onDismiss }: ReturnBannerProps) {
  const openAuth = useUIStore((s) => s.openAuth)
  const { track } = useAnalytics()

  return (
    <div className="bg-orange-light border-b border-orange-mid px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
      <p className="text-stone-700">
        Welcome back —{' '}
        <button
          onClick={() => { track('return_banner_clicked', {}); openAuth('save_progress'); }}
          className="font-bold text-orange underline underline-offset-2 hover:no-underline focus-visible:outline-none cursor-pointer"
        >
          sign in
        </button>{' '}
        to keep your progress safe.
      </p>
      <button
        onClick={() => { track('return_banner_dismissed', {}); onDismiss(); }}
        className="shrink-0 text-stone-400 hover:text-stone-900 transition-colors p-2.5 -m-2.5 focus-visible:outline-none cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
