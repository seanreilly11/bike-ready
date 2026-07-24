# Paddle Checkout Migration — CycleDutch (one-time unlock)

**Date:** 2026-07-24
**Status:** Approved design, ready for implementation plan
**Sibling reference:** `../stock-tracker` (subscription MoR migration — same Paddle account, same architecture, adapted here to a one-time payment)

---

## Goal

Replace Stripe with **Paddle as Merchant of Record** for CycleDutch's premium
unlock. Keep the app's model exactly as it is: a **one-time €4.99 lifetime
unlock**, Netherlands/EUR only. Deliver Paddle **overlay** checkout plus the
**webhook → DB → access** loop that grants `is_premium`. Delete Stripe at the
end.

### Confirmed decisions

| Decision | Choice |
| --- | --- |
| Payment model | **One-time** lifetime unlock (not subscription). Grant is permanent. |
| Checkout UX | **Paddle overlay** (native Paddle.js), opened with `customer: { id }` only. |
| Localization | **None.** NL/EUR only, flat €4.99. No `PricePreview`, no country detection, no monthly/yearly toggle. |
| Pricing surface | **Existing surfaces** (GateModal / PremiumLocked / UpsellBanner / inline gate / PreviewCompleteScreen). No new `/pricing` page. |
| Signed-out behavior | **Auth-first** (unchanged): no user → open AuthModal; magic-link `next=/checkout` → open overlay once authed. |
| Stripe removal | **Replace entirely** at the end (dep, routes, script, env, tests). |
| Server layer | **Server actions** (`"use server"`) delegating to `server-only` seams — matches the sibling. |

### Explicitly out of scope (do not apply to a one-time model)

- Subscription lifecycle events / status→plan mapping.
- `past_due` / dunning grace window.
- Customer portal (`createPortalSession`).
- `SubscriptionCanceller` / cancel-on-account-deletion — **there is no
  account-deletion route in this app.**
- Per-subscription `occurred_at` idempotency/ordering column — a one-time grant
  has no un-grant path, so a stale or duplicate event only re-hits an
  already-premium row and no-ops. Idempotency is the `is_premium` false→true
  transition guard alone.

---

## Architecture

**Principle:** swap the provider, keep the loop. Pure plan/limit logic
(`FREE_PER_MODULE`) and its unit tests are untouched. A provider-agnostic
`BillingWriter` DI seam separates the webhook→DB write from the concrete Paddle
bits, so the grant logic is unit-testable with a fake writer.

### File layout (new)

```
lib/
  paddle/
    env.ts        # fail-loud PADDLE_ENV helper (throw if unset/invalid)
    paddle.ts     # @paddle/paddle-node-sdk singleton (server-only)
    config.ts     # isPaddleConfigured()
    data.ts       # supabaseAdmin billing helpers (server-only)
    checkout.ts   # getOrCreateProviderCustomer() (server-only)
    webhook.ts    # pure handlePaddleEvent(event, writer) — unit-testable
  actions/
    billing.ts    # "use server" startCheckoutAction()
hooks/
  usePaddle.ts    # "use client" Paddle.js Initialize once (top-level hooks/ dir)
app/api/paddle/webhook/route.ts   # unmarshal + inject BillingWriter
scripts/paddle-webhook-replay.mjs # local signed-payload driver
supabase/migrations/2026...-rename_billing_provider_columns.sql (or manual SQL)
```

Reused/rewritten in place:

- `app/api/premium/verify/route.ts` — same path, Paddle reconcile impl.
- `hooks/useUnlock.ts` — open overlay instead of redirect.
- `lib/mutations/verifyPremium.ts` — drop `session_id`.
- `app/auth/callback/route.ts` — `next=/checkout` → redirect to `/learn?checkout=1`.
- `app/learn/page.tsx` `UpgradeHandler` — reused; `successUrl` → `/learn?upgraded=true` (no `session_id`).
- `components/layout/PremiumLocked.tsx` — CTA routes through `useUnlock` overlay (currently `router.push("/api/checkout")`).

---

## 1. Data model (manual migration)

`profiles` column rename. The user's Supabase MCP is read-only, so this is
applied **manually** in the Supabase SQL editor (SQL provided in the plan) and
mirrored into `lib/supabase/schema.sql`.

```sql
alter table public.profiles rename column stripe_customer_id  to provider_customer_id;
alter table public.profiles rename column stripe_payment_id   to provider_transaction_id;

-- Existing values are Stripe cus_/pi_ ids, meaningless to Paddle. Clear them so
-- a fresh Paddle checkout never reuses a Stripe id. is_premium is preserved:
-- anyone already paid keeps lifetime access and never re-checks out.
update public.profiles
  set provider_customer_id = null, provider_transaction_id = null;
```

- Keep `is_premium`, `premium_since`.
- No new columns. No `occurred_at`.
- RLS unchanged: still no client UPDATE policy; only the service-role client
  (webhook + verify) writes these columns.

Note: premium is not launched yet (`NEXT_PUBLIC_PREMIUM_ENABLED=false`), so
there are likely zero real customers; the `update` is safe regardless.

---

## 2. Server — Paddle plumbing

### `lib/paddle/env.ts` (unit-testable, no `server-only`)

```ts
export type PaddleEnv = "sandbox" | "production";
export function paddleEnvironment(): PaddleEnv {
  const value = process.env.PADDLE_ENV;
  if (value !== "sandbox" && value !== "production") {
    throw new Error(`PADDLE_ENV must be "sandbox" or "production" (got: ${value ?? "unset"})`);
  }
  return value;
}
```

Never silently default the environment (wrong default = wrong Paddle account).

### `lib/paddle/paddle.ts` (`server-only`)

Lazy `@paddle/paddle-node-sdk` singleton, `Environment.sandbox|production` from
`paddleEnvironment()`, API key from `process.env.PADDLE_API_KEY`.

### `lib/paddle/config.ts`

```ts
export function isPaddleConfigured(): boolean {
  return !!(process.env.PADDLE_API_KEY && process.env.PADDLE_WEBHOOK_SECRET);
}
```

### `lib/paddle/data.ts` (`server-only`, uses `supabaseAdmin`)

- `getProviderCustomerId(userId): Promise<string | null>`
- `setProviderCustomerId(userId, customerId): Promise<void>`
- `grantPremiumByProviderCustomerId(customerId, { transactionId }): Promise<{ granted: boolean; userId: string | null }>`
  - Look up profile by `provider_customer_id`. None → `{ granted:false, userId:null }`.
  - Already `is_premium` → `{ granted:false, userId }` (idempotent — no double grant, no double revenue event).
  - Else set `is_premium=true`, `premium_since=now()`, `provider_transaction_id=transactionId` → `{ granted:true, userId }`.

### `lib/paddle/checkout.ts` (`server-only`)

`getOrCreateProviderCustomer(userId, email): Promise<string>` — replicated from
the sibling:

1. `isPaddleConfigured()` guard.
2. Return existing `provider_customer_id` mapping if present.
3. Require a real `email` (throw if missing — Paddle rejects fabricated
   `.invalid` addresses).
4. `paddle.customers.list({ email: [email] })` → reuse first match if any
   (avoids the half-created-customer 409 lockout).
5. Else `paddle.customers.create({ email })`.
6. **Persist the `provider_customer_id` mapping before returning.**

### `lib/actions/billing.ts` (`"use server"`)

```ts
export interface CheckoutIntent { customerId: string; priceId: string; }

export async function startCheckoutAction(): Promise<
  { alreadyPremium: true } | CheckoutIntent
> {
  const { userId, email } = await requireUser();     // via server supabase client
  if (await isAlreadyPremium(userId)) return { alreadyPremium: true };
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;   // readable server-side
  if (!priceId) throw new Error("Billing is not configured");
  const customerId = await getOrCreateProviderCustomer(userId, email);
  return { customerId, priceId };
}
```

No portal action. The client never chooses the customer id — the trust boundary.

---

## 3. Webhook

### `lib/paddle/webhook.ts` (pure, unit-testable)

```ts
export interface PaddleEventLike {
  eventType: string;
  data: {
    id?: string;               // txn_... for transaction events
    customerId?: string;
    status?: string;
    details?: { totals?: { total?: string; currencyCode?: string } } | null;
  };
}

export interface BillingWriter {
  grantPremiumByProviderCustomerId(
    customerId: string,
    args: { transactionId: string | null },
  ): Promise<{ granted: boolean; userId: string | null }>;
}

// One-time: grant on a completed/paid transaction. No status→plan, no revoke.
const GRANT_EVENTS = new Set(["transaction.completed", "transaction.paid"]);

export interface HandleResult {
  granted: boolean;
  userId: string | null;
  amountTotal: string | null;
  currency: string | null;
  transactionId: string | null;
}

export async function handlePaddleEvent(
  event: PaddleEventLike,
  writer: BillingWriter,
): Promise<HandleResult> {
  if (!GRANT_EVENTS.has(event.eventType)) return { granted:false, userId:null, ... };
  const customerId = event.data.customerId;
  if (!customerId) return { granted:false, ... };   // not resolvable to an account
  const transactionId = event.data.id ?? null;
  const { granted, userId } = await writer.grantPremiumByProviderCustomerId(customerId, { transactionId });
  return { granted, userId, amountTotal: totals.total, currency: totals.currencyCode, transactionId };
}
```

Keying off `provider_customer_id` (established server-side at checkout), **never**
`custom_data` — the overlay opens with `customer:{id}` and sends no
`custom_data`, so a handler keyed off `custom_data.user_id` would grant premium
to nobody (yet pass hand-fed unit tests).

### `app/api/paddle/webhook/route.ts`

- `isPaddleConfigured()` guard → 503 if not.
- Missing `paddle-signature` header → 400.
- `getPaddle().webhooks.unmarshal(rawBody, PADDLE_WEBHOOK_SECRET, signature)`
  (raw body, not parsed) → on throw, 400 "Invalid signature".
- Inject the concrete `BillingWriter` (backed by `lib/paddle/data.ts`), call
  `handlePaddleEvent`.
- If `result.granted && result.userId` → `captureServerEvent(userId,
  "purchase_completed", { amount_total, currency, transaction_id })` (posthog is
  server-only, kept out of the pure handler).
- Transient failure (writer throws) → 500 so Paddle retries.
- Unknown event type → handler returns `granted:false` → 200 (routes to the
  SDK's GenericEvent; no heavy typed construction).

**Compile-time field guard** (like the sibling): a `Pick<TransactionNotification
| TransactionCompletedNotification, "id" | "customerId" | "status" | "details">`
type so an upstream rename breaks the build rather than silently no-op'ing
grants. Uses the `*Notification` webhook-payload types, not the `Transaction`
API-response entity.

---

## 4. Reconcile — `app/api/premium/verify/route.ts`

Same path and role (covers a missed webhook), Paddle impl:

- Authed; per-user rate limit (keep existing `cooldown`).
- Already `is_premium` → `{ is_premium: true }`.
- No `provider_customer_id` → `{ is_premium: false }`.
- Else `paddle.transactions.list({ customerId: [id], status: ["completed"] })` →
  if any, reuse `grantPremiumByProviderCustomerId`; fire `purchase_completed` if
  it was a fresh grant (webhook guards against double-count). Return the result.

No `session_id` param (that was Stripe's Checkout Session id).

---

## 5. Client

### `hooks/usePaddle.ts` (`"use client"`)

`initializePaddle({ environment: NEXT_PUBLIC_PADDLE_ENV, token:
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN })` once. Never the server API key.

### `hooks/useUnlock.ts` (rewrite)

- No user → `openAuth('upgrade')` (unchanged, auth-first).
- Authed → `startCheckoutAction()`:
  - `{ alreadyPremium }` → `refreshPremiumStatus()`, `track('gate_converted')`, close.
  - `{ customerId, priceId }` → `track('checkout_started')` then
    ```ts
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { id: customerId },        // {id} XOR {email}; never both (TS error)
      settings: { displayMode: "overlay", variant: "one-page",
                  successUrl: `${origin}/learn?upgraded=true` },
    });
    ```
- `paddle` instance comes from `usePaddle()`. Email prefills automatically from
  the server-created customer record.

### Success handling

Overlay `successUrl` → `/learn?upgraded=true`. The **existing**
`UpgradeHandler` in `app/learn/page.tsx` already: sets the upgrade toast, calls
`verifyPremium()`, fires `gate_converted`, and strips the param. Change: drop
the `session_id` read (Paddle verify reconciles by customer). `verifyPremium`
mutation drops its `sessionId` argument.

### Auth hand-off — `app/auth/callback/route.ts`

`next=/checkout` currently server-POSTs `/api/checkout` and redirects to the
Stripe URL. With an overlay there is no server URL to redirect to, so instead
redirect to `/learn?checkout=1`. A small client effect (in the learn page, next
to `UpgradeHandler`) detects `?checkout=1` once authed and triggers the
`useUnlock` overlay. `/checkout` stays in `ALLOWED_NEXT_PATHS`.

### `components/layout/PremiumLocked.tsx`

Replace `router.push("/api/checkout")` with the `useUnlock` overlay trigger
(the current push to a POST-only route is already broken).

---

## 6. Environment

`.env.local.example` + `lib/validateEnv.ts` (`requiredForPremium`):

Add:
```
PADDLE_ENV=sandbox
PADDLE_API_KEY=                       # reused from the sibling (same sandbox key)
PADDLE_WEBHOOK_SECRET=                # this app's own notification-destination secret
NEXT_PUBLIC_PADDLE_PRICE_ID=          # single one-time price; read server + client (no drift)
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=      # this app's own client-side token (test_...)
```

Remove: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID`.

- Server API key never imported into `'use client'` code.
- `.env` lines are plain `KEY=value` (no `export` prefix).
- One price id, not a server/public pair — price ids aren't secret, and two
  vars would silently drift between displayed and charged price.

---

## 7. Paddle account setup (same account as the sibling)

Reuse `PADDLE_API_KEY`. Create **this app's own** catalog + credentials:

1. **Product** "CycleDutch Premium" + **one-time price** `{ amount: "499",
   currency: "EUR" }` (lowest denomination; one-time = no billing cycle).
   Create via the Paddle Node SDK seed script (MCP may fail with an auth-format
   error; the SDK works with the sandbox key).
2. **Client-side token** — dashboard only (Developer tools → Authentication →
   client-side tokens; a `test_…` value on sandbox). Cannot be minted via the
   API key.
3. **Notifications destination** — a new destination for **this app's** webhook
   URL, with its own signing secret → `PADDLE_WEBHOOK_SECRET`. (Cross-app
   safety: the handler keys by `provider_customer_id`, so the other app's
   customer events won't match a row here and are safely ignored — but each app
   still gets its own destination.)
4. **Default payment link** — dashboard (Checkout → Checkout settings), or the
   overlay errors. Localhost is fine on sandbox; production needs an approved
   domain.

Catalog creation happens via SDK/dashboard, not committed code. Token +
destination + payment link are dashboard steps dictated in the plan.

---

## 8. Stripe removal (last)

- Delete `app/api/checkout/route.ts`, `app/api/stripe/webhook/route.ts`,
  `scripts/stripe-webhook-test.mjs`, the `stripe:webhook` npm script, the
  `stripe` dependency.
- Remove `STRIPE_*` env from `.env.local.example` and `validateEnv`.
- Rewrite/replace the billing tests (below) for Paddle.

---

## 9. Testing (sandbox)

Vitest — **run via PowerShell** (vitest can crash under Git Bash on Windows due
to drive-casing). Stripe CLI not needed; use the replay script.

**Unit (pure, fake writer / env stubs):**
- `handlePaddleEvent`: `transaction.completed` with `customerId` → writer called,
  result propagates `granted`/`userId`/amounts. Unknown event → writer not
  called, `granted:false`. Missing `customerId` → not resolvable, `granted:false`.
- `paddleEnvironment()` fail-loud: unset/invalid → throws; `sandbox`/`production` → returns.
- `getOrCreateProviderCustomer`: reuse-by-email before create; require-email throws.
- Idempotent grant: already-premium → `granted:false`, no second write.

**Signature contract (replay script, `scripts/paddle-webhook-replay.mjs`):**
Sign with `paddle-signature: ts=<unix>;h1=HMAC_SHA256(secret, `<ts>:<rawBody>`)`.
- missing signature → 400
- bad signature → 400
- valid signature, unknown event type → 200 (verify + route, no heavy construction)

**End-to-end (sandbox):**
- Real overlay purchase with a Paddle test card → DB `is_premium` flips true.
- If webhooks can't reach localhost: replay a **real** captured
  `transaction.completed` payload (raw, snake_case) via the file mode of the
  replay script (needs the migration applied and matching `PADDLE_WEBHOOK_SECRET`).

**Green gate:** `npm run typecheck` and `npm run build` clean; billing unit
tests pass; then remove the `stripe` dependency.

---

## Gotchas carried over (that cost the sibling real time)

- **Provisioning bug:** bind by `provider_customer_id`, NOT `custom_data.user_id`
  (overlay sends no `custom_data`).
- **`customer` is `{id}` XOR `{email}`:** passing both to `Checkout.open` is a TS
  compile error. Create server-side with email; open with `{id}` only.
- **`unmarshal` builds typed events:** typed constructors throw on incomplete
  payloads and the route reports it as "Invalid signature". Prove signature +
  routing with an unknown event type; use real captured payloads for the full flow.
- **Paddle can't reach localhost:** replay signed payloads, or a tunnel, or a
  preview deploy.
- **Half-created customer → 409 lockout:** `customers.list({email})` and reuse
  before create; require a real email.
- **One price id, not two env vars.**
- **`.env` `export` prefix** may not be stripped by Next's loader — use plain `KEY=value`.
- **Paddle MCP auth-format failure:** fall back to the Node SDK for catalog + API.
- **Trust boundary:** the customer↔user mapping is established server-side before
  checkout; the webhook resolves the account by that mapping only.
