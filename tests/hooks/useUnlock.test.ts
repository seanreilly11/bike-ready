import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUIStore } from "@/stores/uiStore";

const { getUser, track, refreshPremiumStatus, logError } = vi.hoisted(() => ({
  getUser: vi.fn(),
  track: vi.fn(),
  refreshPremiumStatus: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({ auth: { getUser } }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ refreshPremiumStatus }),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track }),
}));

vi.mock("@/lib/logger", () => ({ logError }));

import { useUnlock } from "@/hooks/useUnlock";

describe("useUnlock", () => {
  beforeEach(() => {
    getUser.mockReset();
    track.mockReset();
    refreshPremiumStatus.mockReset().mockResolvedValue(undefined);
    logError.mockReset();
    vi.unstubAllGlobals();
    useUIStore.setState({ checkoutError: null });
  });

  it("does not throw when the checkout API returns an error response", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Too many requests", { status: 429 })),
    );

    const { result } = renderHook(() => useUnlock());
    await expect(result.current()).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith("checkout_started", {});
  });

  it("does not throw when the response is ok but has no url", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({})),
    );

    const { result } = renderHook(() => useUnlock());
    await expect(result.current()).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });

  it("refreshes premium and tracks conversion when already premium", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ alreadyPremium: true })),
    );

    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(refreshPremiumStatus).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("gate_converted", {});
  });

  it("sets a checkout error in the ui store when the request fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );

    const { result } = renderHook(() => useUnlock());
    await act(async () => {
      await result.current();
    });

    expect(useUIStore.getState().checkoutError).toMatch(/checkout/i);
  });
});
