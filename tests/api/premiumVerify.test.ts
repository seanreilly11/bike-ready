import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser, single, updateEq, paymentIntentsList, isRateLimited } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    single: vi.fn(),
    updateEq: vi.fn(),
    paymentIntentsList: vi.fn(),
    isRateLimited: vi.fn(),
  }));

vi.mock("stripe", () => ({
  default: class {
    paymentIntents = { list: paymentIntentsList };
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
      update: vi.fn(() => ({ eq: updateEq })),
    })),
  },
}));

vi.mock("@/lib/cooldown", () => ({ isRateLimited }));

import { GET } from "@/app/api/premium/verify/route";

async function body(res: Response) {
  return (await res.json()) as { is_premium?: boolean; error?: string };
}

describe("GET /api/premium/verify", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
    updateEq.mockReset().mockResolvedValue({ error: null });
    paymentIntentsList.mockReset();
    isRateLimited.mockReset().mockReturnValue(false);
  });

  it("returns 401 when not authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    isRateLimited.mockReturnValue(true);
    const res = await GET();
    expect(res.status).toBe(429);
  });

  it("short-circuits to premium when the profile is already premium", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { is_premium: true } });
    const res = await GET();
    expect(await body(res)).toEqual({ is_premium: true });
    expect(paymentIntentsList).not.toHaveBeenCalled();
  });

  it("returns false when there is no Stripe customer", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { is_premium: false, stripe_customer_id: null } });
    const res = await GET();
    expect(await body(res)).toEqual({ is_premium: false });
    expect(paymentIntentsList).not.toHaveBeenCalled();
  });

  it("grants premium when Stripe shows a succeeded payment", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { is_premium: false, stripe_customer_id: "cus_1" } });
    paymentIntentsList.mockResolvedValue({ data: [{ status: "succeeded" }] });
    const res = await GET();
    expect(await body(res)).toEqual({ is_premium: true });
    expect(updateEq).toHaveBeenCalled();
  });

  it("stays non-premium when no payment has succeeded", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { is_premium: false, stripe_customer_id: "cus_1" } });
    paymentIntentsList.mockResolvedValue({ data: [{ status: "requires_payment_method" }] });
    const res = await GET();
    expect(await body(res)).toEqual({ is_premium: false });
    expect(updateEq).not.toHaveBeenCalled();
  });
});
