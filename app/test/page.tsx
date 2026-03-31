'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/types'
import { TEST_PASS_PCT } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { useBadges } from '@/hooks/useBadges'
import { useAnalytics } from '@/hooks/useAnalytics'
import Nav from '@/components/layout/Nav'
import AuthModal from '@/components/layout/AuthModal'
import QuestionCard from '@/components/questions/QuestionCard'
import FeedbackPanel from '@/components/questions/FeedbackPanel'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import modules from '@/data/modules'
import questionsData from '@/data/questions.json'

const allActive = (questionsData as Question[]).filter(q => q.status === 'active')

// Pick ~18 questions spread across all modules
function buildTestSet(): Question[] {
  const perModule = 3
  const set: Question[] = []
  for (const mod of modules) {
    const modQs = allActive.filter(q => q.module === mod.id)
    // Simple deterministic shuffle via sort — stable across renders
    const picked = [...modQs].sort(() => 0).slice(0, perModule)
    set.push(...picked)
  }
  return set
}

type Phase = 'intro' | 'questions' | 'results'

interface Answer {
  question:  Question
  selectedId: string
  correct:    boolean
}

export default function TestPage() {
  const router   = useRouter()
  const { user, isPremium, sendMagicLink } = useAuth()
  const progress = useProgress(user)
  const { checkModuleBadge } = useBadges(user)
  const { track } = useAnalytics()

  const [phase,      setPhase]     = useState<Phase>('intro')
  const [index,      setIndex]     = useState(0)
  const [answers,    setAnswers]   = useState<Answer[]>([])
  const [showAuth,   setShowAuth]  = useState(false)
  const [submitted,  setSubmitted] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const testSet = useMemo(() => buildTestSet(), [])

  if (!isPremium) {
    return (
      <>
        <Nav currentRoute="/test" wrongCount={0} isPremium={false} onSignIn={() => setShowAuth(true)} />
        <main className="min-h-screen bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-16 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="font-display font-bold text-xl text-stone-900 mb-2">
              Test is a premium feature
            </h1>
            <p className="text-stone-600 text-sm mb-6">
              Unlock the full course to take the BikeReady Test.
            </p>
            <Button size="lg" onClick={() => router.push('/learn')}>
              Unlock for €4.99
            </Button>
          </div>
        </main>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} sendMagicLink={sendMagicLink} />}
      </>
    )
  }

  const reviewQueue = progress.getReviewQueue()

  // -------------------------------------------------------------------------
  // Intro phase
  // -------------------------------------------------------------------------
  if (phase === 'intro') {
    return (
      <>
        <Nav
          currentRoute="/test"
          wrongCount={reviewQueue.length}
          isPremium={isPremium}
          onSignIn={() => setShowAuth(true)}
        />
        <main className="min-h-screen bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-10">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🏆</div>
              <h1 className="font-display font-extrabold text-3xl text-stone-900 tracking-tight mb-3">
                BikeReady Test
              </h1>
              <p className="text-stone-600 text-base leading-relaxed max-w-md mx-auto">
                {testSet.length} questions across all modules. Feedback is withheld until the results screen.
                Score ≥{TEST_PASS_PCT}% to earn the BikeReady badge.
              </p>
            </div>

            <div className="grid gap-3 mb-8">
              {[
                { label: 'Questions', value: `${testSet.length} mixed questions` },
                { label: 'Feedback',  value: 'Shown after all questions' },
                { label: 'Pass mark', value: `${TEST_PASS_PCT}% or above` },
                { label: 'Badge',     value: 'BikeReady 🏆 on pass' },
              ].map(row => (
                <div
                  key={row.label}
                  className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3"
                >
                  <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                    {row.label}
                  </span>
                  <span className="font-display text-sm text-stone-900">{row.value}</span>
                </div>
              ))}
            </div>

            <Button full size="lg" onClick={() => setPhase('questions')}>
              Start Test →
            </Button>
          </div>
        </main>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} sendMagicLink={sendMagicLink} />}
      </>
    )
  }

  // -------------------------------------------------------------------------
  // Questions phase
  // -------------------------------------------------------------------------
  const currentQ = testSet[index]

  async function handleAnswer(optionId: string, correct: boolean) {
    setSelectedId(optionId)
    setSubmitted(true)

    const newAnswer: Answer = { question: currentQ, selectedId: optionId, correct }

    // Record progress in background
    await progress.recordAnswer(currentQ.id, correct)
    await track('question_answered', {
      question_id: currentQ.id,
      module:      currentQ.module,
      skill:       currentQ.skill,
      difficulty:  currentQ.difficulty,
      correct,
    })
    await checkModuleBadge(currentQ.module, progress.progress)

    if (index + 1 >= testSet.length) {
      // Last question — go to results
      const allAnswers = [...answers, newAnswer]
      setAnswers(allAnswers)
      const scorePct = Math.round(
        (allAnswers.filter(a => a.correct).length / allAnswers.length) * 100
      )
      await track('test_completed', { score_pct: scorePct, passed: scorePct >= TEST_PASS_PCT })
      setPhase('results')
    } else {
      setAnswers(prev => [...prev, newAnswer])
    }
  }

  function handleNext() {
    setSubmitted(false)
    setSelectedId(null)
    setIndex(i => i + 1)
  }

  if (phase === 'questions') {
    const pct = Math.round((index / testSet.length) * 100)

    return (
      <>
        <Nav
          currentRoute="/test"
          wrongCount={reviewQueue.length}
          isPremium={isPremium}
          onSignIn={() => setShowAuth(true)}
        />
        <main className="min-h-screen bg-stone-50">
          {/* Progress header */}
          <div className="sticky top-14 z-30 bg-white border-b border-stone-200 px-5 py-3">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                  Question {index + 1} / {testSet.length}
                </span>
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                  {pct}%
                </span>
              </div>
              <ProgressBar value={pct} color="orange" height={3} />
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-5 py-6">
            <QuestionCard
              key={currentQ.id}
              question={currentQ}
              onAnswer={handleAnswer}
              answered={submitted}
              selectedId={selectedId}
              hideCorrect   // no feedback in Test mode
            />

            {submitted && index + 1 < testSet.length && (
              <div className="mt-4 animate-fade-up">
                <Button full size="lg" onClick={handleNext}>
                  Next question →
                </Button>
              </div>
            )}
          </div>
        </main>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} sendMagicLink={sendMagicLink} />}
      </>
    )
  }

  // -------------------------------------------------------------------------
  // Results phase
  // -------------------------------------------------------------------------
  const correctCount = answers.filter(a => a.correct).length
  const scorePct     = Math.round((correctCount / answers.length) * 100)
  const passed       = scorePct >= TEST_PASS_PCT
  const wrongAnswers = answers.filter(a => !a.correct)

  // Per-module breakdown
  const moduleBreakdown = modules.map(mod => {
    const modAnswers = answers.filter(a => a.question.module === mod.id)
    const modCorrect = modAnswers.filter(a => a.correct).length
    return {
      mod,
      correct: modCorrect,
      total:   modAnswers.length,
      pct:     modAnswers.length > 0 ? Math.round((modCorrect / modAnswers.length) * 100) : 0,
    }
  }).filter(b => b.total > 0)

  function handleShare() {
    const text = `I scored ${scorePct}% on the BikeReady Test! 🚲 Ready to cycle in the Netherlands.`
    if (navigator.share) {
      navigator.share({ text, url: 'https://bikeready.app' }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <>
      <Nav
        currentRoute="/test"
        wrongCount={reviewQueue.length}
        isPremium={isPremium}
        onSignIn={() => setShowAuth(true)}
      />
      <main className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-5 py-8 lg:py-12">

          {/* Score hero */}
          <div className={[
            'rounded-2xl p-6 text-center mb-6',
            passed ? 'bg-green-light border border-green-mid' : 'bg-red-light border border-red-mid',
          ].join(' ')}>
            <div className="text-5xl mb-3">{passed ? '🏆' : '🔁'}</div>
            <p className="font-display font-extrabold text-5xl text-stone-900 mb-1">
              {scorePct}%
            </p>
            <p className={[
              'font-display font-bold text-lg mb-2',
              passed ? 'text-green-dark' : 'text-red-dark',
            ].join(' ')}>
              {passed ? 'BikeReady!' : 'Not quite there yet'}
            </p>
            <p className="text-stone-600 text-sm">
              {correctCount} of {answers.length} correct
              {!passed && ` — need ${TEST_PASS_PCT}% to pass`}
            </p>

            {passed && (
              <button
                onClick={handleShare}
                className="mt-4 inline-flex items-center gap-2 bg-white border border-green-mid text-green-dark rounded-xl px-4 py-2 text-sm font-display font-bold hover:bg-green-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              >
                Share result →
              </button>
            )}
          </div>

          {/* Module breakdown */}
          <div className="mb-8">
            <h2 className="font-display font-bold text-lg text-stone-900 mb-3">By module</h2>
            <div className="space-y-3">
              {moduleBreakdown.map(({ mod, correct, total, pct: modPct }) => (
                <div key={mod.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-medium text-stone-900 flex items-center gap-1.5">
                      {mod.emoji} {mod.title}
                    </span>
                    <span className="font-mono text-xs text-stone-400">
                      {correct}/{total}
                    </span>
                  </div>
                  <ProgressBar
                    value={modPct}
                    color={modPct >= TEST_PASS_PCT ? 'green' : 'orange'}
                    height={4}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Wrong answer review */}
          {wrongAnswers.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
                Review — {wrongAnswers.length} wrong
              </h2>
              <div className="space-y-4">
                {wrongAnswers.map(({ question, selectedId: sid }) => (
                  <div key={question.id} className="bg-white border border-stone-200 rounded-xl p-4">
                    <p className="text-sm text-stone-900 leading-relaxed mb-3">{question.prompt}</p>
                    <div className="space-y-1.5 mb-3">
                      {question.options.map(opt => (
                        <div
                          key={opt.id}
                          className={[
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border',
                            opt.id === question.correct
                              ? 'bg-green-light border-green text-green-dark'
                              : opt.id === sid
                              ? 'bg-red-light border-red text-red-dark'
                              : 'bg-white border-stone-200 text-stone-400',
                          ].join(' ')}
                        >
                          <span className="font-mono text-xs">{opt.id}</span>
                          <span className="flex-1">{opt.label}</span>
                          {opt.id === question.correct && <span className="font-bold">✓</span>}
                          {opt.id === sid && opt.id !== question.correct && <span className="font-bold">✗</span>}
                        </div>
                      ))}
                    </div>
                    <FeedbackPanel feedback={question.feedback} correct={false} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!passed && (
              <Button full size="lg" onClick={() => { setPhase('intro'); setAnswers([]); setIndex(0) }}>
                Try again →
              </Button>
            )}
            <Button full variant="secondary" size="lg" onClick={() => router.push('/learn')}>
              Back to modules
            </Button>
          </div>

        </div>
      </main>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} sendMagicLink={sendMagicLink} />}
    </>
  )
}
