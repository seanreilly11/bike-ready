import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  getUser,
  single,
  updateEq,
  paymentIntentsList,
  sessionRetrieve,
  isRateLimited,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
  updateEq: vi.fn(),
  paymentIntentsList: vi.fn(),
  sessionRetrieve: vi.fn(),
  isRateLimited: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class {
    paymentIntents = { list: paymentIntentsList };
    checkout = { sessions: { retrieve: sessionRetrieve } };
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

const req = (qs = "") =>
  new NextRequest(`http://localhost:3000/api/premium/verify${qs}`);

async function body(res: Response) {
  return (await res.json()) as { is_premium?: boolean; error?: string };
}

describe("GET /api/premium/verify", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
    updateEq.mockReset().mockResolvedValue({ error: null });
    paymentIntentsList.mockReset();
    sessionRetrieve.mockReset();
    isRateLimited.mockReset().mockReturnValue(false);
  });

  it("returns 401 when not authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    isRateLimited.mockReturnValue(true);
    const res = await GET(req());
    expect(res.status).toBe(429);
  });

  it("short-circuits to premium when the profile is already premium", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { is_premium: true } });
    const res = await GET(req());
    expect(await body(res)).toEqual({ is_premium: true });
    expect(paymentIntentsList).not.toHaveBeenCalled();
  });

  it("returns false when there is no Stripe customer", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({
      data: { is_premium: false, stripe_customer_id: null },
    });
    const res = await GET(req());
    expect(await body(res)).toEqual({ is_premium: false });
    expect(paymentIntentsList).not.toHaveBeenCalled();
  });

  it("grants premium when Stripe shows a succeeded payment", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({
      data: { is_premium: false, stripe_customer_id: "cus_1" },
    });
    paymentIntentsList.mockResolvedValue({ data: [{ status: "succeeded" }] });
    const res = await GET(req());
    expect(await body(res)).toEqual({ is_premium: true });
    expect(updateEq).toHaveBeenCalled();
  });

  it("stays non-premium when no payment has succeeded", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({
      data: { is_premium: false, stripe_customer_id: "cus_1" },
    });
    paymentIntentsList.mockResolvedValue({
      data: [{ status: "requires_payment_method" }],
    });
    const res = await GET(req());
    expect(await body(res)).toEqual({ is_premium: false });
    expect(updateEq).not.toHaveBeenCalled();
  });

  it("grants premium from a paid session id when no customer is stored", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({
      data: { is_premium: false, stripe_customer_id: null },
    });
    sessionRetrieve.mockResolvedValue({
      metadata: { supabase_user_id: "u1" },
      payment_status: "paid",
      customer: "cus_1",
      payment_intent: "pi_1",
    });
    const res = await GET(req("?session_id=cs_123"));
    expect(await body(res)).toEqual({ is_premium: true });
    expect(sessionRetrieve).toHaveBeenCalledWith("cs_123");
    expect(updateEq).toHaveBeenCalled();
  });

  it("rejects a session that belongs to another user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({
      data: { is_premium: false, stripe_customer_id: null },
    });
    sessionRetrieve.mockResolvedValue({
      metadata: { supabase_user_id: "someone-else" },
      payment_status: "paid",
      customer: "cus_1",
      payment_intent: "pi_1",
    });
    const res = await GET(req("?session_id=cs_123"));
    expect(await body(res)).toEqual({ is_premium: false });
    expect(updateEq).not.toHaveBeenCalled();
  });

  it("rejects an unpaid session", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({
      data: { is_premium: false, stripe_customer_id: null },
    });
    sessionRetrieve.mockResolvedValue({
      metadata: { supabase_user_id: "u1" },
      payment_status: "unpaid",
      customer: "cus_1",
      payment_intent: null,
    });
    const res = await GET(req("?session_id=cs_123"));
    expect(await body(res)).toEqual({ is_premium: false });
    expect(updateEq).not.toHaveBeenCalled();
  });
});
