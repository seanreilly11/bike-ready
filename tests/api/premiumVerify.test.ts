import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser, isRateLimited, isUserPremium, getProviderCustomerId, grant, transactionsList, captureServerEvent } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    isRateLimited: vi.fn(),
    isUserPremium: vi.fn(),
    getProviderCustomerId: vi.fn(),
    grant: vi.fn(),
    transactionsList: vi.fn(),
    captureServerEvent: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/cooldown", () => ({ isRateLimited }));
vi.mock("@/lib/paddle/data", () => ({
  isUserPremium,
  getProviderCustomerId,
  grantPremiumByProviderCustomerId: grant,
}));
vi.mock("@/lib/paddle/paddle", () => ({
  getPaddle: () => ({ transactions: { list: transactionsList } }),
}));
vi.mock("@/lib/posthogServer", () => ({ captureServerEvent }));

import { GET } from "@/app/api/premium/verify/route";
import type { NextRequest } from "next/server";

function req(): NextRequest {
  return { nextUrl: { searchParams: new URLSearchParams() } } as unknown as NextRequest;
}
function asyncIterableOf<T>(items: T[]) {
  return { async *[Symbol.asyncIterator]() { for (const i of items) yield i; } };
}

describe("GET /api/premium/verify", () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    isRateLimited.mockReset().mockReturnValue(false);
    isUserPremium.mockReset();
    getProviderCustomerId.mockReset();
    grant.mockReset();
    transactionsList.mockReset();
    captureServerEvent.mockReset();
    process.env.PADDLE_PRICE_ID = "pri_test";
  });

  it("returns 401 when unauthenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("short-circuits true when already premium", async () => {
    isUserPremium.mockResolvedValue(true);
    const res = await GET(req());
    expect(await res.json()).toEqual({ is_premium: true });
    expect(transactionsList).not.toHaveBeenCalled();
  });

  it("returns false when there is no Paddle customer mapping", async () => {
    isUserPremium.mockResolvedValue(false);
    getProviderCustomerId.mockResolvedValue(null);
    const res = await GET(req());
    expect(await res.json()).toEqual({ is_premium: false });
  });

  it("grants and returns true when a completed transaction for our price exists", async () => {
    isUserPremium.mockResolvedValue(false);
    getProviderCustomerId.mockResolvedValue("ctm_1");
    transactionsList.mockReturnValue(
      asyncIterableOf([
        {
          id: "txn_1",
          currencyCode: "EUR",
          items: [{ price: { id: "pri_test" } }],
          details: { totals: { total: "499" } },
        },
      ]),
    );
    grant.mockResolvedValue({ granted: true, userId: "u1" });
    const res = await GET(req());
    expect(await res.json()).toEqual({ is_premium: true });
    expect(grant).toHaveBeenCalledWith("ctm_1", { transactionId: "txn_1" });
    expect(captureServerEvent).toHaveBeenCalled();
  });

  it("does NOT grant for a completed transaction on a different price (shared account)", async () => {
    isUserPremium.mockResolvedValue(false);
    getProviderCustomerId.mockResolvedValue("ctm_1");
    transactionsList.mockReturnValue(
      asyncIterableOf([{ id: "txn_sibling", currencyCode: "EUR", items: [{ price: { id: "pri_other" } }] }]),
    );
    const res = await GET(req());
    expect(await res.json()).toEqual({ is_premium: false });
    expect(grant).not.toHaveBeenCalled();
  });

  it("returns false when the customer has no completed transaction", async () => {
    isUserPremium.mockResolvedValue(false);
    getProviderCustomerId.mockResolvedValue("ctm_1");
    transactionsList.mockReturnValue(asyncIterableOf([]));
    const res = await GET(req());
    expect(await res.json()).toEqual({ is_premium: false });
  });
});
