import { describe, it, expect, vi } from "vitest";
import { handlePaddleEvent, type PaddleEventLike, type BillingWriter } from "@/lib/paddle/webhook";

function fakeWriter(result = { granted: true, userId: "user_1" }): BillingWriter & {
  grantPremiumByProviderCustomerId: ReturnType<typeof vi.fn>;
} {
  return { grantPremiumByProviderCustomerId: vi.fn().mockResolvedValue(result) };
}

const completed: PaddleEventLike = {
  eventType: "transaction.completed",
  data: {
    id: "txn_1",
    customerId: "ctm_1",
    currencyCode: "EUR",
    details: { totals: { total: "499" } },
  },
};

describe("handlePaddleEvent", () => {
  it("grants premium on transaction.completed, keyed by customer id", async () => {
    const writer = fakeWriter();
    const res = await handlePaddleEvent(completed, writer);
    expect(writer.grantPremiumByProviderCustomerId).toHaveBeenCalledWith("ctm_1", {
      transactionId: "txn_1",
    });
    expect(res).toEqual({
      granted: true,
      userId: "user_1",
      amountTotal: "499",
      currency: "EUR",
      transactionId: "txn_1",
    });
  });

  it("grants premium on transaction.paid too", async () => {
    const writer = fakeWriter();
    await handlePaddleEvent({ ...completed, eventType: "transaction.paid" }, writer);
    expect(writer.grantPremiumByProviderCustomerId).toHaveBeenCalled();
  });

  it("ignores unrelated event types without touching the writer", async () => {
    const writer = fakeWriter();
    const res = await handlePaddleEvent(
      { eventType: "subscription.updated", data: { id: "sub_1", customerId: "ctm_1" } },
      writer,
    );
    expect(writer.grantPremiumByProviderCustomerId).not.toHaveBeenCalled();
    expect(res.granted).toBe(false);
  });

  it("does nothing when there is no customer id to resolve", async () => {
    const writer = fakeWriter();
    const res = await handlePaddleEvent(
      { eventType: "transaction.completed", data: { id: "txn_1" } },
      writer,
    );
    expect(writer.grantPremiumByProviderCustomerId).not.toHaveBeenCalled();
    expect(res.granted).toBe(false);
  });

  it("propagates a no-op grant (already premium)", async () => {
    const writer = fakeWriter({ granted: false, userId: "user_1" });
    const res = await handlePaddleEvent(completed, writer);
    expect(res.granted).toBe(false);
    expect(res.userId).toBe("user_1");
  });
});
