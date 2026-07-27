import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUIStore } from "@/stores/uiStore";

const { getUser, track, refreshPremiumStatus, logError, startCheckoutAction, openAuth, checkoutOpen } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    track: vi.fn(),
    refreshPremiumStatus: vi.fn(),
    logError: vi.fn(),
    startCheckoutAction: vi.fn(),
    openAuth: vi.fn(),
    checkoutOpen: vi.fn(),
  }));

vi.mock("@/lib/supabase", () => ({ createClient: () => ({ auth: { getUser } }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ refreshPremiumStatus }) }));
vi.mock("@/hooks/useAnalytics", () => ({ useAnalytics: () => ({ track }) }));
vi.mock("@/hooks/usePaddle", () => ({ usePaddle: () => ({ Checkout: { open: checkoutOpen } }) }));
vi.mock("@/lib/actions/billing", () => ({ startCheckoutAction }));
vi.mock("@/lib/logger", () => ({ logError }));

import { useUnlock } from "@/hooks/useUnlock";

describe("useUnlock", () => {
  beforeEach(() => {
    getUser.mockReset();
    track.mockReset();
    refreshPremiumStatus.mockReset().mockResolvedValue(undefined);
    logError.mockReset();
    startCheckoutAction.mockReset();
    openAuth.mockReset();
    checkoutOpen.mockReset();
    useUIStore.setState({ checkoutError: null, openAuth });
  });

  it("opens the auth modal when there is no user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(openAuth).toHaveBeenCalledWith("upgrade");
    expect(startCheckoutAction).not.toHaveBeenCalled();
  });

  it("refreshes premium and tracks conversion when already premium", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    startCheckoutAction.mockResolvedValue({ alreadyPremium: true });
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(refreshPremiumStatus).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("gate_converted", {});
    expect(checkoutOpen).not.toHaveBeenCalled();
  });

  it("opens the Paddle overlay with the customer id and price id", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    startCheckoutAction.mockResolvedValue({ customerId: "ctm_1", priceId: "pri_1" });
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(track).toHaveBeenCalledWith("checkout_started", {});
    expect(checkoutOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ priceId: "pri_1", quantity: 1 }],
        customer: { id: "ctm_1" },
        settings: expect.objectContaining({ displayMode: "overlay", variant: "one-page" }),
      }),
    );
  });

  it("sets a checkout error in the ui store when the action throws", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    startCheckoutAction.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(useUIStore.getState().checkoutError).toMatch(/checkout/i);
    expect(logError).toHaveBeenCalled();
  });
});
