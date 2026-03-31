'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface AuthModalProps {
  onClose:       () => void
  sendMagicLink: (email: string) => Promise<void>
}

export default function AuthModal({ onClose, sendMagicLink }: AuthModalProps) {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await sendMagicLink(email)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
          aria-label="Close"
        >
          ✕
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-display font-bold text-xl text-stone-900 mb-2">
              Check your email
            </h2>
            <p className="text-stone-600 text-sm">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-xl text-stone-900 mb-1">
              Sign in to BikeReady
            </h2>
            <p className="text-stone-600 text-sm mb-5">
              Save your progress and unlock the full course.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={[
                  'w-full rounded-xl border px-4 py-3 text-sm font-display text-stone-900',
                  'placeholder:text-stone-400',
                  'border-stone-200 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30',
                  'transition-colors duration-150',
                ].join(' ')}
              />
              {error && <p className="text-red-dark text-xs">{error}</p>}
              <Button type="submit" full loading={loading} disabled={loading || !email}>
                {loading ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>

            <p className="text-center text-xs text-stone-400 mt-4">
              No password. One click to sign in.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
