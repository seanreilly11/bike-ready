// Onboarding persistence. Kept on the legacy "onboarding_done" localStorage
// key so users who finished the old 3-screen flow are not re-onboarded.
// All access is guarded: environments that block storage must neither crash
// nor nag on every visit, so a failed read counts as done.

import type { RiderProfile, RidingTimeline } from "@/types";

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

const RIDER_PROFILE_KEY = "rider_profile";
const RIDING_TIMELINE_KEY = "riding_timeline";

const RIDER_PROFILE_VALUES: Set<string> = new Set([
  "just_moved",
  "commuter",
  "occasional",
]);
const RIDING_TIMELINE_VALUES: Set<string> = new Set([
  "this_week",
  "this_month",
  "exploring",
]);

export function getRiderProfile(): RiderProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(RIDER_PROFILE_KEY);
    return v && RIDER_PROFILE_VALUES.has(v) ? (v as RiderProfile) : null;
  } catch {
    return null;
  }
}

export function setRiderProfile(profile: RiderProfile): void {
  try {
    localStorage.setItem(RIDER_PROFILE_KEY, profile);
  } catch {
    // Storage blocked - the uiStore field still holds it for this session
  }
}

export function getRidingTimeline(): RidingTimeline | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(RIDING_TIMELINE_KEY);
    return v && RIDING_TIMELINE_VALUES.has(v) ? (v as RidingTimeline) : null;
  } catch {
    return null;
  }
}

export function setRidingTimeline(timeline: RidingTimeline): void {
  try {
    localStorage.setItem(RIDING_TIMELINE_KEY, timeline);
  } catch {
    // Storage blocked
  }
}
