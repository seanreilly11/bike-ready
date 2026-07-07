'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import OnboardingOverlay from '@/components/layout/OnboardingOverlay'
import { useAnalytics } from '@/hooks/useAnalytics'
import { getStoredVariant, HERO_COPY_TEST } from '@/lib/abTest'
import { isOnboardingDone } from '@/lib/onboarding'

interface LandingButtonProps {
  variant?: 'hero' | 'bottom'
  size?: 'sm' | 'lg'
  buttonVariant?: 'primary' | 'secondary'
  label?: string
  className?: string
}

export default function LandingButton({
  variant = 'hero',
  size = 'lg',
  buttonVariant,
  label = 'Start learning',
  className,
}: LandingButtonProps) {
  const router = useRouter()
  const { track } = useAnalytics()
  const [showOnboarding, setShowOnboarding] = useState(false)

  function handleStart() {
    track('cta_clicked', {
      source: variant === 'bottom' ? 'bottom' : 'hero',
      hero_variant: getStoredVariant(HERO_COPY_TEST),
    })
    if (isOnboardingDone()) {
      router.push('/learn')
    } else {
      setShowOnboarding(true)
    }
  }

  return (
    <>
      <Button
        variant={buttonVariant ?? (variant === 'bottom' ? 'primary' : 'secondary')}
        size={size}
        full={variant === 'bottom'}
        onClick={handleStart}
        className={className}
      >
        {label} <ArrowRight size={16} aria-hidden="true" />
      </Button>
      {showOnboarding && (
        <OnboardingOverlay
          ctaLabel="Start Fundamentals"
          onComplete={() => router.push('/learn/fundamentals')}
          onSkip={() => {
            // They still clicked "Start learning" - take them to the index
            setShowOnboarding(false)
            router.push('/learn')
          }}
        />
      )}
    </>
  )
}
