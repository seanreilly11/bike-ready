// Onboarding persistence. Kept on the legacy "onboarding_done" localStorage
// key so users who finished the old 3-screen flow are not re-onboarded.
// All access is guarded: environments that block storage must neither crash
// nor nag on every visit, so a failed read counts as done.

const ONBOARDING_KEY = "onboarding_done";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return true;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Storage blocked - the uiStore flag still hides it for this session
  }
}
