# Paddle Checkout Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Stripe with Paddle (Merchant of Record) for CycleDutch's one-time €4.99 lifetime premium unlock — overlay checkout + webhook→DB→access loop — and delete Stripe.

**Architecture:** Server actions (`"use server"`) delegate to `server-only` Paddle seams. A pure `handlePaddleEvent(event, writer)` behind a `BillingWriter` interface keeps the webhook→DB grant unit-testable. Access is granted permanently on a completed one-time transaction, keyed by `provider_customer_id` established server-side before checkout. No subscriptions, portal, cancellation, or localization.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `@paddle/paddle-node-sdk` (server), `@paddle/paddle-js` (client overlay), Supabase (Postgres + service-role admin client), Vitest.

**Spec:** `docs/superpowers/specs/2026-07-24-paddle-checkout-migration-design.md`

**Windows note:** run Vitest via **PowerShell** (`npm run test:run -- <path>`), not Git Bash — vitest can crash under Git Bash on drive-casing. Paddle can't reach `localhost`; use `scripts/paddle-webhook-replay.mjs` for local webhook proof.

---

## File Structure

**New:**
- `lib/paddle/env.ts` — fail-loud `PADDLE_ENV` helper (no `server-only`, unit-testable).
- `lib/paddle/config.ts` — `isPaddleConfigured()`.
- `lib/paddle/paddle.ts` — `@paddle/paddle-node-sdk` singleton (`server-only`).
- `lib/paddle/data.ts` — `supabaseAdmin` billing helpers (`server-only`).
- `lib/paddle/checkout.ts` — `getOrCreateProviderCustomer()` (`server-only`).
- `lib/paddle/webhook.ts` — pure `handlePaddleEvent()` + `BillingWriter` (unit-testable).
- `lib/actions/billing.ts` — `"use server"` `startCheckoutAction()`.
- `hooks/usePaddle.ts` — `"use client"` Paddle.js init.
- `app/api/paddle/webhook/route.ts` — unmarshal + inject writer.
- `scripts/paddle-webhook-replay.mjs` — local signed-payload driver.
- `scripts/paddle-catalog-setup.mjs` — one-off SDK catalog seed.
- `supabase/migrations/20260724120000_rename_billing_provider_columns.sql` — column rename.

**Modified:**
- `lib/supabase/schema.sql` — rename columns.
- `lib/validateEnv.ts`, `.env.local.example` — swap `STRIPE_*` → `PADDLE_*`.
- `app/api/premium/verify/route.ts` — Paddle reconcile.
- `hooks/useUnlock.ts` — open overlay.
- `lib/mutations/verifyPremium.ts` — drop `sessionId`.
- `app/auth/callback/route.ts` — `next=/checkout` → `/learn?checkout=1`.
- `app/learn/page.tsx` — `UpgradeHandler` drops `session_id`; add `?checkout=1` overlay trigger.
- `components/layout/PremiumLocked.tsx` — CTA via `useUnlock`.
- `package.json` — deps + scripts.

**Deleted (Task 18):**
- `app/api/checkout/route.ts`, `app/api/stripe/webhook/route.ts`, `scripts/stripe-webhook-test.mjs`.
- Tests: `tests/api/checkout.test.ts`, `tests/api/webhook.test.ts` (replaced by Paddle equivalents).

---

## Task 1: Install Paddle deps, remove nothing yet

**Files:** Modify `package.json` (+ lockfile).

- [ ] **Step 1: Install**

Run (PowerShell):
```
npm install @paddle/paddle-node-sdk @paddle/paddle-js
```
Expected: both added to `dependencies`. `stripe` stays for now (removed in Task 18).

- [ ] **Step 2: Verify typecheck still clean**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add package.json package-lock.json
git commit -m "build: add Paddle SDKs"
```

---

## Task 2: DB migration — rename provider columns

Supabase MCP is read-only, so this migration is **applied manually** by the user in the Supabase SQL editor. This task creates the migration file + updates the tracked schema.

**Files:**
- Create: `supabase/migrations/20260724120000_rename_billing_provider_columns.sql`
- Modify: `lib/supabase/schema.sql:9-16` (profiles table) and its comment block at `:24-26`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260724120000_rename_billing_provider_columns.sql`:
```sql
-- Rename Stripe-specific billing columns to provider-neutral names for the
-- Paddle migration.
alter table public.profiles rename column stripe_customer_id to provider_customer_id;
alter table public.profiles rename column stripe_payment_id  to provider_transaction_id;

-- Existing values are Stripe cus_/pi_ ids, meaningless to Paddle. Clear them so a
-- fresh Paddle checkout never reuses a Stripe id. is_premium is preserved: anyone
-- already paid keeps lifetime access and never re-checks out.
update public.profiles
  set provider_customer_id = null, provider_transaction_id = null;
```

- [ ] **Step 2: Update `lib/supabase/schema.sql`**

Change the `profiles` create table (lines 9-16) to:
```sql
create table if not exists profiles (
  id                      uuid        primary key references auth.users(id) on delete cascade,
  is_premium              boolean     not null default false,
  premium_since           timestamptz,
  provider_customer_id    text,
  provider_transaction_id text,
  created_at              timestamptz not null default now()
);
```
And update the comment block (lines 24-26) so it reads:
```sql
-- No user-facing update policy: is_premium / provider_* are written only by the
-- service-role client (Paddle webhook + premium verify). A client-side update
-- policy would let users set is_premium themselves.
```

- [ ] **Step 3: Apply manually (user action)**

Tell the user to run the SQL from Step 1 in the Supabase SQL editor for project `bikeready` (ref `ublhbtjxzcczaahbflgc`). Verify with:
```sql
select column_name from information_schema.columns
where table_name = 'profiles' order by ordinal_position;
```
Expected columns: `id, is_premium, premium_since, provider_customer_id, provider_transaction_id, created_at`.

- [ ] **Step 4: Commit**

```
git add supabase/migrations/20260724120000_rename_billing_provider_columns.sql lib/supabase/schema.sql
git commit -m "feat: rename billing columns to provider-neutral (Paddle)"
```

---

## Task 3: `lib/paddle/env.ts` — fail-loud environment

**Files:**
- Create: `lib/paddle/env.ts`
- Test: `tests/lib/paddleEnv.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/paddleEnv.test.ts`:
```ts
import { describe, it, expect, afterEach } from "vitest";
import { paddleEnvironment } from "@/lib/paddle/env";

const original = process.env.PADDLE_ENV;
afterEach(() => { process.env.PADDLE_ENV = original; });

describe("paddleEnvironment", () => {
  it("returns 'sandbox' when set to sandbox", () => {
    process.env.PADDLE_ENV = "sandbox";
    expect(paddleEnvironment()).toBe("sandbox");
  });

  it("returns 'production' when set to production", () => {
    process.env.PADDLE_ENV = "production";
    expect(paddleEnvironment()).toBe("production");
  });

  it("throws when unset", () => {
    delete process.env.PADDLE_ENV;
    expect(() => paddleEnvironment()).toThrow(/PADDLE_ENV/);
  });

  it("throws on an unrecognized value", () => {
    process.env.PADDLE_ENV = "staging";
    expect(() => paddleEnvironment()).toThrow(/PADDLE_ENV/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/paddleEnv.test.ts`
Expected: FAIL — cannot import `@/lib/paddle/env`.

- [ ] **Step 3: Write the implementation**

Create `lib/paddle/env.ts`:
```ts
// Reads PADDLE_ENV only — no secrets, no "server-only" import, so it stays
// directly unit-testable. Never silently default the environment: a wrong
// default means running against the wrong Paddle account.
export type PaddleEnv = "sandbox" | "production";

export function paddleEnvironment(): PaddleEnv {
  const value = process.env.PADDLE_ENV;
  if (value !== "sandbox" && value !== "production") {
    throw new Error(
      `PADDLE_ENV must be "sandbox" or "production" (got: ${value ?? "unset"})`,
    );
  }
  return value;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- tests/lib/paddleEnv.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```
git add lib/paddle/env.ts tests/lib/paddleEnv.test.ts
git commit -m "feat: fail-loud PADDLE_ENV helper"
```

---

## Task 4: `lib/paddle/config.ts` — isPaddleConfigured

**Files:**
- Create: `lib/paddle/config.ts`
- Test: `tests/lib/paddleConfig.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/paddleConfig.test.ts`:
```ts
import { describe, it, expect, afterEach } from "vitest";
import { isPaddleConfigured } from "@/lib/paddle/config";

const key = process.env.PADDLE_API_KEY;
const secret = process.env.PADDLE_WEBHOOK_SECRET;
afterEach(() => {
  process.env.PADDLE_API_KEY = key;
  process.env.PADDLE_WEBHOOK_SECRET = secret;
});

describe("isPaddleConfigured", () => {
  it("is true when both key and webhook secret are set", () => {
    process.env.PADDLE_API_KEY = "k";
    process.env.PADDLE_WEBHOOK_SECRET = "s";
    expect(isPaddleConfigured()).toBe(true);
  });

  it("is false when the api key is missing", () => {
    delete process.env.PADDLE_API_KEY;
    process.env.PADDLE_WEBHOOK_SECRET = "s";
    expect(isPaddleConfigured()).toBe(false);
  });

  it("is false when the webhook secret is missing", () => {
    process.env.PADDLE_API_KEY = "k";
    delete process.env.PADDLE_WEBHOOK_SECRET;
    expect(isPaddleConfigured()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/paddleConfig.test.ts`
Expected: FAIL — cannot import.

- [ ] **Step 3: Write the implementation**

Create `lib/paddle/config.ts`:
```ts
// Billing configured only when both the server API key and the webhook signing
// secret are present. Guards the checkout action and webhook route.
export function isPaddleConfigured(): boolean {
  return !!(process.env.PADDLE_API_KEY && process.env.PADDLE_WEBHOOK_SECRET);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- tests/lib/paddleConfig.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```
git add lib/paddle/config.ts tests/lib/paddleConfig.test.ts
git commit -m "feat: isPaddleConfigured guard"
```

---

## Task 5: `lib/paddle/paddle.ts` — SDK singleton

Not unit-tested (imports `server-only` and the SDK). Exercised indirectly by checkout/webhook/verify.

**Files:** Create `lib/paddle/paddle.ts`

- [ ] **Step 1: Write the implementation**

Create `lib/paddle/paddle.ts`:
```ts
import "server-only";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { paddleEnvironment } from "./env";

let _paddle: Paddle | null = null;

// Lazy singleton so PADDLE_ENV / PADDLE_API_KEY are read at first use, not at
// module load. The API key is server-only and never reaches client code.
export function getPaddle(): Paddle {
  if (!_paddle) {
    const env =
      paddleEnvironment() === "production"
        ? Environment.production
        : Environment.sandbox;
    _paddle = new Paddle(process.env.PADDLE_API_KEY ?? "", { environment: env });
  }
  return _paddle;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add lib/paddle/paddle.ts
git commit -m "feat: Paddle node SDK singleton"
```

---

## Task 6: `lib/paddle/data.ts` — admin billing helpers

`server-only`, uses `supabaseAdmin`. Not unit-tested directly (mirrors the untested admin data layer already in the repo). The pure logic that consumes these lives in `webhook.ts` (Task 7) and is tested there via a fake writer.

**Files:** Create `lib/paddle/data.ts`

- [ ] **Step 1: Write the implementation**

Create `lib/paddle/data.ts`:
```ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BillingWriter } from "./webhook";

export async function isUserPremium(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .single();
  return data?.is_premium ?? false;
}

export async function getProviderCustomerId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("provider_customer_id")
    .eq("id", userId)
    .single();
  return data?.provider_customer_id ?? null;
}

export async function setProviderCustomerId(
  userId: string,
  customerId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ provider_customer_id: customerId })
    .eq("id", userId);
  if (error) throw new Error(`Failed to persist provider_customer_id: ${error.message}`);
}

// Grants premium for the account mapped to this Paddle customer id. Idempotent:
// returns granted:false (no write) when the row is already premium or no row
// maps to the customer, so a retried/duplicate webhook never double-grants or
// double-fires the revenue event.
export async function grantPremiumByProviderCustomerId(
  customerId: string,
  args: { transactionId: string | null },
): Promise<{ granted: boolean; userId: string | null }> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, is_premium")
    .eq("provider_customer_id", customerId)
    .single();

  if (!profile) return { granted: false, userId: null };
  if (profile.is_premium) return { granted: false, userId: profile.id };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_premium: true,
      premium_since: new Date().toISOString(),
      provider_transaction_id: args.transactionId,
    })
    .eq("id", profile.id);
  if (error) throw new Error(`Failed to grant premium: ${error.message}`);

  return { granted: true, userId: profile.id };
}

// Concrete writer injected into the webhook route (pure handler in webhook.ts).
export const billingWriter: BillingWriter = { grantPremiumByProviderCustomerId };
```

- [ ] **Step 2: Verify typecheck** (after Task 7 defines `BillingWriter`, re-run)

Run: `npm run typecheck`
Expected: may error until Task 7 exists; if implementing in order, do Task 7 first or accept the transient error and re-check at Task 7 Step 4.

- [ ] **Step 3: Commit**

```
git add lib/paddle/data.ts
git commit -m "feat: Paddle billing data helpers (admin)"
```

> If typecheck must be green at every commit, implement Task 7 before committing Task 6, then commit both together.

---

## Task 7: `lib/paddle/webhook.ts` — pure event handler

**Files:**
- Create: `lib/paddle/webhook.ts`
- Test: `tests/lib/paddleWebhookHandler.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/paddleWebhookHandler.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/paddleWebhookHandler.test.ts`
Expected: FAIL — cannot import.

- [ ] **Step 3: Write the implementation**

Create `lib/paddle/webhook.ts`:
```ts
// Paddle one-time transaction event -> premium grant. Kept free of "server-only"
// imports so the logic is unit-testable; the webhook route injects the real
// writer. Access is keyed off provider_customer_id (established server-side at
// checkout) — never custom_data, which the overlay does not send.

// Minimal shape we depend on from an unmarshalled Paddle event. The Node SDK
// returns camelCase entities (transaction.customerId, transaction.currencyCode).
export interface PaddleEventLike {
  eventType: string;
  data: {
    id?: string;
    customerId?: string;
    currencyCode?: string;
    details?: { totals?: { total?: string } } | null;
  };
}

export interface BillingWriter {
  grantPremiumByProviderCustomerId(
    customerId: string,
    args: { transactionId: string | null },
  ): Promise<{ granted: boolean; userId: string | null }>;
}

export interface HandleResult {
  granted: boolean;
  userId: string | null;
  amountTotal: string | null;
  currency: string | null;
  transactionId: string | null;
}

// A completed one-time transaction is the signal to grant lifetime access.
// transaction.paid is handled too (idempotent) so a payment-collected-first
// ordering still grants. No status->plan, no revoke: a one-time grant is
// permanent, so duplicate/stale events only re-hit an already-premium row.
const GRANT_EVENTS = new Set(["transaction.completed", "transaction.paid"]);

const NO_GRANT: HandleResult = {
  granted: false,
  userId: null,
  amountTotal: null,
  currency: null,
  transactionId: null,
};

export async function handlePaddleEvent(
  event: PaddleEventLike,
  writer: BillingWriter,
): Promise<HandleResult> {
  if (!GRANT_EVENTS.has(event.eventType)) return NO_GRANT;

  const customerId = event.data.customerId;
  if (!customerId) return NO_GRANT; // not resolvable to an account

  const transactionId = event.data.id ?? null;
  const { granted, userId } = await writer.grantPremiumByProviderCustomerId(
    customerId,
    { transactionId },
  );

  return {
    granted,
    userId,
    amountTotal: event.data.details?.totals?.total ?? null,
    currency: event.data.currencyCode ?? null,
    transactionId,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- tests/lib/paddleWebhookHandler.test.ts`
Expected: PASS (5 tests). Also run `npm run typecheck` — Task 6 `data.ts` should now compile.

- [ ] **Step 5: Commit**

```
git add lib/paddle/webhook.ts tests/lib/paddleWebhookHandler.test.ts lib/paddle/data.ts
git commit -m "feat: pure Paddle transaction handler + billing writer"
```

---

## Task 8: `lib/paddle/checkout.ts` — getOrCreateProviderCustomer

**Files:**
- Create: `lib/paddle/checkout.ts`
- Test: `tests/lib/paddleCheckout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/paddleCheckout.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/paddleCheckout.test.ts`
Expected: FAIL — cannot import.

- [ ] **Step 3: Write the implementation**

Create `lib/paddle/checkout.ts`:
```ts
import "server-only";
import { getPaddle } from "./paddle";
import { isPaddleConfigured } from "./config";
import { getProviderCustomerId, setProviderCustomerId } from "./data";

// Establishes the user <-> Paddle customer mapping BEFORE checkout opens, so the
// webhook can resolve the account by provider_customer_id and no client-supplied
// value can misdirect premium. Returns the Paddle customer id.
export async function getOrCreateProviderCustomer(
  userId: string,
  email: string,
): Promise<string> {
  if (!isPaddleConfigured()) throw new Error("Billing is not configured");

  const existing = await getProviderCustomerId(userId);
  if (existing) return existing;

  // Paddle rejects fabricated addresses; a real email is required.
  if (!email) throw new Error("An account email is required to start checkout");

  // Reuse an existing Paddle customer for this email if one exists — a prior
  // create whose mapping upsert failed would otherwise 409 (customer already
  // exists) on every retry and lock the user out of checkout.
  const paddle = getPaddle();
  let customerId: string | undefined;
  for await (const customer of paddle.customers.list({ email: [email] })) {
    customerId = customer.id;
    break;
  }
  if (!customerId) {
    const created = await paddle.customers.create({ email });
    customerId = created.id;
  }

  await setProviderCustomerId(userId, customerId);
  return customerId;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- tests/lib/paddleCheckout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```
git add lib/paddle/checkout.ts tests/lib/paddleCheckout.test.ts
git commit -m "feat: getOrCreateProviderCustomer (list-or-create, mapping-first)"
```

---

## Task 9: `lib/actions/billing.ts` — startCheckoutAction

**Files:**
- Create: `lib/actions/billing.ts`
- Test: `tests/actions/billing.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/actions/billing.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/actions/billing.test.ts`
Expected: FAIL — cannot import.

- [ ] **Step 3: Write the implementation**

Create `lib/actions/billing.ts`:
```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { isUserPremium } from "@/lib/paddle/data";
import { getOrCreateProviderCustomer } from "@/lib/paddle/checkout";

export interface CheckoutIntent {
  customerId: string;
  priceId: string;
}

// Signed-in only. Establishes the customer mapping server-side and returns the
// customer + price the client overlay should open. The client never chooses the
// customer id — the trust boundary.
export async function startCheckoutAction(): Promise<
  { alreadyPremium: true } | CheckoutIntent
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (await isUserPremium(user.id)) return { alreadyPremium: true };

  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
  if (!priceId) throw new Error("Billing is not configured");

  const customerId = await getOrCreateProviderCustomer(user.id, user.email ?? "");
  return { customerId, priceId };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- tests/actions/billing.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```
git add lib/actions/billing.ts tests/actions/billing.test.ts
git commit -m "feat: startCheckoutAction server action"
```

---

## Task 10: Webhook route `app/api/paddle/webhook/route.ts`

**Files:**
- Create: `app/api/paddle/webhook/route.ts`
- Test: `tests/api/paddleWebhook.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/api/paddleWebhook.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/api/paddleWebhook.test.ts`
Expected: FAIL — cannot import route.

- [ ] **Step 3: Write the implementation**

Create `app/api/paddle/webhook/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import type { TransactionNotification } from "@paddle/paddle-node-sdk";
import { getPaddle } from "@/lib/paddle/paddle";
import { isPaddleConfigured } from "@/lib/paddle/config";
import { handlePaddleEvent, type PaddleEventLike } from "@/lib/paddle/webhook";
import { billingWriter } from "@/lib/paddle/data";
import { captureServerEvent } from "@/lib/posthogServer";

// Compile-time guard: the fields handlePaddleEvent reads off `event.data` must
// keep existing on the SDK's real webhook payload type, so an upstream rename
// breaks the build here rather than silently no-op'ing grants via the cast below.
// TransactionNotification (not the API-response Transaction entity) is what the
// Node SDK types transaction.* event `.data` as.
type _TxnFieldGuard = Pick<
  TransactionNotification,
  "id" | "customerId" | "currencyCode" | "details"
>;

export async function POST(req: NextRequest) {
  if (!isPaddleConfigured()) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification needs the raw body, not parsed JSON.
  const rawBody = await req.text();
  let event: PaddleEventLike;
  try {
    event = (await getPaddle().webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature,
    )) as unknown as PaddleEventLike;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await handlePaddleEvent(event, billingWriter);
    // Ground-truth revenue event — fired once, only on the transition to premium,
    // so a retry or a verify-then-webhook race never double-counts.
    if (result.granted && result.userId) {
      await captureServerEvent(result.userId, "purchase_completed", {
        amount_total: result.amountTotal,
        currency: result.currency,
        transaction_id: result.transactionId,
      });
    }
  } catch (error) {
    console.error("[paddle-webhook] failed to apply event", event.eventType, error);
    // Non-2xx makes Paddle retry, which is what we want on transient DB errors.
    return NextResponse.json({ error: "Failed to apply event" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- tests/api/paddleWebhook.test.ts`
Expected: PASS (6 tests). Run `npm run typecheck` — the `_TxnFieldGuard` must compile.

> If `TransactionNotification` lacks any of `id | customerId | currencyCode | details`, adjust the `Pick` to the real field names the installed SDK version exposes (check `node_modules/@paddle/paddle-node-sdk` types), keeping the guard over the fields `handlePaddleEvent` actually reads.

- [ ] **Step 5: Commit**

```
git add app/api/paddle/webhook/route.ts tests/api/paddleWebhook.test.ts
git commit -m "feat: Paddle webhook route (grant on completed transaction)"
```

---

## Task 11: Rewrite `app/api/premium/verify/route.ts` — Paddle reconcile

**Files:**
- Modify: `app/api/premium/verify/route.ts` (full rewrite)
- Test: `tests/api/premiumVerify.test.ts` (full rewrite)

- [ ] **Step 1: Rewrite the failing test**

Replace `tests/api/premiumVerify.test.ts` with:
```ts
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

  it("grants and returns true when a completed transaction exists", async () => {
    isUserPremium.mockResolvedValue(false);
    getProviderCustomerId.mockResolvedValue("ctm_1");
    transactionsList.mockReturnValue(
      asyncIterableOf([{ id: "txn_1", currencyCode: "EUR", details: { totals: { total: "499" } } }]),
    );
    grant.mockResolvedValue({ granted: true, userId: "u1" });
    const res = await GET(req());
    expect(await res.json()).toEqual({ is_premium: true });
    expect(grant).toHaveBeenCalledWith("ctm_1", { transactionId: "txn_1" });
    expect(captureServerEvent).toHaveBeenCalled();
  });

  it("returns false when the customer has no completed transaction", async () => {
    isUserPremium.mockResolvedValue(false);
    getProviderCustomerId.mockResolvedValue("ctm_1");
    transactionsList.mockReturnValue(asyncIterableOf([]));
    const res = await GET(req());
    expect(await res.json()).toEqual({ is_premium: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/api/premiumVerify.test.ts`
Expected: FAIL — route still imports Stripe / shape mismatch.

- [ ] **Step 3: Rewrite the route**

Replace `app/api/premium/verify/route.ts` with:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/cooldown";
import { getPaddle } from "@/lib/paddle/paddle";
import {
  isUserPremium,
  getProviderCustomerId,
  grantPremiumByProviderCustomerId,
} from "@/lib/paddle/data";
import { captureServerEvent } from "@/lib/posthogServer";

// Reconciles premium against Paddle — covers a missed webhook. Lists the
// customer's completed transactions and grants if any exist. The webhook guards
// on the is_premium transition, so a late delivery won't double-count.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each pass can hit the Paddle API; throttle per user to protect the quota.
  if (isRateLimited(`verify:${user.id}`, 10_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (await isUserPremium(user.id)) {
    return NextResponse.json({ is_premium: true });
  }

  const customerId = await getProviderCustomerId(user.id);
  if (!customerId) {
    return NextResponse.json({ is_premium: false });
  }

  // Find a completed one-time transaction for this customer.
  for await (const txn of getPaddle().transactions.list({
    customerId: [customerId],
    status: ["completed"],
  })) {
    const result = await grantPremiumByProviderCustomerId(customerId, {
      transactionId: txn.id,
    });
    if (result.granted && result.userId) {
      await captureServerEvent(result.userId, "purchase_completed", {
        amount_total: txn.details?.totals?.total ?? null,
        currency: txn.currencyCode ?? null,
        transaction_id: txn.id,
      });
    }
    return NextResponse.json({ is_premium: true });
  }

  return NextResponse.json({ is_premium: false });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- tests/api/premiumVerify.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```
git add app/api/premium/verify/route.ts tests/api/premiumVerify.test.ts
git commit -m "feat: Paddle-based premium reconcile route"
```

---

## Task 12: `hooks/usePaddle.ts` — client init

**Files:** Create `hooks/usePaddle.ts`

- [ ] **Step 1: Write the implementation**

Create `hooks/usePaddle.ts`:
```ts
"use client";
import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

// Initializes Paddle.js once with the sandbox/production client token. The
// environment and token are read from NEXT_PUBLIC_* vars — never the server key.
export function usePaddle(): Paddle | undefined {
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENV as
      | "sandbox"
      | "production"
      | undefined;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!environment || !token) {
      console.error("Paddle client env vars missing");
      return;
    }

    initializePaddle({ environment, token }).then(setPaddle);
  }, []);

  return paddle;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add hooks/usePaddle.ts
git commit -m "feat: usePaddle client init hook"
```

---

## Task 13: Rewrite `hooks/useUnlock.ts` — open overlay

The overlay needs the `paddle` instance from `usePaddle()`. `useUnlock` returns a callback; it calls `startCheckoutAction()` then `paddle.Checkout.open`.

**Files:**
- Modify: `hooks/useUnlock.ts` (full rewrite)
- Test: `tests/hooks/useUnlock.test.ts` (full rewrite)

- [ ] **Step 1: Rewrite the failing test**

Replace `tests/hooks/useUnlock.test.ts` with:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUIStore } from "@/stores/uiStore";

const { getUser, track, refreshPremiumStatus, logError, startCheckoutAction, openAuth, checkoutOpen } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    track: vi.fn(),
    refreshPremiumStatus: vi.fn(),
    logError: vi.fn(),
    startCheckoutAction: vi.fn(),
    openAuth: vi.fn(),
    checkoutOpen: vi.fn(),
  }));

vi.mock("@/lib/supabase", () => ({ createClient: () => ({ auth: { getUser } }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ refreshPremiumStatus }) }));
vi.mock("@/hooks/useAnalytics", () => ({ useAnalytics: () => ({ track }) }));
vi.mock("@/hooks/usePaddle", () => ({ usePaddle: () => ({ Checkout: { open: checkoutOpen } }) }));
vi.mock("@/lib/actions/billing", () => ({ startCheckoutAction }));
vi.mock("@/lib/logger", () => ({ logError }));

import { useUnlock } from "@/hooks/useUnlock";

describe("useUnlock", () => {
  beforeEach(() => {
    getUser.mockReset();
    track.mockReset();
    refreshPremiumStatus.mockReset().mockResolvedValue(undefined);
    logError.mockReset();
    startCheckoutAction.mockReset();
    openAuth.mockReset();
    checkoutOpen.mockReset();
    useUIStore.setState({ checkoutError: null, openAuth });
  });

  it("opens the auth modal when there is no user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(openAuth).toHaveBeenCalledWith("upgrade");
    expect(startCheckoutAction).not.toHaveBeenCalled();
  });

  it("refreshes premium and tracks conversion when already premium", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    startCheckoutAction.mockResolvedValue({ alreadyPremium: true });
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(refreshPremiumStatus).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("gate_converted", {});
    expect(checkoutOpen).not.toHaveBeenCalled();
  });

  it("opens the Paddle overlay with the customer id and price id", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    startCheckoutAction.mockResolvedValue({ customerId: "ctm_1", priceId: "pri_1" });
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(track).toHaveBeenCalledWith("checkout_started", {});
    expect(checkoutOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ priceId: "pri_1", quantity: 1 }],
        customer: { id: "ctm_1" },
        settings: expect.objectContaining({ displayMode: "overlay", variant: "one-page" }),
      }),
    );
  });

  it("sets a checkout error in the ui store when the action throws", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    startCheckoutAction.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useUnlock());
    await result.current();
    expect(useUIStore.getState().checkoutError).toMatch(/checkout/i);
    expect(logError).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/hooks/useUnlock.test.ts`
Expected: FAIL — old implementation uses fetch, no `usePaddle`.

- [ ] **Step 3: Rewrite the hook**

Replace `hooks/useUnlock.ts` with:
```ts
"use client";

import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePaddle } from "@/hooks/usePaddle";
import { startCheckoutAction } from "@/lib/actions/billing";
import { createClient } from "@/lib/supabase";
import { logError } from "@/lib/logger";

export function useUnlock(onClose?: () => void) {
  const { refreshPremiumStatus } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const setCheckoutError = useUIStore((s) => s.setCheckoutError);
  const { track } = useAnalytics();
  const paddle = usePaddle();

  return useCallback(async () => {
    setCheckoutError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Auth-first: a purchase must bind to an account.
    if (!user) {
      onClose?.();
      openAuth("upgrade");
      return;
    }

    try {
      const intent = await startCheckoutAction();
      if ("alreadyPremium" in intent) {
        await refreshPremiumStatus();
        track("gate_converted", {});
        onClose?.();
        return;
      }
      if (!paddle) throw new Error("Paddle.js not ready");
      track("checkout_started", {});
      // Email prefills automatically from the server-created customer record;
      // opening by customer id only (never {id} AND {email}) is the trust boundary.
      paddle.Checkout.open({
        items: [{ priceId: intent.priceId, quantity: 1 }],
        customer: { id: intent.customerId },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          successUrl: `${window.location.origin}/learn?upgraded=true`,
        },
      });
      onClose?.();
    } catch (err) {
      logError("useUnlock", err);
      setCheckoutError("Couldn't start checkout. Please try again.");
    }
  }, [refreshPremiumStatus, openAuth, onClose, track, setCheckoutError, paddle]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- tests/hooks/useUnlock.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```
git add hooks/useUnlock.ts tests/hooks/useUnlock.test.ts
git commit -m "feat: open Paddle overlay from useUnlock"
```

---

## Task 14: `verifyPremium` mutation — drop sessionId

**Files:**
- Modify: `lib/mutations/verifyPremium.ts`
- Test: `tests/lib/verifyPremium.test.ts` (adjust)

- [ ] **Step 1: Update the test**

Open `tests/lib/verifyPremium.test.ts`. Remove any assertion that a `session_id` query string is forwarded, and ensure it asserts a plain `GET /api/premium/verify` (no query). Keep the store-set-on-premium and no-throw-on-error cases. Example expected fetch assertion:
```ts
expect(fetchMock).toHaveBeenCalledWith("/api/premium/verify");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/verifyPremium.test.ts`
Expected: FAIL — current impl appends `?session_id=...`.

- [ ] **Step 3: Simplify the mutation**

Replace `lib/mutations/verifyPremium.ts` with:
```ts
import { useAppStore } from "@/stores/appStore";

// Reconciles premium status against Paddle via /api/premium/verify — covers the
// race where the user returns from the overlay before the webhook lands.
// Never throws; a failed check just leaves the store as-is.
const verifyPremium = async (): Promise<boolean> => {
  try {
    const res = await fetch(`/api/premium/verify`);
    if (!res.ok) return false;
    const { is_premium } = (await res.json()) as { is_premium: boolean };
    if (is_premium) {
      useAppStore.getState().setPremium(true);
    }
    return is_premium;
  } catch {
    return false;
  }
};

export default verifyPremium;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- tests/lib/verifyPremium.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```
git add lib/mutations/verifyPremium.ts tests/lib/verifyPremium.test.ts
git commit -m "refactor: drop session_id from premium verify"
```

---

## Task 15: Auth callback + learn page + PremiumLocked wiring

The magic-link `upgrade` flow can no longer server-redirect to a checkout URL (overlay is client-side). Redirect to `/learn?checkout=1`; a client effect opens the overlay once authed.

**Files:**
- Modify: `app/auth/callback/route.ts:21-42`
- Modify: `app/learn/page.tsx` (`UpgradeHandler` + new `?checkout=1` trigger)
- Modify: `components/layout/PremiumLocked.tsx`

- [ ] **Step 1: Simplify the auth callback**

In `app/auth/callback/route.ts`, replace the entire `if (next === "/checkout") { ... }` block (lines ~21-42) with a redirect that the client picks up:
```ts
    if (next === "/checkout") {
      // Overlay checkout is client-side — there is no server URL to redirect to.
      // Land on /learn with a flag the client uses to open the Paddle overlay
      // once the session is active.
      return NextResponse.redirect(new URL("/learn?checkout=1", request.url));
    }
```
Keep the imports; `cookies` may now be unused — remove the `import { cookies } from "next/headers";` line if so.

- [ ] **Step 2: Update `UpgradeHandler` in `app/learn/page.tsx`**

In the `UpgradeHandler` effect, drop the `session_id` read and call `verifyPremium()` with no argument:
```tsx
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setUpgradeToast(true);
      router.replace("/learn");
      // Reconcile against Paddle directly — the webhook may not have landed yet
      // when the overlay redirects back.
      verifyPremium();
      track("gate_converted", {});
      const timer = setTimeout(() => setUpgradeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, setUpgradeToast, track]);
```

- [ ] **Step 3: Add a `?checkout=1` overlay trigger**

Find the component in `app/learn/page.tsx` that already calls `useUnlock` for the page (the `PreviewCompleteScreen`/index `onUnlock`). Add a small effect near `UpgradeHandler` that opens the overlay when `?checkout=1` is present, then strips the param. Because `useUnlock` needs the Paddle instance and auth, place this in a client component that has `useUnlock`:
```tsx
function PostAuthCheckout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const unlock = useUnlock();
  const fired = useRef(false);
  useEffect(() => {
    if (searchParams.get("checkout") === "1" && !fired.current) {
      fired.current = true;
      router.replace("/learn");
      unlock();
    }
  }, [searchParams, router, unlock]);
  return null;
}
```
Render `<PostAuthCheckout />` alongside `<UpgradeHandler />`. Add `useRef` to the React import if not present.

- [ ] **Step 4: Route `PremiumLocked` CTA through the overlay**

Replace the `router.push("/api/checkout")` button in `components/layout/PremiumLocked.tsx` with the `useUnlock` overlay. Since `PremiumLocked` is rendered in a server/client boundary, make it a client component using `useUnlock`:
```tsx
"use client";
import { Lock } from "lucide-react";
import AppShell from "./AppShell";
import Button from "../ui/Button";
import { APP_PRICE } from "@/data/constants";
import { useUnlock } from "@/hooks/useUnlock";

type Props = { title: string; body: string };

const PremiumLocked = ({ title, body }: Props) => {
  const unlock = useUnlock();
  return (
    <AppShell wrongCount={0}>
      <main className="min-h-screen bg-stone-50 flex items-center justify-center mt-[-60px]">
        <div className="max-w-2xl px-5 text-center">
          <div className="mb-3 flex justify-center"><Lock size={40} className="text-stone-400" aria-hidden="true" /></div>
          <h1 className="font-display font-bold text-xl text-stone-900 mb-2">{title}</h1>
          <p className="text-stone-600 text-sm mb-6">{body}</p>
          <Button size="lg" onClick={() => unlock()}>Unlock for {APP_PRICE}</Button>
        </div>
      </main>
    </AppShell>
  );
};

export default PremiumLocked;
```

- [ ] **Step 5: Verify**

Run: `npm run test:run` and `npm run typecheck`
Expected: all green. If `useSearchParams` in a new client component needs a Suspense boundary at build, wrap `<PostAuthCheckout />` in `<Suspense>` (the page already does this for `UpgradeHandler` — mirror it).

- [ ] **Step 6: Commit**

```
git add app/auth/callback/route.ts app/learn/page.tsx components/layout/PremiumLocked.tsx
git commit -m "feat: overlay hand-off after magic-link upgrade"
```

---

## Task 16: Env — swap STRIPE_* for PADDLE_* in validation

**Files:**
- Modify: `lib/validateEnv.ts:25-29`
- Modify: `.env.local.example:6-8`
- Test: `tests/lib/validateEnv.test.ts` (adjust)

- [ ] **Step 1: Update the test**

In `tests/lib/validateEnv.test.ts`, update the premium-required set from the three `STRIPE_*` names to the Paddle names: `PADDLE_ENV`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PADDLE_PRICE_ID`, `NEXT_PUBLIC_PADDLE_ENV`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`. Assert that with `VERCEL_ENV=production` + `NEXT_PUBLIC_PREMIUM_ENABLED=true` and these unset, `validateEnv()` throws naming a missing Paddle var; and that setting them all makes it pass.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- tests/lib/validateEnv.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `validateEnv.ts`**

Replace the `requiredForPremium` array (lines 25-29):
```ts
// Required only when the premium feature flag is on in production: checkout and
// the webhook crash at runtime without them, so fail the build instead.
const requiredForPremium = [
  "PADDLE_ENV",
  "PADDLE_API_KEY",
  "PADDLE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_PADDLE_PRICE_ID",
  "NEXT_PUBLIC_PADDLE_ENV",
  "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
] as const;
```

- [ ] **Step 4: Update `.env.local.example`**

Replace lines 6-8 (`STRIPE_*`) with:
```
PADDLE_ENV=sandbox
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_PRICE_ID=
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- tests/lib/validateEnv.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```
git add lib/validateEnv.ts .env.local.example tests/lib/validateEnv.test.ts
git commit -m "feat: require Paddle env vars for premium"
```

---

## Task 17: Local webhook replay script

**Files:** Create `scripts/paddle-webhook-replay.mjs`, add npm script.

- [ ] **Step 1: Write the script**

Create `scripts/paddle-webhook-replay.mjs`:
```js
// Local Paddle webhook driver. Paddle can't reach localhost, so this signs
// payloads with PADDLE_WEBHOOK_SECRET the way Paddle does
// (paddle-signature: ts=<unix>;h1=HMAC_SHA256(`<ts>:<body>`)) and POSTs them to
// the local webhook route, exercising the real getPaddle().webhooks.unmarshal
// verification path.
//
//   node scripts/paddle-webhook-replay.mjs
//     Signature-contract checks (no DB writes):
//       missing signature -> 400 | bad signature -> 400 | valid unknown evt -> 200
//
//   node scripts/paddle-webhook-replay.mjs <event.json> [url]
//     Signs a real captured Paddle event payload and POSTs it (drives a real
//     transaction.completed to flip a user to premium). Needs the column-rename
//     migration applied and PADDLE_WEBHOOK_SECRET matching this .env.local.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const arg = process.argv[2];
const isFile = arg && arg.endsWith(".json");
const url =
  (isFile ? process.argv[3] : arg) ?? "http://localhost:3000/api/paddle/webhook";

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*export\s+/, ""))
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).replace(/^"|"$/g, "").trim()];
    }),
);

const secret = env.PADDLE_WEBHOOK_SECRET;
if (!secret) throw new Error("PADDLE_WEBHOOK_SECRET missing from .env.local");

function sign(body) {
  const ts = Math.floor(Date.now() / 1000);
  const h1 = crypto.createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  return `ts=${ts};h1=${h1}`;
}

async function post(label, body, signature, expected) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signature ? { "paddle-signature": signature } : {}),
    },
    body,
  });
  const text = (await res.text()).slice(0, 120);
  const mark = expected == null ? "" : res.status === expected ? " PASS" : " FAIL";
  console.log(`${label}: ${res.status} ${text}${mark}`);
  return res.status;
}

if (isFile) {
  const body = fs.readFileSync(path.resolve(arg), "utf8");
  const type = (() => { try { return JSON.parse(body).event_type; } catch { return "?"; } })();
  await post(`replay ${type}`, body, sign(body));
} else {
  const unknown = JSON.stringify({ event_type: "ping.test", data: { id: "x" } });
  await post("missing signature ", unknown, null, 400);
  await post("bad signature     ", unknown, "ts=1;h1=deadbeef", 400);
  await post("valid, unknown evt", unknown, sign(unknown), 200);
}
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, add:
```json
"paddle:webhook": "node scripts/paddle-webhook-replay.mjs"
```

- [ ] **Step 3: Commit**

```
git add scripts/paddle-webhook-replay.mjs package.json
git commit -m "test: local Paddle webhook replay script"
```

---

## Task 18: Remove Stripe

**Files:**
- Delete: `app/api/checkout/route.ts`, `app/api/stripe/webhook/route.ts`, `scripts/stripe-webhook-test.mjs`
- Delete: `tests/api/checkout.test.ts`, `tests/api/webhook.test.ts`
- Modify: `package.json` (remove `stripe` dep + `stripe:webhook` script)

- [ ] **Step 1: Delete Stripe files**

Run (PowerShell):
```
Remove-Item app/api/checkout/route.ts, app/api/stripe/webhook/route.ts, scripts/stripe-webhook-test.mjs, tests/api/checkout.test.ts, tests/api/webhook.test.ts
Remove-Item app/api/stripe -Recurse -Force
```

- [ ] **Step 2: Remove the dependency + script**

Run: `npm uninstall stripe`
Then remove the `"stripe:webhook": "node scripts/stripe-webhook-test.mjs"` line from `package.json` scripts.

- [ ] **Step 3: Grep for stragglers**

Run: `git grep -in "stripe" -- "*.ts" "*.tsx"`
Expected: no references in `app/`, `lib/`, `hooks/`, `components/`, `tests/`, `types/` (docs may still mention it — fine). Fix any code hit (e.g. a lingering import or an `AnalyticsEvents` comment).

- [ ] **Step 4: Full green gate**

Run (PowerShell):
```
npm run test:run
npm run typecheck
npm run build
```
Expected: all pass; build completes. (`build` runs `validateEnv`; with `NEXT_PUBLIC_PREMIUM_ENABLED` unset locally the Paddle vars aren't required.)

- [ ] **Step 5: Commit**

```
git add -A
git commit -m "chore: remove Stripe"
```

---

## Task 19: Paddle account setup (catalog + credentials)

Same Paddle account as `stock-tracker`; reuse `PADDLE_API_KEY`. This task is operational (SDK script + dashboard). It produces the real ids that go in `.env.local`.

**Files:** Create `scripts/paddle-catalog-setup.mjs`

- [ ] **Step 1: Write the catalog seed script**

Create `scripts/paddle-catalog-setup.mjs`:
```js
// One-off: creates this app's product + one-time EUR price in the shared Paddle
// account via the Node SDK (the Paddle MCP may fail with an auth-format error).
// Run: node scripts/paddle-catalog-setup.mjs   (reads PADDLE_* from .env.local)
import fs from "node:fs";
import path from "node:path";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/).map((l) => l.replace(/^\s*export\s+/, ""))
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).replace(/^"|"$/g, "").trim()]; }),
);

const paddle = new Paddle(env.PADDLE_API_KEY, {
  environment: env.PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
});

const product = await paddle.products.create({
  name: "CycleDutch Premium",
  taxCategory: "standard",
  description: "One-time lifetime unlock of the full CycleDutch course.",
});
console.log("product:", product.id);

const price = await paddle.prices.create({
  productId: product.id,
  description: "CycleDutch Premium (one-time)",
  unitPrice: { amount: "499", currency: "EUR" }, // 499 = €4.99, lowest denomination
  billingCycle: null,                            // one-time, not recurring
});
console.log("NEXT_PUBLIC_PADDLE_PRICE_ID:", price.id);
```

- [ ] **Step 2: Run it (user has a filled `.env.local` with reused `PADDLE_API_KEY` + `PADDLE_ENV=sandbox`)**

Run: `node scripts/paddle-catalog-setup.mjs`
Expected: prints `product: pro_…` and `NEXT_PUBLIC_PADDLE_PRICE_ID: pri_…`. Put the price id in `.env.local`.

- [ ] **Step 3: Dashboard steps (dictate to the user)**

In the Paddle **sandbox** dashboard:
1. Developer tools → Authentication → **client-side tokens** → create one (`test_…`) → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.
2. Developer tools → **Notifications** → new destination → URL `https://<deploy-or-tunnel>/api/paddle/webhook`, subscribe to `transaction.completed` and `transaction.paid` → copy its signing secret → `PADDLE_WEBHOOK_SECRET`. (A **new destination for this app**, separate from stock-tracker.)
3. Checkout → **Checkout settings** → set the **default payment link** (e.g. `http://localhost:3000` on sandbox) or the overlay errors.

- [ ] **Step 4: Commit the script**

```
git add scripts/paddle-catalog-setup.mjs
git commit -m "chore: Paddle catalog seed script"
```

---

## Task 20: Sandbox end-to-end verification

Operational, no code. Confirms the full loop.

- [ ] **Step 1: Signature-contract check**

With the dev server running (`npm run dev`) and `.env.local` filled, run:
```
npm run paddle:webhook
```
Expected:
```
missing signature : 400 ...
bad signature     : 400 ...
valid, unknown evt: 200 ...  PASS
```

- [ ] **Step 2: Real overlay purchase**

With the DB migration applied and a signed-in test user: open a gated module past the free limit → click Unlock → the Paddle **overlay** opens → pay with a Paddle sandbox test card. On success you land on `/learn?upgraded=true`.

- [ ] **Step 3: Confirm the grant**

Check `profiles` for the user: `is_premium = true`, `premium_since` set, `provider_customer_id` = `ctm_…`, `provider_transaction_id` = `txn_…`. If webhooks can't reach your local machine, capture the real `transaction.completed` from the dashboard's webhook logs and replay it:
```
node scripts/paddle-webhook-replay.mjs captured-transaction-completed.json
```
Expected: `replay transaction.completed: 200` and the row flips to premium.

- [ ] **Step 4: Regression gate**

Run (PowerShell): `npm run test:run`, `npm run typecheck`, `npm run build`.
Expected: all green.

- [ ] **Step 5: Finish the branch**

Use superpowers:finishing-a-development-branch to decide merge/PR.

---

## Self-Review notes (for the implementer)

- **Spec coverage:** DB rename (T2), env fail-loud (T3), config (T4), SDK singleton (T5), data/writer (T6), pure handler (T7), getOrCreateProviderCustomer (T8), checkout action (T9), webhook route + compile-time guard (T10), reconcile (T11), client init (T12), overlay unlock (T13), verify mutation (T14), auth hand-off + surfaces (T15), env swap (T16), replay (T17), Stripe removal (T18), account setup (T19), E2E (T20). All spec sections mapped.
- **Trust boundary:** customer↔user mapping is written in T8 before checkout; the webhook (T10) resolves the account only via `provider_customer_id` (T7 handler ignores everything else). No `custom_data` is ever read.
- **Idempotency:** the false→true transition guard lives in `grantPremiumByProviderCustomerId` (T6); both the webhook (T10) and verify (T11) go through it, so a webhook+verify race grants once and fires one revenue event.
- **Type consistency:** `grantPremiumByProviderCustomerId(customerId, { transactionId })` and `{ granted, userId }` are used identically in T6/T7/T10/T11. `startCheckoutAction()` returns `{ alreadyPremium: true } | { customerId, priceId }` in T9 and is consumed with an `"alreadyPremium" in intent` check in T13.
