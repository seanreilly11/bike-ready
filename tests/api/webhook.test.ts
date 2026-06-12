import { describe, it, expect, vi, beforeEach } from "vitest";

const { constructEvent, updateEq, update, headersGet, captureServerEvent } =
  vi.hoisted(() => {
    const updateEq = vi.fn();
    return {
      constructEvent: vi.fn(),
      updateEq,
      update: vi.fn(() => ({ eq: updateEq })),
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
  supabaseAdmin: { from: vi.fn(() => ({ update })) },
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

const completedEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: { supabase_user_id: "user_123" },
      customer: "cus_1",
      payment_intent: "pi_1",
      amount_total: 499,
      currency: "eur",
    },
  },
};

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    constructEvent.mockReset();
    update.mockClear();
    updateEq.mockReset();
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

  it("returns 500 when the database update fails", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue(completedEvent);
    updateEq.mockResolvedValue({ error: { message: "db down" } });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(500);
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("ignores unrelated event types with a 200", async () => {
    headersGet.mockReturnValue("sig");
    constructEvent.mockReturnValue({ type: "payment_intent.created", data: { object: {} } });
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });
});
