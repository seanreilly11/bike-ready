import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser, single, sessionsCreate, isRateLimited, logError } = vi.hoisted(
  () => ({
    getUser: vi.fn(),
    single: vi.fn(),
    sessionsCreate: vi.fn(),
    isRateLimited: vi.fn(),
    logError: vi.fn(),
  }),
);

vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: sessionsCreate } };
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
    })),
  },
}));

vi.mock("@/lib/cooldown", () => ({ isRateLimited }));
vi.mock("@/lib/logger", () => ({ logError }));

import { POST } from "@/app/api/checkout/route";

describe("POST /api/checkout", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
    sessionsCreate.mockReset();
    isRateLimited.mockReset().mockReturnValue(false);
    logError.mockReset();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID", "price_x");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_REDIRECT_URL", "http://localhost:3000");
  });

  it("returns 401 when not authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("creates the session with customer_creation always so premium can be reconciled later", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.com" } },
    });
    single.mockResolvedValue({ data: { is_premium: false } });
    sessionsCreate.mockResolvedValue({ url: "https://stripe.test/session" });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_creation: "always",
        metadata: { supabase_user_id: "u1" },
      }),
    );
  });

  it("returns 500 and logs when Stripe session creation fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.com" } },
    });
    single.mockResolvedValue({ data: { is_premium: false } });
    sessionsCreate.mockRejectedValue(new Error("stripe down"));

    const res = await POST();

    expect(res.status).toBe(500);
    expect(logError).toHaveBeenCalled();
  });

  it("puts the session id on the success_url for reconciliation", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.com" } },
    });
    single.mockResolvedValue({ data: { is_premium: false } });
    sessionsCreate.mockResolvedValue({ url: "https://stripe.test/session" });

    await POST();

    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url:
          "http://localhost:3000/learn?upgraded=true&session_id={CHECKOUT_SESSION_ID}",
      }),
    );
  });
});
