import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  constructEvent,
  updateEq,
  update,
  selectSingle,
  headersGet,
  captureServerEvent,
} = vi.hoisted(() => {
  const updateEq = vi.fn();
  const selectSingle = vi.fn();
  return {
    constructEvent: vi.fn(),
    updateEq,
    update: vi.fn(() => ({ eq: updateEq })),
    selectSingle,
    headersGet: vi.fn(),
    captureServerEvent: vi.fn(),
  };
});

vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent };
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      update,
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: selectSingle })) })),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: headersGet })),
}));

vi.mock("@/lib/posthogServer", () => ({ captureServerEvent }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));

import { POST } from "@/app/api/stripe/webhook/route";
import type { NextRequest } from "next/server";

function webhookRequest(): NextRequest {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: "{}",
  }) as unknown as NextRequest;
}

const paidSession = {
  metadata: { supabase_user_id: "user_123" },
  customer: "cus_1",
  payment_intent: "pi_1",
  amount_total: 499,
  currency: "eur",
  payment_status: "paid",
};

const completedEvent = {
  type: "checkout.session.completed",
  data: { object: paidSession },
};

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    constructEvent.mockReset();
    update.mockClear();
    updateEq.mockReset();
    // Default: profile not yet premium, so the paid-session path proceeds.
    selectSingle.mockReset().mockResolvedValue({ data: { is_premium: false } });
    headersGet.mockReset();
    captureServerEvent.mockReset();
  });

  it("returns 400 when the signature header is missing", async () => {
    headersGet.mockReturnValue(null);
    const res = await POST(webhookRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when the signature is invalid", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when the session has no user id", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: {} } },
    });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(400);
  });

  it("grants premium and fires the purchase event on success", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue(completedEvent);
    updateEq.mockResolvedValue({ error: null });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_premium: true }),
    );
    expect(captureServerEvent).toHaveBeenCalledWith(
      "user_123",
      "purchase_completed",
      expect.any(Object),
    );
  });

  it("is idempotent: skips update and event when already premium", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue(completedEvent);
    selectSingle.mockResolvedValue({ data: { is_premium: true } });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("returns 500 when the database update fails", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue(completedEvent);
    updateEq.mockResolvedValue({ error: { message: "db down" } });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(500);
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("does not grant premium when the session is completed but not yet paid", async () => {
    // Async payment methods (SEPA, bank transfer) fire completed with
    // payment_status "unpaid" - money hasn't arrived yet.
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { ...paidSession, payment_status: "unpaid" } },
    });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("grants premium when the async payment later succeeds", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue({
      type: "checkout.session.async_payment_succeeded",
      data: { object: paidSession },
    });
    updateEq.mockResolvedValue({ error: null });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_premium: true }),
    );
  });

  it("ignores unrelated event types with a 200", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue({ type: "payment_intent.created", data: { object: {} } });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });
});
