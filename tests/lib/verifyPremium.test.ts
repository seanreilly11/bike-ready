import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/config", () => ({ PREMIUM_ENABLED: true }));

import verifyPremium from "@/lib/mutations/verifyPremium";
import { useAppStore } from "@/stores/appStore";

describe("verifyPremium", () => {
  beforeEach(() => {
    useAppStore.setState({ isPremium: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets premium in the store when the server confirms it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ is_premium: true })),
    );
    expect(await verifyPremium()).toBe(true);
    expect(useAppStore.getState().isPremium).toBe(true);
  });

  it("leaves the store alone when not premium", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ is_premium: false })),
    );
    expect(await verifyPremium()).toBe(false);
    expect(useAppStore.getState().isPremium).toBe(false);
  });

  it("returns false without throwing on an error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "boom" }, { status: 429 })),
    );
    expect(await verifyPremium()).toBe(false);
    expect(useAppStore.getState().isPremium).toBe(false);
  });
});
