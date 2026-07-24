import { describe, it, expect, vi, beforeEach } from "vitest";

const { getProviderCustomerId, setProviderCustomerId, customersList, customersCreate } =
  vi.hoisted(() => ({
    getProviderCustomerId: vi.fn(),
    setProviderCustomerId: vi.fn(),
    customersList: vi.fn(),
    customersCreate: vi.fn(),
  }));

vi.mock("@/lib/paddle/config", () => ({ isPaddleConfigured: () => true }));
vi.mock("@/lib/paddle/data", () => ({ getProviderCustomerId, setProviderCustomerId }));
vi.mock("@/lib/paddle/paddle", () => ({
  getPaddle: () => ({
    customers: {
      list: customersList,
      create: customersCreate,
    },
  }),
}));

import { getOrCreateProviderCustomer } from "@/lib/paddle/checkout";

// paddle.customers.list returns an async-iterable collection.
function asyncIterableOf<T>(items: T[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) yield item;
    },
  };
}

describe("getOrCreateProviderCustomer", () => {
  beforeEach(() => {
    getProviderCustomerId.mockReset();
    setProviderCustomerId.mockReset().mockResolvedValue(undefined);
    customersList.mockReset();
    customersCreate.mockReset();
  });

  it("returns the existing mapping without calling Paddle", async () => {
    getProviderCustomerId.mockResolvedValue("ctm_existing");
    const id = await getOrCreateProviderCustomer("u1", "a@b.com");
    expect(id).toBe("ctm_existing");
    expect(customersList).not.toHaveBeenCalled();
    expect(customersCreate).not.toHaveBeenCalled();
  });

  it("reuses a Paddle customer found by email before creating one", async () => {
    getProviderCustomerId.mockResolvedValue(null);
    customersList.mockReturnValue(asyncIterableOf([{ id: "ctm_found" }]));
    const id = await getOrCreateProviderCustomer("u1", "a@b.com");
    expect(id).toBe("ctm_found");
    expect(customersCreate).not.toHaveBeenCalled();
    expect(setProviderCustomerId).toHaveBeenCalledWith("u1", "ctm_found");
  });

  it("creates a customer when none exists, then persists the mapping", async () => {
    getProviderCustomerId.mockResolvedValue(null);
    customersList.mockReturnValue(asyncIterableOf([]));
    customersCreate.mockResolvedValue({ id: "ctm_new" });
    const id = await getOrCreateProviderCustomer("u1", "a@b.com");
    expect(id).toBe("ctm_new");
    expect(customersCreate).toHaveBeenCalledWith({ email: "a@b.com" });
    expect(setProviderCustomerId).toHaveBeenCalledWith("u1", "ctm_new");
  });

  it("throws when no email is provided", async () => {
    getProviderCustomerId.mockResolvedValue(null);
    await expect(getOrCreateProviderCustomer("u1", "")).rejects.toThrow(/email/i);
  });
});
