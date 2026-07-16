import { create } from 'zustand'
import { markOnboardingDone, setRiderProfile, setRidingTimeline } from '@/lib/onboarding'
import type { ModuleId, RiderProfile, RidingTimeline } from '@/types'

export type AuthModalReason = 'save_progress' | 'upgrade'

interface UIState {
  showGate: boolean
  gateModuleId: ModuleId | null
  showAuth: boolean
  authReason: AuthModalReason | null
  newBadgeId: string | null
  showUpgradeToast: boolean
  onboardingDone: boolean
  riderProfile: RiderProfile | null
  ridingTimeline: RidingTimeline | null
  showReturnBanner: boolean
  checkoutError: string | null

  openGate: (moduleId?: ModuleId) => void
  closeGate: () => void
  openAuth: (reason: AuthModalReason) => void
  closeAuth: () => void
  showBadge: (badgeId: string) => void
  clearBadge: () => void
  setUpgradeToast: (show: boolean) => void
  completeOnboarding: (choices?: { profile: RiderProfile; timeline: RidingTimeline }) => void
  dismissReturnBanner: () => void
  setCheckoutError: (message: string | null) => void
}

export const useUIStore = create<UIState>()((set) => ({
  showGate: false,
  gateModuleId: null,
  showAuth: false,
  authReason: null,
  newBadgeId: null,
  showUpgradeToast: false,
  onboardingDone: false,
  riderProfile: null,
  ridingTimeline: null,
  showReturnBanner: true,
  checkoutError: null,

  openGate: (moduleId) => set({ showGate: true, gateModuleId: moduleId ?? null }),
  closeGate: () => set({ showGate: false, gateModuleId: null }),
  openAuth: (reason) => set({ showAuth: true, authReason: reason }),
  closeAuth: () => set({ showAuth: false }),
  showBadge: (badgeId) => set({ newBadgeId: badgeId }),
  clearBadge: () => set({ newBadgeId: null }),
  setUpgradeToast: (show) => set({ showUpgradeToast: show }),
  completeOnboarding: (choices) => {
    markOnboardingDone()
    if (choices) {
      setRiderProfile(choices.profile)
      setRidingTimeline(choices.timeline)
      set({
        onboardingDone: true,
        riderProfile: choices.profile,
        ridingTimeline: choices.timeline,
      })
    } else {
      set({ onboardingDone: true })
    }
  },
  dismissReturnBanner: () => set({ showReturnBanner: false }),
  setCheckoutError: (message) => set({ checkoutError: message }),
}))
