import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from '@/stores/uiStore'

function resetStore() {
  useUIStore.setState({
    showGate: false,
    showAuth: false,
    authReason: null,
    newBadgeId: null,
    showUpgradeToast: false,
    onboardingDone: false,
    showReturnBanner: true,
  })
}

describe('uiStore', () => {
  beforeEach(resetStore)

  describe('openAuth / closeAuth', () => {
    it('openAuth sets showAuth true and stores reason', () => {
      useUIStore.getState().openAuth('save_progress')
      expect(useUIStore.getState().showAuth).toBe(true)
      expect(useUIStore.getState().authReason).toBe('save_progress')
    })

    it('openAuth with upgrade reason', () => {
      useUIStore.getState().openAuth('upgrade')
      expect(useUIStore.getState().authReason).toBe('upgrade')
    })

    it('closeAuth sets showAuth false but does not clear reason', () => {
      useUIStore.getState().openAuth('upgrade')
      useUIStore.getState().closeAuth()
      expect(useUIStore.getState().showAuth).toBe(false)
      expect(useUIStore.getState().authReason).toBe('upgrade')
    })
  })

  describe('openGate / closeGate', () => {
    it('openGate sets showGate true', () => {
      useUIStore.getState().openGate()
      expect(useUIStore.getState().showGate).toBe(true)
    })

    it('closeGate sets showGate false', () => {
      useUIStore.getState().openGate()
      useUIStore.getState().closeGate()
      expect(useUIStore.getState().showGate).toBe(false)
    })
  })

  describe('badge', () => {
    it('showBadge sets newBadgeId', () => {
      useUIStore.getState().showBadge('badge_priority')
      expect(useUIStore.getState().newBadgeId).toBe('badge_priority')
    })

    it('clearBadge sets newBadgeId to null', () => {
      useUIStore.getState().showBadge('badge_priority')
      useUIStore.getState().clearBadge()
      expect(useUIStore.getState().newBadgeId).toBeNull()
    })
  })

  describe('onboarding / returnBanner', () => {
    it('completeOnboarding sets onboardingDone true', () => {
      useUIStore.getState().completeOnboarding()
      expect(useUIStore.getState().onboardingDone).toBe(true)
    })

    it('completeOnboarding persists to localStorage', () => {
      localStorage.clear()
      useUIStore.getState().completeOnboarding()
      expect(localStorage.getItem('onboarding_done')).toBe('true')
    })

    it('dismissReturnBanner sets showReturnBanner false', () => {
      useUIStore.getState().dismissReturnBanner()
      expect(useUIStore.getState().showReturnBanner).toBe(false)
    })
  })

  describe('upgradeToast', () => {
    it('setUpgradeToast(true) shows toast', () => {
      useUIStore.getState().setUpgradeToast(true)
      expect(useUIStore.getState().showUpgradeToast).toBe(true)
    })

    it('setUpgradeToast(false) hides toast', () => {
      useUIStore.getState().setUpgradeToast(true)
      useUIStore.getState().setUpgradeToast(false)
      expect(useUIStore.getState().showUpgradeToast).toBe(false)
    })
  })
})
