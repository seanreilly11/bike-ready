'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface OnboardingOverlayProps {
  onDone: () => void
}

const screens = [
  {
    emoji: '🚲',
    title: 'Welcome to BikeReady',
    body: 'A short preparation course for expats cycling in Dutch cities. Not a habit app — a one-time reset of your cycling instincts for the Netherlands.',
  },
  {
    emoji: '💡',
    title: 'How it works',
    body: 'You\'re dropped into a real cycling moment. Make a call based on instinct. The feedback confirms or corrects your mental model. The question is the lesson.',
  },
  {
    emoji: '⚡',
    title: 'Where to start',
    body: 'Start with Priority Rules — right-before-left and shark teeth are the most common causes of near-misses. Then follow whichever module matches your next cycling challenge.',
  },
]

export default function OnboardingOverlay({ onDone }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0)
  const isLast = step === screens.length - 1
  const screen = screens[step]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" aria-hidden />

      {/* Card */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-sm p-6 pb-8 animate-fade-up">

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

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{screen.emoji}</div>
          <h2 className="font-display font-extrabold text-xl text-stone-900 mb-2">
            {screen.title}
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed">{screen.body}</p>
        </div>

        <Button
          variant="primary"
          size="lg"
          full
          onClick={() => isLast ? onDone() : setStep(s => s + 1)}
        >
          {isLast ? 'Start learning →' : 'Next'}
        </Button>

        {step === 0 && (
          <div className="flex justify-center mt-3">
            <Button variant="ghost" size="sm" onClick={onDone}>
              Skip
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
