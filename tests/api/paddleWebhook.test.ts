import { describe, it, expect, vi, beforeEach } from "vitest";

const { unmarshal, grant, captureServerEvent, headersGet } = vi.hoisted(() => ({
  unmarshal: vi.fn(),
  grant: vi.fn(),
  captureServerEvent: vi.fn(),
  headersGet: vi.fn(),
}));

vi.mock("@/lib/paddle/config", () => ({ isPaddleConfigured: () => true }));
vi.mock("@/lib/paddle/paddle", () => ({
  getPaddle: () => ({ webhooks: { unmarshal } }),
}));
vi.mock("@/lib/paddle/data", () => ({
  billingWriter: { grantPremiumByProviderCustomerId: grant },
}));
vi.mock("@/lib/posthogServer", () => ({ captureServerEvent }));

import { POST } from "@/app/api/paddle/webhook/route";
import type { NextRequest } from "next/server";

function req(body = "{}"): NextRequest {
  return {
    headers: { get: headersGet },
    text: async () => body,
  } as unknown as NextRequest;
}

const completed = {
  eventType: "transaction.completed",
  data: {
    id: "txn_1",
    customerId: "ctm_1",
    currencyCode: "EUR",
    details: { totals: { total: "499" } },
  },
};

describe("POST /api/paddle/webhook", () => {
  beforeEach(() => {
    unmarshal.mockReset();
    grant.mockReset();
    captureServerEvent.mockReset();
    headersGet.mockReset().mockReturnValue("ts=1;h1=abc");
    process.env.PADDLE_WEBHOOK_SECRET = "whsec";
  });

  it("returns 400 when the signature header is missing", async () => {
    headersGet.mockReturnValue(null);
    const res = await POST(req());
    expect(res.status).toBe(400);
  });

  it("returns 400 when unmarshal throws (bad signature)", async () => {
    unmarshal.mockRejectedValue(new Error("bad sig"));
    const res = await POST(req());
    expect(res.status).toBe(400);
  });

  it("grants premium and fires the revenue event on transaction.completed", async () => {
    unmarshal.mockResolvedValue(completed);
    grant.mockResolvedValue({ granted: true, userId: "user_1" });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(grant).toHaveBeenCalledWith("ctm_1", { transactionId: "txn_1" });
    expect(captureServerEvent).toHaveBeenCalledWith(
      "user_1",
      "purchase_completed",
      expect.objectContaining({ currency: "EUR" }),
    );
  });

  it("does not fire the revenue event on an idempotent no-op grant", async () => {
    unmarshal.mockResolvedValue(completed);
    grant.mockResolvedValue({ granted: false, userId: "user_1" });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("returns 200 for an unknown event type without granting", async () => {
    unmarshal.mockResolvedValue({ eventType: "ping.test", data: { id: "x" } });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(grant).not.toHaveBeenCalled();
  });

  it("returns 500 when the writer throws (Paddle will retry)", async () => {
    unmarshal.mockResolvedValue(completed);
    grant.mockRejectedValue(new Error("db down"));
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(captureServerEvent).not.toHaveBeenCalled();
  });
});
