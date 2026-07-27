import { describe, it, expect } from "vitest";
import {
  moduleForProfile,
  planLine,
  RIDER_PROFILES,
  RIDING_TIMELINES,
} from "@/data/onboardingProfiles";

describe("onboardingProfiles", () => {
  it("maps each profile to its module", () => {
    expect(moduleForProfile("just_moved")).toBe("fundamentals");
    expect(moduleForProfile("commuter")).toBe("priority");
    expect(moduleForProfile("occasional")).toBe("signs");
  });

  it("builds a plan line from base + timeline clause", () => {
    expect(planLine("commuter", "this_week")).toBe(
      "Commuting? Right-of-way is where most near-misses happen - start there. You ride this week - let's move fast.",
    );
    expect(planLine("just_moved", "this_month")).toBe(
      "New here? Start with the fundamentals every Dutch cyclist knows.",
    );
  });

  it("has three profiles and three timelines", () => {
    expect(RIDER_PROFILES).toHaveLength(3);
    expect(RIDING_TIMELINES).toHaveLength(3);
  });
});
