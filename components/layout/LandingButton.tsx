'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import OnboardingOverlay from '@/components/layout/OnboardingOverlay'
import { useAnalytics } from '@/hooks/useAnalytics'

const ONBOARDING_KEY = 'bikeready_onboarding_done'

interface LandingButtonProps {
  variant?: 'hero' | 'bottom'
  label?: string
  className?: string
}

export default function LandingButton({
  variant = 'hero',
  label = 'Start learning →',
  className,
}: LandingButtonProps) {
  const router = useRouter()
  const { track } = useAnalytics()
  const [showOnboarding, setShowOnboarding] = useState(false)

  function handleStart() {
    track('cta_clicked', { source: variant === 'bottom' ? 'bottom' : 'hero' })
    if (localStorage.getItem(ONBOARDING_KEY) === 'true') {
      router.push('/learn')
    } else {
      setShowOnboarding(true)
    }
  }

  function handleOnboardingDone() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
    router.push('/learn')
  }

  return (
    <>
      <Button
        variant={variant === 'bottom' ? 'primary' : 'secondary'}
        size="lg"
        full={variant === 'bottom'}
        onClick={handleStart}
        className={className}
      >
        {label}
      </Button>
      {showOnboarding && <OnboardingOverlay onDone={handleOnboardingDone} />}
    </>
  )
}
