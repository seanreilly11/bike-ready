import { create } from 'zustand'
import { markOnboardingDone } from '@/lib/onboarding'
import type { ModuleId } from '@/types'

export type AuthModalReason = 'save_progress' | 'upgrade'

interface UIState {
  showGate: boolean
  gateModuleId: ModuleId | null
  showAuth: boolean
  authReason: AuthModalReason | null
  newBadgeId: string | null
  showUpgradeToast: boolean
  onboardingDone: boolean
  showReturnBanner: boolean

  openGate: (moduleId?: ModuleId) => void
  closeGate: () => void
  openAuth: (reason: AuthModalReason) => void
  closeAuth: () => void
  showBadge: (badgeId: string) => void
  clearBadge: () => void
  setUpgradeToast: (show: boolean) => void
  completeOnboarding: () => void
  dismissReturnBanner: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  showGate: false,
  gateModuleId: null,
  showAuth: false,
  authReason: null,
  newBadgeId: null,
  showUpgradeToast: false,
  onboardingDone: false,
  showReturnBanner: true,

  openGate: (moduleId) => set({ showGate: true, gateModuleId: moduleId ?? null }),
  closeGate: () => set({ showGate: false, gateModuleId: null }),
  openAuth: (reason) => set({ showAuth: true, authReason: reason }),
  closeAuth: () => set({ showAuth: false }),
  showBadge: (badgeId) => set({ newBadgeId: badgeId }),
  clearBadge: () => set({ newBadgeId: null }),
  setUpgradeToast: (show) => set({ showUpgradeToast: show }),
  completeOnboarding: () => {
    markOnboardingDone()
    set({ onboardingDone: true })
  },
  dismissReturnBanner: () => set({ showReturnBanner: false }),
}))
