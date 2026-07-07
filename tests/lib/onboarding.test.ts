import { beforeEach, describe, expect, it, vi } from "vitest";
import { isOnboardingDone, markOnboardingDone } from "@/lib/onboarding";

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
