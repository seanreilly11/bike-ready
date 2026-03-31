'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import OnboardingOverlay from '@/components/layout/OnboardingOverlay'
import modules from '@/data/modules'

const ONBOARDING_KEY = 'bikeready_onboarding_done'

function getOnboardingDone() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

const howItWorks = [
  { step: '1', title: 'Scenario', body: 'You\'re dropped into a real Dutch cycling moment. Make a call.' },
  { step: '2', title: 'Feedback', body: 'Instant feedback confirms your instinct or corrects it with the actual rule.' },
  { step: '3', title: 'Lesson', body: 'Open the lesson accordion to go deeper on any skill, any time.' },
]

export default function LandingPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  function handleStartLearning() {
    if (getOnboardingDone()) {
      window.location.href = '/learn'
    } else {
      setShowOnboarding(true)
    }
  }

  function handleOnboardingDone() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
    window.location.href = '/learn'
  }

  return (
    <>
      <main className="min-h-screen bg-stone-50 overflow-x-hidden">

        {/* Hero */}
        <section className="bg-orange px-5 pt-12 pb-14 md:pt-20 md:pb-20">
          <div className="max-w-2xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-wide text-white/70 mb-3">
              For expats cycling in the Netherlands
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight leading-tight mb-4">
              Cycle safely in Dutch cities
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6 max-w-lg">
              A short preparation course for expats. 6 modules. Real scenarios. The rules that actually trip people up.
            </p>

            {/* Social proof */}
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5 mb-6">
              <span className="text-white/90 text-sm font-display">2,400+ expats ready to ride</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleStartLearning}
                className="!bg-white !text-orange hover:!bg-white/90"
              >
                Start learning →
              </Button>
            </div>
            <p className="text-white/60 text-xs mt-3 font-mono uppercase tracking-wide">
              2 free questions per module — no account needed
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-5 py-12 max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-xl text-stone-900 mb-6 lg:text-2xl">
            How it works
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {howItWorks.map(item => (
              <div key={item.step} className="bg-white border border-stone-200 rounded-xl p-4">
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-2">
                  Step {item.step}
                </span>
                <h3 className="font-display font-bold text-stone-900 mb-1">{item.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Module grid */}
        <section className="px-5 pb-12 max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-xl text-stone-900 mb-4 lg:text-2xl">
            6 modules
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {modules.map(mod => (
              <Link
                key={mod.id}
                href={`/learn/${mod.id}`}
                className={[
                  'bg-white border border-stone-200 rounded-xl p-4',
                  'hover:border-stone-400 hover:shadow-md transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
                ].join(' ')}
              >
                <span className="text-2xl block mb-1">{mod.emoji}</span>
                <p className="font-display font-bold text-sm text-stone-900">{mod.title}</p>
                <p className="text-xs text-stone-400 mt-0.5 font-mono uppercase tracking-wide">
                  2 free questions
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Foreigner callout */}
        <section className="bg-orange px-5 py-10 mx-5 mb-12 rounded-2xl max-w-5xl lg:mx-auto">
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight mb-2">
            Built for foreigners, not Dutch people
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-lg">
            Dutch cyclists learn this stuff as kids. You didn't. BikeReady targets exactly the rules that differ from what you already know — so you recalibrate fast and stay safe.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="px-5 pb-16 max-w-2xl mx-auto text-center">
          <Button
            variant="primary"
            size="lg"
            full
            onClick={handleStartLearning}
          >
            Start learning →
          </Button>
          <p className="text-stone-400 text-xs mt-2 font-mono uppercase tracking-wide">
            Full course €4.99 one-time · No subscription
          </p>
        </section>

      </main>

      {showOnboarding && <OnboardingOverlay onDone={handleOnboardingDone} />}
    </>
  )
}
