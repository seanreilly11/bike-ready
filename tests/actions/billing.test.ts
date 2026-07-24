import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser, isUserPremium, getOrCreateProviderCustomer } = vi.hoisted(() => ({
  getUser: vi.fn(),
  isUserPremium: vi.fn(),
  getOrCreateProviderCustomer: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/paddle/data", () => ({ isUserPremium }));
vi.mock("@/lib/paddle/checkout", () => ({ getOrCreateProviderCustomer }));

import { startCheckoutAction } from "@/lib/actions/billing";

describe("startCheckoutAction", () => {
  beforeEach(() => {
    getUser.mockReset();
    isUserPremium.mockReset();
    getOrCreateProviderCustomer.mockReset();
    process.env.NEXT_PUBLIC_PADDLE_PRICE_ID = "pri_test";
  });

  it("throws Unauthorized when there is no user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(startCheckoutAction()).rejects.toThrow(/unauthorized/i);
  });

  it("returns alreadyPremium without touching Paddle when premium", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } } });
    isUserPremium.mockResolvedValue(true);
    const res = await startCheckoutAction();
    expect(res).toEqual({ alreadyPremium: true });
    expect(getOrCreateProviderCustomer).not.toHaveBeenCalled();
  });

  it("returns the customer id and price id for a non-premium user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } } });
    isUserPremium.mockResolvedValue(false);
    getOrCreateProviderCustomer.mockResolvedValue("ctm_1");
    const res = await startCheckoutAction();
    expect(res).toEqual({ customerId: "ctm_1", priceId: "pri_test" });
    expect(getOrCreateProviderCustomer).toHaveBeenCalledWith("u1", "a@b.com");
  });

  it("throws when the price id env is missing", async () => {
    delete process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } } });
    isUserPremium.mockResolvedValue(false);
    await expect(startCheckoutAction()).rejects.toThrow(/not configured/i);
  });
});
