'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Question, ModuleId } from '@/types'
import { FREE_PER_MODULE } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { useBadges } from '@/hooks/useBadges'
import { useAnalytics } from '@/hooks/useAnalytics'
import Nav from '@/components/layout/Nav'
import ReturnBanner from '@/components/layout/ReturnBanner'
import AuthModal from '@/components/layout/AuthModal'
import GateModal from '@/components/layout/GateModal'
import DotMap from '@/components/modules/DotMap'
import QuestionCard from '@/components/questions/QuestionCard'
import BadgeToast from '@/components/badges/BadgeToast'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import modules from '@/data/modules'
import questionsData from '@/data/questions.json'

const allActive = (questionsData as Question[]).filter(q => q.status === 'active')

export default function ModuleSessionPage() {
  const params   = useParams()
  const router   = useRouter()
  const moduleId = params.moduleId as ModuleId

  const mod = modules.find(m => m.id === moduleId)

  const { user, isPremium, sendMagicLink } = useAuth()
  const progress  = useProgress(user)
  const badges    = useBadges(user)
  const { track } = useAnalytics()

  const [currentIndex, setCurrentIndex]   = useState(0)
  const [showAuth,     setShowAuth]        = useState(false)
  const [showGate,     setShowGate]        = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [answeredThisSession, setAnsweredThisSession] = useState<Set<string>>(new Set())

  const moduleQuestions = useMemo(
    () => allActive.filter(q => q.module === moduleId),
    [moduleId],
  )

  const currentQuestion = moduleQuestions[currentIndex]
  const totalSeen       = progress.getTotalSeen()
  const seenInModule    = progress.getModuleSeen(moduleId)
  const allDone         = seenInModule === moduleQuestions.length

  // Gate: free users after question 2
  const hitGate = !isPremium && currentIndex >= FREE_PER_MODULE

  const nextModuleIndex = modules.findIndex(m => m.id === moduleId) + 1
  const nextModule      = nextModuleIndex < modules.length ? modules[nextModuleIndex] : null

  if (!mod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400">Module not found.</p>
      </div>
    )
  }

  async function handleAnswer(optionId: string, correct: boolean) {
    if (!currentQuestion) return
    await progress.recordAnswer(currentQuestion.id, correct)
    await badges.checkModuleBadge(moduleId, progress.progress)
    setAnsweredThisSession(prev => new Set([...prev, currentQuestion.id]))

    await track('question_answered', {
      question_id: currentQuestion.id,
      module:      moduleId,
      skill:       currentQuestion.skill,
      difficulty:  currentQuestion.difficulty,
      correct,
    })
  }

  function handleNext() {
    const nextIndex = currentIndex + 1
    if (nextIndex >= moduleQuestions.length) return
    if (!isPremium && nextIndex >= FREE_PER_MODULE) {
      setShowGate(true)
      return
    }
    setCurrentIndex(nextIndex)
  }

  const progressPct = moduleQuestions.length > 0
    ? Math.round((seenInModule / moduleQuestions.length) * 100)
    : 0

  return (
    <>
      <Nav
        currentRoute={`/learn/${moduleId}`}
        wrongCount={progress.getReviewQueue().length}
        isPremium={isPremium}
        onSignIn={() => setShowAuth(true)}
      />

      {!user && !bannerDismissed && (
        <ReturnBanner
          totalSeen={totalSeen}
          onSignIn={() => setShowAuth(true)}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Sticky sub-header */}
      <div className="sticky top-14 z-30 bg-white border-b border-stone-200 px-5 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push('/learn')}
              className="text-stone-400 hover:text-stone-900 text-sm focus-visible:outline-none"
              aria-label="Back to modules"
            >
              ←
            </button>
            <span className="font-display font-bold text-stone-900 flex-1">
              {mod.emoji} {mod.title}
            </span>
            <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
              {seenInModule} / {moduleQuestions.length}
            </span>
          </div>
          <ProgressBar value={progressPct} color="orange" height={3} />
        </div>
      </div>

      <main className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-5 py-6 lg:py-10">

          {/* Dot map */}
          <div className="mb-6">
            <DotMap
              questions={moduleQuestions}
              progress={progress.progress}
              currentId={currentQuestion?.id ?? ''}
              isPremium={isPremium}
              onDotClick={setCurrentIndex}
            />
          </div>

          {/* Badge toast */}
          {badges.newBadge && (
            <BadgeToast badge={badges.newBadge} onDismiss={badges.dismissNewBadge} />
          )}

          {/* All done */}
          {allDone ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">{mod.emoji}</div>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-2">
                Module complete
              </h2>
              <p className="text-stone-600 text-sm mb-6">
                You&apos;ve seen all {moduleQuestions.length} questions in {mod.title}.
              </p>
              {!user && (
                <div className="bg-orange-light border border-orange-mid rounded-xl p-4 mb-6 text-sm text-stone-700">
                  Sign in so you don&apos;t lose what you&apos;ve done.{' '}
                  <button
                    onClick={() => setShowAuth(true)}
                    className="font-bold text-orange underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {nextModule && (
                  <Button
                    variant="primary"
                    size="lg"
                    full
                    onClick={() => router.push(`/learn/${nextModule.id}`)}
                  >
                    Next: {nextModule.emoji} {nextModule.title} →
                  </Button>
                )}
                <Button variant="secondary" size="lg" full onClick={() => router.push('/learn')}>
                  Back to modules
                </Button>
              </div>
            </div>
          ) : hitGate ? (
            /* Inline gate screen */
            <div className="animate-fade-up">
              <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 mb-4">
                <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-2">
                  Free preview complete
                </p>
                <h2 className="font-display font-bold text-xl text-stone-900 mb-1">
                  Want to finish {mod.title}?
                </h2>
                <p className="text-stone-600 text-sm">
                  You&apos;ve used your 2 free questions in this module.
                </p>
              </div>

              {nextModule && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-0.5">Try next</p>
                    <p className="font-display font-bold text-stone-900">{nextModule.emoji} {nextModule.title}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/learn/${nextModule.id}`)}
                    className="text-sm font-bold text-orange hover:underline focus-visible:outline-none"
                  >
                    Try it →
                  </button>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                full
                onClick={() => setShowGate(true)}
              >
                Unlock for €4.99
              </Button>
            </div>
          ) : (
            /* Active question */
            currentQuestion && (
              <div>
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={handleAnswer}
                  answered={!!progress.progress[currentQuestion.id]?.seen}
                  selectedId={null}
                  hideCorrect={false}
                />
                {progress.progress[currentQuestion.id]?.seen && currentIndex < moduleQuestions.length - 1 && (
                  <div className="mt-4">
                    <Button variant="primary" size="lg" full onClick={handleNext}>
                      Next question →
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </main>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} sendMagicLink={sendMagicLink} />
      )}

      {showGate && (
        <GateModal
          moduleName={mod.title}
          nextModule={nextModule}
          onUnlock={() => router.push('/api/checkout')}
          onNextModule={id => { setShowGate(false); router.push(`/learn/${id}`) }}
          onDismiss={() => setShowGate(false)}
        />
      )}
    </>
  )
}
