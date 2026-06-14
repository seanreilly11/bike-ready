'use client'

import { useState } from 'react'
import { Bike, Lightbulb, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAnalytics } from '@/hooks/useAnalytics'

interface OnboardingOverlayProps {
  onDone: () => void
}

const screens = [
  {
    icon: Bike,
    title: 'Welcome to BikeReady',
    body: 'A short preparation course for expats cycling in Dutch cities. Not a habit app — a one-time reset of your cycling instincts for the Netherlands.',
  },
  {
    icon: Lightbulb,
    title: 'How it works',
    body: 'You\'re dropped into a real cycling moment. Make a call based on instinct. The feedback confirms or corrects your mental model. The question is the lesson.',
  },
  {
    icon: Bike,
    title: 'Start here first',
    body: 'Begin with Fundamentals — it\'s free and covers the essential rules every cyclist needs before anything else. Then work through the other modules at your own pace.',
  },
]

export default function OnboardingOverlay({ onDone }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0)
  const { track } = useAnalytics()
  const isLast = step === screens.length - 1
  const screen = screens[step]
  const StepIcon = screen.icon

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" aria-hidden />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-sm p-6 pb-8 animate-fade-up"
      >

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {screens.map((_, i) => (
            <div
              key={i}
              className={[
                'h-1.5 rounded-full transition-[width] duration-300',
                i === step ? 'w-6 bg-orange' : 'w-1.5 bg-stone-200',
              ].join(' ')}
            />
          ))}
        </div>

        <div key={step} className="text-center mb-6 animate-fade-up">
          <div className="mb-3 flex justify-center">
            <StepIcon size={48} className="text-orange" aria-hidden="true" />
          </div>
          <h2 id="onboarding-title" className="font-display font-extrabold text-xl text-stone-900 mb-2">
            {screen.title}
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed">{screen.body}</p>
        </div>

        <Button
          variant="primary"
          size="lg"
          full
          onClick={() => {
            if (isLast) {
              track('onboarding_completed', {})
              onDone()
            } else {
              setStep(s => s + 1)
            }
          }}
        >
          {isLast ? <><span>Start learning</span><ArrowRight size={16} aria-hidden="true" /></> : 'Next'}
        </Button>

        {step === 0 && (
          <div className="flex justify-center mt-3">
            <Button variant="ghost" size="sm" onClick={() => { track('onboarding_skipped', {}); onDone(); }}>
              Skip
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
