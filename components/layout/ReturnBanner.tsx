'use client'

import { useAuthModal } from '@/hooks/useAuthModal'

interface ReturnBannerProps {
  totalSeen: number
  onDismiss: () => void
}

export default function ReturnBanner({ totalSeen, onDismiss }: ReturnBannerProps) {
  const openAuth = useAuthModal()
  if (totalSeen < 3) return null

  return (
    <div className="bg-orange-light border-b border-orange-mid px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
      <p className="text-stone-700">
        Welcome back —{' '}
        <button
          onClick={openAuth}
          className="font-bold text-orange underline underline-offset-2 hover:no-underline focus-visible:outline-none cursor-pointer"
        >
          sign in
        </button>{' '}
        to keep your progress safe.
      </p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-stone-400 hover:text-stone-900 transition-colors p-1 -m-1 focus-visible:outline-none cursor-pointer"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  )
}
