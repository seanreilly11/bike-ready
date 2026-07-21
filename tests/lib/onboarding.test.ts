import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isOnboardingDone,
  markOnboardingDone,
  getRiderProfile,
  setRiderProfile,
  getRidingTimeline,
  setRidingTimeline,
} from "@/lib/onboarding";

describe("onboarding storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is not done by default", () => {
    expect(isOnboardingDone()).toBe(false);
  });

  it("is done after marking", () => {
    markOnboardingDone();
    expect(isOnboardingDone()).toBe(true);
  });

  it("uses the legacy onboarding_done key so existing users are not re-onboarded", () => {
    localStorage.setItem("onboarding_done", "true");
    expect(isOnboardingDone()).toBe(true);
  });

  it("treats blocked storage as done instead of throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage);
    expect(isOnboardingDone()).toBe(true);
    vi.unstubAllGlobals();
  });

  it("does not throw when writing to blocked storage", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage);
    expect(() => markOnboardingDone()).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("rider profile persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a stored profile and timeline", () => {
    setRiderProfile("commuter");
    setRidingTimeline("this_week");
    expect(getRiderProfile()).toBe("commuter");
    expect(getRidingTimeline()).toBe("this_week");
  });

  it("returns null when nothing is stored", () => {
    expect(getRiderProfile()).toBeNull();
    expect(getRidingTimeline()).toBeNull();
  });

  it("returns null for an unrecognised stored value", () => {
    localStorage.setItem("rider_profile", "astronaut");
    localStorage.setItem("riding_timeline", "someday");
    expect(getRiderProfile()).toBeNull();
    expect(getRidingTimeline()).toBeNull();
  });
});
