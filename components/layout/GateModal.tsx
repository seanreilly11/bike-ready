'use client'

import type { Module } from '@/types'
import Button from '@/components/ui/Button'

interface GateModalProps {
  moduleName:   string
  nextModule:   Module | null
  onUnlock:     () => void
  onNextModule: (id: string) => void
  onDismiss:    () => void
}

const features = [
  'All questions in every module',
  'Shrinking Review queue',
  'Timed Test with results breakdown',
  'Module completion badges',
  'Progress saved across devices',
]

export default function GateModal({
  moduleName,
  nextModule,
  onUnlock,
  onNextModule,
  onDismiss,
}: GateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 pb-8 animate-fade-up">

        {/* Social proof */}
        <div className="flex justify-center mb-4">
          <span className="font-mono text-xs uppercase tracking-wide bg-orange-light text-orange border border-orange-mid rounded-full px-3 py-1">
            2,400+ expats ready to ride
          </span>
        </div>

        <h2 className="font-display font-extrabold text-2xl text-stone-900 text-center mb-2">
          Want to finish {moduleName}?
        </h2>
        <p className="text-stone-600 text-sm text-center mb-5">
          Unlock the full course once and keep it forever.
        </p>

        {/* Feature list */}
        <ul className="space-y-2 mb-6">
          {features.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-stone-700">
              <span className="text-green font-bold">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Next module nudge */}
        {nextModule && (
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-0.5">
                Or try next
              </p>
              <p className="font-display font-bold text-stone-900">
                {nextModule.emoji} {nextModule.title}
              </p>
            </div>
            <button
              onClick={() => onNextModule(nextModule.id)}
              className="text-sm font-display font-bold text-orange hover:underline whitespace-nowrap focus-visible:outline-none"
            >
              Try it →
            </button>
          </div>
        )}

        <Button variant="primary" size="lg" full onClick={onUnlock}>
          Unlock for €4.99
        </Button>
        <p className="text-center text-xs text-stone-400 mt-2">
          Less than the fine for running a red light
        </p>

        <div className="flex justify-center mt-4">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  )
}
