'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { useAnalytics } from '@/hooks/useAnalytics'
import Nav from '@/components/layout/Nav'
import AuthModal from '@/components/layout/AuthModal'
import QuestionCard from '@/components/questions/QuestionCard'
import Button from '@/components/ui/Button'
import modules from '@/data/modules'

export default function ReviewPage() {
  const router = useRouter()
  const { user, isPremium, sendMagicLink } = useAuth()
  const progress  = useProgress(user)
  const { track } = useAnalytics()
  const [showAuth,  setShowAuth]  = useState(false)
  const [activeId,  setActiveId]  = useState<string | null>(null)

  if (!isPremium) {
    return (
      <>
        <Nav currentRoute="/review" wrongCount={0} isPremium={false} onSignIn={() => setShowAuth(true)} />
        <main className="min-h-screen bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-16 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="font-display font-bold text-xl text-stone-900 mb-2">Review is a premium feature</h1>
            <p className="text-stone-600 text-sm mb-6">Unlock to access your personal wrong-answer queue.</p>
            <Button variant="primary" size="lg" onClick={() => router.push('/api/checkout')}>
              Unlock for €4.99
            </Button>
          </div>
        </main>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} sendMagicLink={sendMagicLink} />}
      </>
    )
  }

  const queue       = progress.getReviewQueue()
  const activeQ     = activeId ? queue.find(q => q.id === activeId) : null

  async function handleAnswer(q: Question, optionId: string, correct: boolean) {
    await progress.recordAnswer(q.id, correct)
    await track('question_answered', {
      question_id: q.id,
      module:      q.module,
      skill:       q.skill,
      difficulty:  q.difficulty,
      correct,
    })
    if (correct) setActiveId(null)
  }

  if (queue.length === 0) {
    return (
      <>
        <Nav currentRoute="/review" wrongCount={0} isPremium={isPremium} onSignIn={() => setShowAuth(true)} />
        <main className="min-h-screen bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-16 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h1 className="font-display font-bold text-xl text-stone-900 mb-2">All cleared</h1>
            <p className="text-stone-600 text-sm mb-6">No wrong answers to review. Keep learning!</p>
            <Button variant="secondary" size="md" onClick={() => router.push('/learn')}>
              Back to modules
            </Button>
          </div>
        </main>
      </>
    )
  }

  // Group by module
  const byModule = modules.map(mod => ({
    mod,
    questions: queue.filter(q => q.module === mod.id),
  })).filter(g => g.questions.length > 0)

  return (
    <>
      <Nav
        currentRoute="/review"
        wrongCount={queue.length}
        isPremium={isPremium}
        onSignIn={() => setShowAuth(true)}
      />

      <main className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-5 py-6 lg:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight lg:text-3xl">
              Review
            </h1>
            <span className="font-mono text-xs uppercase tracking-wide text-red bg-red-light border border-red-mid rounded-full px-2.5 py-1">
              {queue.length} to fix
            </span>
          </div>

          {/* Hint */}
          <div className="bg-orange-light border border-orange-mid rounded-xl p-3 mb-6 text-sm text-stone-700">
            Get a question right and it disappears from this list.
          </div>

          {activeQ ? (
            <div>
              <button
                onClick={() => setActiveId(null)}
                className="text-sm text-stone-400 hover:text-stone-900 mb-4 focus-visible:outline-none"
              >
                ← Back to list
              </button>
              <QuestionCard
                key={activeQ.id}
                question={activeQ}
                onAnswer={(optionId, correct) => handleAnswer(activeQ, optionId, correct)}
                answered={false}
                selectedId={null}
                hideCorrect={false}
              />
            </div>
          ) : (
            byModule.map(({ mod, questions }) => (
              <div key={mod.id} className="mb-6">
                <h2 className="font-display font-bold text-stone-900 mb-2 flex items-center gap-2">
                  {mod.emoji} {mod.title}
                </h2>
                <div className="flex flex-col gap-2">
                  {questions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setActiveId(q.id)}
                      className={[
                        'w-full text-left bg-white border-l-[3px] border-l-red border border-stone-200 rounded-xl px-4 py-3',
                        'hover:border-l-red hover:shadow-sm transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
                      ].join(' ')}
                    >
                      <p className="text-sm text-stone-900 leading-relaxed line-clamp-2">{q.prompt}</p>
                      <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mt-1">{q.skill}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} sendMagicLink={sendMagicLink} />}
    </>
  )
}
