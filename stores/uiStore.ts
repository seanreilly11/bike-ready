import { create } from 'zustand'

export type AuthModalReason = 'save_progress' | 'upgrade'

interface UIState {
  showGate: boolean
  showAuth: boolean
  authReason: AuthModalReason | null
  newBadgeId: string | null
  showUpgradeToast: boolean
  onboardingDone: boolean
  showReturnBanner: boolean

  openGate: () => void
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
  showAuth: false,
  authReason: null,
  newBadgeId: null,
  showUpgradeToast: false,
  onboardingDone: false,
  showReturnBanner: true,

  openGate: () => set({ showGate: true }),
  closeGate: () => set({ showGate: false }),
  openAuth: (reason) => set({ showAuth: true, authReason: reason }),
  closeAuth: () => set({ showAuth: false }),
  showBadge: (badgeId) => set({ newBadgeId: badgeId }),
  clearBadge: () => set({ newBadgeId: null }),
  setUpgradeToast: (show) => set({ showUpgradeToast: show }),
  completeOnboarding: () => set({ onboardingDone: true }),
  dismissReturnBanner: () => set({ showReturnBanner: false }),
}))
