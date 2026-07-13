# Production Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 13 findings from the full-user-flow audit (landing → auth → learn → gate/checkout → review → test) so the premium path works end-to-end before the `NEXT_PUBLIC_PREMIUM_ENABLED` flag is flipped.

**Architecture:** No new subsystems. Changes are contained to the existing Next.js App Router pages, Zustand stores, hooks, and three API routes. The one schema change (Task 9) is a `create or replace function` migration on `upsert_question_progress`. All premium-path fixes are inert in production today because `PREMIUM_ENABLED` is false, so tasks can merge incrementally.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Zustand 5, Supabase (@supabase/ssr), Stripe 17, Vitest 4 + Testing Library.

**Conventions (from repo):**
- Test command: `npx vitest run <file>` (full suite: `npm run test:run`)
- API tests use `vi.hoisted` mock bundles — see `tests/api/checkout.test.ts` for the house style
- Commits: short subject, max 1–2 sentence body, **no Co-Authored-By trailer**
- No `any`, no hardcoded hex, all shared types in `types/index.ts`

**Task order matters:** Task 1 changes `uiStore`/`GateModal` signatures that Task 12 touches; Task 4 restructures `app/test/page.tsx` before Task 5 and Task 8 edit it again. Execute in order.

**Two decision points flagged for the user (not blockers):**
1. Task 9 makes "mastered" status regress-able (last answer wins). This is intended honesty, but it changes badge-adjacent UX.
2. Task 12 centralizes the "2,400+ expats" claim into a constant — someone must verify the number is true before premium launch. Code can't fix that.

---

## File Structure

| File | Change |
|---|---|
| `stores/uiStore.ts` | `openGate(moduleId?)` + `gateModuleId`, `checkoutError` state |
| `components/layout/AppShell.tsx` | Render `GateModal` globally, render checkout-error banner |
| `components/layout/GateModal.tsx` | Nullable module props, use `useModalFocus`, `SOCIAL_PROOF` constant |
| `app/auth/callback/route.ts` | Forward post-exchange cookies to `/api/checkout` |
| `app/api/checkout/route.ts` | Add `session_id={CHECKOUT_SESSION_ID}` to `success_url` |
| `app/api/premium/verify/route.ts` | Accept `?session_id=`, verify session directly with Stripe |
| `lib/mutations/verifyPremium.ts` | Pass optional session id through |
| `app/learn/page.tsx` | Pass `session_id` to verify, ReturnBanner via store, PreviewCompleteScreen nav |
| `app/test/page.tsx` | "See results" step, retry reset, auth-loading guard, test set as state, APP_PRICE/share-URL copy |
| `app/review/page.tsx` | Auth-loading guard, APP_PRICE copy |
| `app/learn/[moduleId]/page.tsx` | Gate waits for auth, ReturnBanner via store |
| `hooks/useQuestions.ts` | Random per-module sampling in `buildTestSet` |
| `hooks/useUnlock.ts` | Surface checkout errors via `uiStore` |
| `hooks/useModalFocus.ts` | **New** — shared dialog focus management |
| `components/layout/OnboardingOverlay.tsx` | Refactor onto `useModalFocus` |
| `components/layout/AuthModal.tsx` | Focus trap via `useModalFocus` |
| `stores/appStore.ts` | Last-answer-wins `answerQuestion` |
| `lib/supabase/schema.sql` + `lib/supabase/migrations/20260710_last_answer_wins.sql` | rpc last-answer-wins |
| `types/index.ts` | Nullable module on gate analytics events |
| `data/constants.ts` | `SOCIAL_PROOF` constant |
| `components/layout/HeroSection.tsx`, `components/layout/UpsellBanner.tsx`, `app/learn/layout.tsx` | Module-count copy |
| `CLAUDE.md`, `docs/ZUSTAND.md` | Stale numbers/keys, new store signatures |
| Tests: `tests/components/AppShell.test.tsx` (new), `tests/api/authCallback.test.ts` (new), `tests/integration/testFlow.test.tsx` (new), `tests/integration/moduleGate.test.tsx` (new), `tests/components/AuthModal.test.tsx` (new), plus edits to `tests/stores/uiStore.test.ts`, `tests/api/premiumVerify.test.ts`, `tests/api/checkout.test.ts`, `tests/hooks/useQuestions.test.ts`, `tests/hooks/useProgress.test.ts`, `tests/hooks/useUnlock.test.ts` | |

---

### Task 1: Render GateModal globally (openGate is currently a no-op)

`uiStore.openGate` sets `showGate: true` but **no component renders `GateModal`** — every Unlock CTA on `/review` and `/test` is dead. Render it once in `AppShell`, with optional module context so the copy adapts.

**Files:**
- Modify: `stores/uiStore.ts`
- Modify: `types/index.ts` (gate analytics events)
- Modify: `components/layout/GateModal.tsx`
- Modify: `components/layout/AppShell.tsx`
- Modify: `tests/stores/uiStore.test.ts`
- Test: `tests/components/AppShell.test.tsx` (new)

- [ ] **Step 1: Write the failing store test**

Add to `tests/stores/uiStore.test.ts` inside the `openGate / closeGate` describe block:

```ts
it('openGate stores the module context', () => {
  useUIStore.getState().openGate('priority')
  expect(useUIStore.getState().gateModuleId).toBe('priority')
})

it('openGate without a module clears the context', () => {
  useUIStore.getState().openGate('priority')
  useUIStore.getState().openGate()
  expect(useUIStore.getState().gateModuleId).toBeNull()
})

it('closeGate clears the module context', () => {
  useUIStore.getState().openGate('priority')
  useUIStore.getState().closeGate()
  expect(useUIStore.getState().gateModuleId).toBeNull()
})
```

Also add `gateModuleId: null,` to the reset object at the top of the file (line ~6) so `beforeEach` resets it.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/stores/uiStore.test.ts`
Expected: FAIL — `gateModuleId` is undefined / `openGate` takes no argument.

- [ ] **Step 3: Update `stores/uiStore.ts`**

```ts
import { create } from 'zustand'
import { markOnboardingDone } from '@/lib/onboarding'
import type { ModuleId } from '@/types'

export type AuthModalReason = 'save_progress' | 'upgrade'

interface UIState {
  showGate: boolean
  gateModuleId: ModuleId | null
  showAuth: boolean
  authReason: AuthModalReason | null
  newBadgeId: string | null
  showUpgradeToast: boolean
  onboardingDone: boolean
  showReturnBanner: boolean

  openGate: (moduleId?: ModuleId) => void
  closeGate: () => void
  openAuth: (reason: AuthModalReason) => void
  closeAuth: () => void
  showBadge: (badgeId: string) => void
  clearBadge: () => void
  setUpgradeToast: (show: boolean) => void
  completeOnboarding: () => void
  dismissReturnBanner: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  showGate: false,
  gateModuleId: null,
  showAuth: false,
  authReason: null,
  newBadgeId: null,
  showUpgradeToast: false,
  onboardingDone: false,
  showReturnBanner: true,

  openGate: (moduleId) => set({ showGate: true, gateModuleId: moduleId ?? null }),
  closeGate: () => set({ showGate: false, gateModuleId: null }),
  openAuth: (reason) => set({ showAuth: true, authReason: reason }),
  closeAuth: () => set({ showAuth: false }),
  showBadge: (badgeId) => set({ newBadgeId: badgeId }),
  clearBadge: () => set({ newBadgeId: null }),
  setUpgradeToast: (show) => set({ showUpgradeToast: show }),
  completeOnboarding: () => {
    markOnboardingDone()
    set({ onboardingDone: true })
  },
  dismissReturnBanner: () => set({ showReturnBanner: false }),
}))
```

- [ ] **Step 4: Run store test to verify pass**

Run: `npx vitest run tests/stores/uiStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Widen the gate analytics event types**

In `types/index.ts` (~line 213), the gate can now open without a module (from `/review`, `/test`):

```ts
  // --- conversion funnel ---
  gate_dismissed: { module: ModuleId | null };
  gate_next_module_clicked: { from_module: ModuleId | null; to_module: ModuleId };
```

- [ ] **Step 6: Make GateModal module props nullable**

In `components/layout/GateModal.tsx`, change the interface and the two places that assume a module exists:

```tsx
interface GateModalProps {
  moduleId: ModuleId | null;
  moduleName: string | null;
  nextModule: Module | null;
  onUnlock: () => void;
  onNextModule: (id: string) => void;
  onDismiss: () => void;
}
```

And the title (line ~69):

```tsx
        <h2 id="gate-modal-title" className="font-display font-extrabold text-2xl text-stone-900 text-center mb-2">
          {moduleName ? `Want to finish ${moduleName}?` : "Want the full course?"}
        </h2>
```

The `track('gate_dismissed', { module: moduleId })` and `track('gate_next_module_clicked', { from_module: moduleId, ... })` calls compile unchanged now that the event types accept `null`. The next-module nudge already hides when `nextModule` is null — pass `null` when there's no module context.

- [ ] **Step 7: Write the failing AppShell test**

Create `tests/components/AppShell.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppShell from "@/components/layout/AppShell";
import { useUIStore } from "@/stores/uiStore";

vi.mock("next/navigation", () => ({
  usePathname: () => "/review",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isPremium: false,
    isLoading: false,
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
    refreshPremiumStatus: vi.fn(),
  }),
}));
vi.mock("@/hooks/useUnlock", () => ({ useUnlock: () => vi.fn() }));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

describe("AppShell gate modal", () => {
  beforeEach(() => {
    useUIStore.setState({ showGate: false, gateModuleId: null, showAuth: false });
  });

  it("renders GateModal when the gate is opened without a module", () => {
    useUIStore.getState().openGate();
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Want the full course?")).toBeInTheDocument();
  });

  it("renders module-specific copy when opened with a module", () => {
    useUIStore.getState().openGate("priority");
    render(<AppShell>content</AppShell>);
    expect(screen.getByText("Want to finish Priority Rules?")).toBeInTheDocument();
  });

  it("closes on Not now", async () => {
    const user = userEvent.setup();
    useUIStore.getState().openGate();
    render(<AppShell>content</AppShell>);
    await user.click(screen.getByRole("button", { name: /not now/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run to verify failure**

Run: `npx vitest run tests/components/AppShell.test.tsx`
Expected: FAIL — no dialog rendered.

- [ ] **Step 9: Render GateModal in `components/layout/AppShell.tsx`**

Full replacement:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Nav from "@/components/layout/Nav";
import BottomNav from "@/components/layout/BottomNav";
import AuthModal from "@/components/layout/AuthModal";
import GateModal from "@/components/layout/GateModal";
import modules from "@/data/modules";
import { useUIStore } from "@/stores/uiStore";
import { useUnlock } from "@/hooks/useUnlock";

interface AppShellProps {
  children: React.ReactNode;
  wrongCount?: number;
  logoOnly?: boolean;
}

export default function AppShell({
  children,
  wrongCount = 0,
  logoOnly,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const showAuth = useUIStore((s) => s.showAuth);
  const authReason = useUIStore((s) => s.authReason);
  const closeAuth = useUIStore((s) => s.closeAuth);
  const showGate = useUIStore((s) => s.showGate);
  const gateModuleId = useUIStore((s) => s.gateModuleId);
  const closeGate = useUIStore((s) => s.closeGate);
  const handleUnlock = useUnlock(closeGate);

  const gateModuleIndex = modules.findIndex((m) => m.id === gateModuleId);
  const gateModule = gateModuleIndex >= 0 ? modules[gateModuleIndex] : null;
  const nextModule =
    gateModule && gateModuleIndex + 1 < modules.length
      ? modules[gateModuleIndex + 1]
      : null;

  // Hide bottom nav during module sessions — back button handles navigation there
  const showBottomNav = !pathname.startsWith("/learn/");

  return (
    <>
      <Nav
        currentRoute={pathname}
        wrongCount={wrongCount}
        logoOnly={logoOnly}
      />
      {showAuth && authReason && (
        <AuthModal reason={authReason} onClose={closeAuth} />
      )}
      {showGate && (
        <GateModal
          moduleId={gateModule?.id ?? null}
          moduleName={gateModule?.title ?? null}
          nextModule={nextModule}
          onUnlock={handleUnlock}
          onNextModule={(id) => {
            closeGate();
            router.push(`/learn/${id}`);
          }}
          onDismiss={closeGate}
        />
      )}
      {children}
      {showBottomNav && (
        <BottomNav currentRoute={pathname} wrongCount={wrongCount} />
      )}
    </>
  );
}
```

- [ ] **Step 10: Run tests + typecheck**

Run: `npx vitest run tests/components/AppShell.test.tsx tests/stores/uiStore.test.ts && npm run typecheck`
Expected: PASS, no type errors.

- [ ] **Step 11: Commit**

```bash
git add stores/uiStore.ts types/index.ts components/layout/GateModal.tsx components/layout/AppShell.tsx tests/stores/uiStore.test.ts tests/components/AppShell.test.tsx
git commit -m "fix: render GateModal globally so unlock CTAs work"
```

---

### Task 2: Forward fresh session cookies in the auth-callback checkout hand-off

After `exchangeCodeForSession`, the new session cookies live in the mutated cookie store — but the internal fetch to `/api/checkout` forwards `request.headers.get("cookie")` (pre-auth). Checkout sees no session → 401 → `checkout_failed`. Build the header from the store instead.

**Files:**
- Modify: `app/auth/callback/route.ts`
- Test: `tests/api/authCallback.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/api/authCallback.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession, cookieGetAll } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  cookieGetAll: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { exchangeCodeForSession } })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: cookieGetAll })),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback checkout hand-off", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
    // Simulates the cookie store AFTER the exchange wrote session cookies.
    cookieGetAll.mockReset().mockReturnValue([
      { name: "sb-verifier", value: "stale" },
      { name: "sb-auth-token", value: "fresh-session" },
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards post-exchange cookies to /api/checkout, not the stale request header", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ url: "https://stripe.test/pay" }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/checkout",
      { headers: { cookie: "sb-verifier=stale" } },
    );
    const res = await GET(req);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/checkout",
      expect.objectContaining({
        method: "POST",
        headers: { cookie: "sb-verifier=stale; sb-auth-token=fresh-session" },
      }),
    );
    expect(res.headers.get("location")).toBe("https://stripe.test/pay");
  });

  it("redirects to checkout_failed when checkout is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unauthorized", { status: 401 })),
    );
    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/checkout",
    );
    const res = await GET(req);
    expect(res.headers.get("location")).toContain("error=checkout_failed");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/api/authCallback.test.ts`
Expected: FAIL — fetch called with the stale request-header cookie, not the store cookies.

- [ ] **Step 3: Update `app/auth/callback/route.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_NEXT_PATHS = ["/learn", "/review", "/test", "/checkout"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/learn";
  const next = ALLOWED_NEXT_PATHS.includes(rawNext) ? rawNext : "/learn";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/learn?auth_error=1", request.url));
    }

    if (next === "/checkout") {
      // The session cookies were just written during the code exchange - the
      // incoming request header predates them. Rebuild the header from the
      // mutated cookie store so /api/checkout sees the fresh session.
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ");
      const res = await fetch(`${origin}/api/checkout`, {
        method: "POST",
        headers: { cookie: cookieHeader },
      });
      if (!res.ok) {
        return NextResponse.redirect(
          new URL("/learn?error=checkout_failed", request.url),
        );
      }
      const { url } = (await res.json()) as { url?: string };
      // No url means alreadyPremium - nothing to pay for
      return NextResponse.redirect(url ?? new URL("/learn", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/api/authCallback.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/auth/callback/route.ts tests/api/authCallback.test.ts
git commit -m "fix: forward fresh session cookies to checkout after magic-link exchange"
```

---

### Task 3: Reconcile premium via `session_id` on return from Stripe

`/api/premium/verify` needs `stripe_customer_id`, but the webhook only writes it once payment is `paid` — so a fully missed webhook can never be reconciled. Pass Stripe's `{CHECKOUT_SESSION_ID}` back on the success URL and let verify check that session directly.

**Files:**
- Modify: `app/api/checkout/route.ts` (success_url)
- Modify: `app/api/premium/verify/route.ts`
- Modify: `lib/mutations/verifyPremium.ts`
- Modify: `app/learn/page.tsx` (UpgradeHandler)
- Modify: `tests/api/premiumVerify.test.ts`, `tests/api/checkout.test.ts`

- [ ] **Step 1: Write the failing checkout test**

Add to `tests/api/checkout.test.ts` (inside the existing describe, mocks unchanged):

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/api/checkout.test.ts`
Expected: FAIL on `success_url`.

- [ ] **Step 3: Update `app/api/checkout/route.ts` success_url (line ~41)**

```ts
      success_url: `${baseUrl}/learn?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
```

- [ ] **Step 4: Run checkout tests to verify pass**

Run: `npx vitest run tests/api/checkout.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing verify tests**

Update `tests/api/premiumVerify.test.ts`. Add `sessionRetrieve` to the hoisted bundle and the Stripe mock, add a request helper, and pass a request to every existing `GET()` call:

```ts
const { getUser, single, updateEq, paymentIntentsList, sessionRetrieve, isRateLimited } =
  vi.hoisted(() => ({
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
```

Below the imports add:

```ts
import { NextRequest } from "next/server";

const req = (qs = "") =>
  new NextRequest(`http://localhost:3000/api/premium/verify${qs}`);
```

Change every existing `await GET()` to `await GET(req())`, add `sessionRetrieve.mockReset();` to `beforeEach`, and add these cases:

```ts
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
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run tests/api/premiumVerify.test.ts`
Expected: FAIL — new cases fail (route ignores `session_id`); existing cases still pass.

- [ ] **Step 7: Update `app/api/premium/verify/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/cooldown";

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each pass can hit the Stripe API; throttle per user to protect the quota.
  if (isRateLimited(`verify:${user.id}`, 10_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_premium, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Already premium - nothing to do
  if (profile?.is_premium) {
    return NextResponse.json({ is_premium: true });
  }

  // Direct session check - covers a missed webhook, where no customer id has
  // been stored yet. The id comes from Stripe's success_url redirect and is
  // only trusted if the session's metadata names this user.
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.metadata?.supabase_user_id === user.id &&
        session.payment_status === "paid"
      ) {
        await supabaseAdmin
          .from("profiles")
          .update({
            is_premium: true,
            premium_since: new Date().toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_payment_id: session.payment_intent as string,
          })
          .eq("id", user.id);
        return NextResponse.json({ is_premium: true });
      }
    } catch {
      // Unknown/foreign session id - fall through to the customer check
    }
  }

  // No Stripe customer yet - definitely not premium
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ is_premium: false });
  }

  // Check Stripe directly for a completed payment
  const payments = await stripe.paymentIntents.list({
    customer: profile.stripe_customer_id,
    limit: 5,
  });

  const hasPaid = payments.data.some((p) => p.status === "succeeded");

  if (hasPaid) {
    await supabaseAdmin
      .from("profiles")
      .update({ is_premium: true, premium_since: new Date().toISOString() })
      .eq("id", user.id);
  }

  return NextResponse.json({ is_premium: hasPaid });
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run tests/api/premiumVerify.test.ts`
Expected: PASS.

- [ ] **Step 9: Thread the session id through the client**

`lib/mutations/verifyPremium.ts`:

```ts
import { useAppStore } from "@/stores/appStore";

// Reconciles premium status against Stripe via /api/premium/verify - covers
// the race where the user returns from checkout before the webhook lands.
// Pass the session_id from Stripe's success redirect when available so a
// fully missed webhook can still be reconciled.
// Never throws; a failed check just leaves the store as-is.
const verifyPremium = async (sessionId?: string): Promise<boolean> => {
  try {
    const query = sessionId
      ? `?session_id=${encodeURIComponent(sessionId)}`
      : "";
    const res = await fetch(`/api/premium/verify${query}`);
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

In `app/learn/page.tsx` `UpgradeHandler` (line ~148), read the id before `router.replace` strips it:

```tsx
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      const sessionId = searchParams.get("session_id") ?? undefined;
      setUpgradeToast(true);
      router.replace("/learn");
      // Reconcile against Stripe directly - the webhook may not have landed
      // yet when the user is redirected back from checkout.
      verifyPremium(sessionId);
      track("gate_converted", {});
      const timer = setTimeout(() => setUpgradeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, setUpgradeToast, track]);
```

- [ ] **Step 10: Full suite + typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add app/api/checkout/route.ts app/api/premium/verify/route.ts lib/mutations/verifyPremium.ts app/learn/page.tsx tests/api/premiumVerify.test.ts tests/api/checkout.test.ts
git commit -m "fix: reconcile premium from checkout session id on return from Stripe"
```

---

### Task 4: Test flow — retry reset + explicit "See results" step

Two defects in `app/test/page.tsx`: (a) "Try again" doesn't reset `submitted`/`selectedId`, so the first question of a retake mounts disabled and gets skipped; (b) the last answer jumps straight to results with no pause, unlike every other question. Restructure: `handleAnswer` only records; a "See results" button finishes the test.

**Files:**
- Modify: `app/test/page.tsx`
- Test: `tests/integration/testFlow.test.tsx` (new)

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/testFlow.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TestPage from "@/app/test/page";
import { useAppStore } from "@/stores/appStore";
import { useUIStore } from "@/stores/uiStore";

const authState = {
  user: { id: "u1", email: "a@b.com" } as never,
  isPremium: true,
  isLoading: false,
  sendMagicLink: vi.fn(),
  signOut: vi.fn(),
  refreshPremiumStatus: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/test",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/config", () => ({ PREMIUM_ENABLED: true }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));
vi.mock("@/lib/mutations/saveTestResult", () => ({
  default: vi.fn(async () => undefined),
}));
vi.mock("@/hooks/useQuestions", () => {
  const q = (id: string, module: string) => ({
    id,
    module,
    skill: "Skill",
    difficulty: "easy",
    type: "true_false",
    prompt: `Prompt ${id}`,
    options: [
      { id: "a", label: "True" },
      { id: "b", label: "False" },
    ],
    correct: "a",
    feedback: { title: "Correct", body: "b", rule: "r", tip: "t" },
    status: "active",
  });
  const q1 = q("fundamentals_001", "fundamentals");
  const q2 = q("priority_001", "priority");
  const all = [q1, q2];
  return {
    activeQuestions: all,
    useQuestions: () => ({
      allQuestions: all,
      totalQuestions: all.length,
      questionsByModule: (m: string) => all.filter((x) => x.module === m),
      buildTestSet: () => all,
    }),
  };
});

describe("test flow", () => {
  beforeEach(() => {
    useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: true });
    useUIStore.setState({ newBadgeId: null });
  });

  it("requires an explicit 'See results' click after the last question", async () => {
    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByRole("button", { name: /start test/i }));

    await user.click(screen.getByRole("button", { name: /false/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));

    await user.click(screen.getByRole("button", { name: /false/i }));
    // Still on the question - results only after the explicit click
    expect(screen.queryByText(/not quite there yet/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /see results/i }));
    expect(screen.getByText(/not quite there yet/i)).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("resets question state on retry so the first question is answerable", async () => {
    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByRole("button", { name: /start test/i }));
    await user.click(screen.getByRole("button", { name: /false/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("button", { name: /false/i }));
    await user.click(screen.getByRole("button", { name: /see results/i }));

    await user.click(screen.getByRole("button", { name: /try again/i }));
    await user.click(screen.getByRole("button", { name: /start test/i }));

    // Without the reset, the first question mounts already-answered:
    // options disabled and a premature Next button visible.
    expect(
      screen.queryByRole("button", { name: /next question/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "True" })).toBeEnabled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/integration/testFlow.test.tsx`
Expected: FAIL — no "See results" button exists; retry leaves the first question disabled.

- [ ] **Step 3: Restructure `app/test/page.tsx`**

Replace `handleAnswer` (line ~273) with a record-only version plus a `finishTest` function:

```tsx
  async function handleAnswer(optionId: string, correct: boolean) {
    setSelectedId(optionId);
    setSubmitted(true);
    setAnswers((prev) => [
      ...prev,
      { question: currentQ, selectedId: optionId, correct },
    ]);

    // Record progress in background
    await progress.recordAnswer(currentQ.id, correct);
    await track("question_answered", {
      question_id: currentQ.id,
      module: currentQ.module,
      skill: currentQ.skill,
      difficulty: currentQ.difficulty,
      correct,
      time_to_answer_ms: Date.now() - questionShownAt.current,
      context: "test",
    });
    await checkModuleBadge(currentQ.module);
  }

  async function finishTest() {
    const scorePct = Math.round(
      (answers.filter((a) => a.correct).length / answers.length) * 100,
    );
    const didPass = scorePct >= TEST_PASS_PCT;
    await track("test_completed", { score_pct: scorePct, passed: didPass });
    if (didPass) {
      await awardBadge("badge_master");
    }
    if (user) {
      // Background write - the results screen never blocks on it
      const answerMap = Object.fromEntries(
        answers.map((a) => [a.question.id, a.selectedId]),
      );
      saveTestResult(scorePct, answerMap).catch(() => {
        // Non-fatal - already logged in the mutation
      });
    }
    setPhase("results");
  }
```

(`answers` is safe to read in `finishTest`: the state update from `handleAnswer` commits before the user's separate "See results" click.)

Replace the post-answer button block in the questions phase (line ~363):

```tsx
            {submitted && (
              <div className="mt-4 animate-fade-up">
                {index + 1 < testSet.length ? (
                  <Button full size="lg" onClick={handleNext}>
                    Next question <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                ) : (
                  <Button full size="lg" onClick={finishTest}>
                    See results <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}
```

Update the retry button in the results phase (line ~571):

```tsx
                onClick={() => {
                  track("test_retried", { previous_score_pct: scorePct });
                  setPhase("intro");
                  setAnswers([]);
                  setIndex(0);
                  setSubmitted(false);
                  setSelectedId(null);
                }}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/integration/testFlow.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/test/page.tsx tests/integration/testFlow.test.tsx
git commit -m "fix: reset test state on retry, add explicit See results step"
```

---

### Task 5: Don't flash free/gate screens while auth is loading

`isPremium` starts false until the profile fetch resolves, so premium users see the FOMO screen on `/test` and `/review`, and the inline gate (plus a spurious `gate_seen` event) on module pages, on every hard load. The learn index already guards with `isAuthLoading` — apply the same pattern.

**Files:**
- Modify: `app/test/page.tsx`, `app/review/page.tsx`, `app/learn/[moduleId]/page.tsx`
- Modify: `tests/integration/testFlow.test.tsx`
- Test: `tests/integration/moduleGate.test.tsx` (new)

- [ ] **Step 1: Write the failing test-page case**

In `tests/integration/testFlow.test.tsx` the `authState` object is mutable — add:

```tsx
  it("shows neither test nor upsell while auth is loading", () => {
    authState.isPremium = false;
    authState.isLoading = true;
    render(<TestPage />);
    expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start test/i }),
    ).not.toBeInTheDocument();
    authState.isPremium = true;
    authState.isLoading = false;
  });
```

- [ ] **Step 2: Write the failing module-gate test**

Create `tests/integration/moduleGate.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ModuleSessionPage from "@/app/learn/[moduleId]/page";
import { useAppStore } from "@/stores/appStore";
import { activeQuestions } from "@/hooks/useQuestions";
import { FREE_PER_MODULE } from "@/types";

const authState = {
  user: null as never,
  isPremium: false,
  isLoading: true,
  sendMagicLink: vi.fn(),
  signOut: vi.fn(),
  refreshPremiumStatus: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/priority",
  useParams: () => ({ moduleId: "priority" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/config", () => ({ PREMIUM_ENABLED: true }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/useUnlock", () => ({ useUnlock: () => vi.fn() }));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

describe("module gate during auth load", () => {
  it("does not show the gate while auth is still resolving", () => {
    useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false });
    const priority = activeQuestions.filter((q) => q.module === "priority");
    for (const q of priority.slice(0, FREE_PER_MODULE)) {
      useAppStore.getState().answerQuestion(q.id, true);
    }
    render(<ModuleSessionPage />);
    expect(screen.queryByText(/free preview complete/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/integration/testFlow.test.tsx tests/integration/moduleGate.test.tsx`
Expected: FAIL — upsell/gate content renders while `isLoading` is true.

- [ ] **Step 4: Add the guards**

`app/test/page.tsx` — change the hook call (line ~140) and the free-screen check (line ~186):

```tsx
  const { user, isPremium, isLoading: isAuthLoading } = useAuth();
```

```tsx
  if (!PREMIUM_ENABLED) {
    return <FreeTestScreen />;
  }
  if (isAuthLoading) {
    return (
      <AppShell wrongCount={0}>
        <main className="min-h-dvh bg-stone-50" />
      </AppShell>
    );
  }
  if (!isPremium) {
    return <FreeTestScreen />;
  }
```

`app/review/page.tsx` — same shape (line ~333 and ~360):

```tsx
  const { isPremium, isLoading: isAuthLoading } = useAuth();
```

```tsx
  if (!PREMIUM_ENABLED) {
    return <FreeReviewScreen />;
  }
  if (isAuthLoading) {
    return (
      <AppShell wrongCount={0}>
        <main className="min-h-dvh bg-stone-50" />
      </AppShell>
    );
  }
  if (!isPremium) {
    return <FreeReviewScreen />;
  }
```

`app/learn/[moduleId]/page.tsx` — gate waits for auth (line ~75):

```tsx
  // Gate: free users after FREE_PER_MODULE questions, unless module is always
  // free. Waits for auth so premium users never see a gate flash (and no
  // spurious gate_seen event fires while the profile is still loading).
  const hitGate =
    !isAuthLoading &&
    !isPremium &&
    !mod?.alwaysFree &&
    currentIndex >= FREE_PER_MODULE;
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/integration/testFlow.test.tsx tests/integration/moduleGate.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/test/page.tsx app/review/page.tsx "app/learn/[moduleId]/page.tsx" tests/integration/testFlow.test.tsx tests/integration/moduleGate.test.tsx
git commit -m "fix: wait for auth before showing gate and free screens"
```

---### Task 6: PreviewCompleteScreen is a dead end — add nav and free escape hatches

The screen replaces `/learn` with a bare dark div: no Nav, no BottomNav, no way to reach the always-free Fundamentals module or the Guide.

**Files:**
- Modify: `app/learn/page.tsx` (PreviewCompleteScreen only)

- [ ] **Step 1: Wrap in AppShell and add the escape-hatch section**

In `app/learn/page.tsx`, add `import Link from "next/link";` to the imports, then change `PreviewCompleteScreen`'s return: wrap everything in `AppShell`, and insert a free-links section between the module cards and the second CTA:

```tsx
  return (
    <AppShell wrongCount={0}>
      <div className="min-h-dvh bg-stone-900">
        {/* Dark hero */}
        {/* ... existing hero, progress bar, first CTA unchanged ... */}

        {/* Incomplete module cards */}
        {/* ... existing grid unchanged ... */}

        {/* Free escape hatches - this screen must never be a dead end */}
        <div className="px-5 pb-10 max-w-md mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-stone-500 mb-3">
            Keep practicing free
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/learn/fundamentals"
              className="text-sm font-display font-bold text-white underline underline-offset-4 hover:text-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
            >
              Fundamentals - always free
            </Link>
            <Link
              href="/guide"
              className="text-sm font-display font-bold text-white underline underline-offset-4 hover:text-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
            >
              Read the Guide
            </Link>
          </div>
        </div>

        {/* Second CTA */}
        {/* ... existing second CTA unchanged ... */}
      </div>
    </AppShell>
  );
```

(Keep all existing hero/cards/CTA JSX exactly as is — only the wrapper and the new section change.)

- [ ] **Step 2: Verify**

Run: `npm run test:run && npm run typecheck`
Expected: PASS (no existing test renders PreviewCompleteScreen; visual check happens in the final verification task).

- [ ] **Step 3: Commit**

```bash
git add app/learn/page.tsx
git commit -m "fix: add nav and free links to preview-complete screen"
```

---

### Task 7: Surface checkout failures to the user

`useUnlock` swallows errors — a failed checkout leaves the CTA silently doing nothing. Store an error message in `uiStore`; `AppShell` renders it as a dismissible banner.

**Files:**
- Modify: `stores/uiStore.ts`
- Modify: `hooks/useUnlock.ts`
- Modify: `components/layout/AppShell.tsx`
- Modify: `tests/hooks/useUnlock.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/hooks/useUnlock.test.ts` (reuse the file's existing mocks for supabase/fetch; the key new assertion is against the store):

```ts
it("sets a checkout error in the ui store when the request fails", async () => {
  // Arrange an authenticated user and a failing checkout, using this file's
  // existing supabase getUser mock:
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));

  const { result } = renderHook(() => useUnlock());
  await act(async () => {
    await result.current();
  });

  expect(useUIStore.getState().checkoutError).toMatch(/checkout/i);
});
```

Import `useUIStore` at the top of the test file and reset `checkoutError: null` in its `beforeEach` state setup. Adapt the mock names to the file's existing hoisted bundle.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/hooks/useUnlock.test.ts`
Expected: FAIL — `checkoutError` is undefined.

- [ ] **Step 3: Add state to `stores/uiStore.ts`**

Add to the interface:

```ts
  checkoutError: string | null
  setCheckoutError: (message: string | null) => void
```

Add to the store body:

```ts
  checkoutError: null,
  setCheckoutError: (message) => set({ checkoutError: message }),
```

- [ ] **Step 4: Update `hooks/useUnlock.ts`**

```ts
'use client'

import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { useAnalytics } from '@/hooks/useAnalytics'
import { createClient } from '@/lib/supabase'
import { logError } from '@/lib/logger'

export function useUnlock(onClose?: () => void) {
  const { refreshPremiumStatus } = useAuth()
  const openAuth = useUIStore((s) => s.openAuth)
  const setCheckoutError = useUIStore((s) => s.setCheckoutError)
  const { track } = useAnalytics()

  return useCallback(async () => {
    setCheckoutError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      onClose?.()
      openAuth('upgrade')
      return
    }

    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      if (!res.ok) {
        throw new Error(`Checkout request failed (${res.status})`)
      }
      const data = (await res.json()) as { alreadyPremium?: boolean; url?: string }
      if (data.alreadyPremium) {
        await refreshPremiumStatus()
        track('gate_converted', {})
        onClose?.()
        return
      }
      if (!data.url) {
        throw new Error('Checkout session has no URL')
      }
      track('checkout_started', {})
      window.location.href = data.url
    } catch (err) {
      logError('useUnlock', err)
      setCheckoutError("Couldn't start checkout. Please try again.")
    }
  }, [refreshPremiumStatus, openAuth, onClose, track, setCheckoutError])
}
```

- [ ] **Step 5: Render the banner in `components/layout/AppShell.tsx`**

Add the selectors:

```tsx
  const checkoutError = useUIStore((s) => s.checkoutError);
  const setCheckoutError = useUIStore((s) => s.setCheckoutError);
```

Insert directly after `<Nav ... />`:

```tsx
      {checkoutError && (
        <div className="bg-red-light border-b border-red text-red-dark px-5 py-3 flex items-center justify-between gap-3 animate-fade-up">
          <span className="text-sm font-display font-medium">
            {checkoutError}
          </span>
          <button
            onClick={() => setCheckoutError(null)}
            className="text-red-dark/70 hover:text-red-dark text-sm font-display shrink-0 focus-visible:outline-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
```

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run tests/hooks/useUnlock.test.ts tests/components/AppShell.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add stores/uiStore.ts hooks/useUnlock.ts components/layout/AppShell.tsx tests/hooks/useUnlock.test.ts
git commit -m "fix: surface checkout failures instead of swallowing them"
```

---

### Task 8: Randomize the test set

`buildTestSet` takes the first 3 questions per module — exactly the free-preview questions users already saw with feedback, identical on every retake. Sample 3 at random per module, and rebuild the set per attempt.

**Files:**
- Modify: `hooks/useQuestions.ts`
- Modify: `app/test/page.tsx` (test set becomes state)
- Modify: `tests/hooks/useQuestions.test.ts`

- [ ] **Step 1: Update the tests**

In `tests/hooks/useQuestions.test.ts`, **delete** the `"is deterministic - same result on repeated calls"` test and replace the `"contains at most 3 questions per module"` test with:

```ts
    it("returns exactly 3 questions per module with no duplicates", () => {
      const { result } = renderHook(() => useQuestions());
      const testSet = result.current.buildTestSet();
      const ids = new Set(testSet.map((q) => q.id));
      expect(ids.size).toBe(testSet.length);
      for (const mod of modules) {
        const count = testSet.filter((q) => q.module === mod.id).length;
        expect(count, `${mod.id} should have exactly 3 in test set`).toBe(3);
      }
    });

    it("only returns active questions from the module bank", () => {
      const { result } = renderHook(() => useQuestions());
      const activeIds = new Set(activeQuestions.map((q) => q.id));
      for (const q of result.current.buildTestSet()) {
        expect(activeIds.has(q.id)).toBe(true);
      }
    });
```

(Every module has ≥8 active questions, so "exactly 3" is safe.)

- [ ] **Step 2: Run to verify current behavior passes / duplicates test is meaningful**

Run: `npx vitest run tests/hooks/useQuestions.test.ts`
Expected: PASS (the current `slice(0, 3)` also satisfies these — this task's change is behavioral, guarded by review, not by a red test; randomness can't be asserted deterministically).

- [ ] **Step 3: Implement sampling in `hooks/useQuestions.ts`**

```ts
"use client";

import type { Question, ModuleId } from "@/types";
import questionsData from "@/data/questions.json";
import modules from "@/data/modules";

const TEST_PER_MODULE = 3;

// Module-level constant - imported at build time, never changes at runtime.
// Exported for use in other hooks (useProgress, useBadges) that need it
// outside the hook call pattern.
export const activeQuestions: Question[] = (questionsData as Question[]).filter(
  (q) => q.status === "active",
);

// Fisher-Yates on a copy - the source array is build-time constant.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useQuestions() {
  function questionsByModule(moduleId: ModuleId): Question[] {
    return activeQuestions.filter((q) => q.module === moduleId);
  }

  // 21 questions - TEST_PER_MODULE sampled at random from each module.
  // Resampled on every call: callers that need a stable set for a session
  // (the Test page) must hold the result in state.
  function buildTestSet(): Question[] {
    return modules.flatMap((mod) =>
      shuffle(questionsByModule(mod.id as ModuleId)).slice(0, TEST_PER_MODULE),
    );
  }

  return {
    allQuestions: activeQuestions,
    totalQuestions: activeQuestions.length,
    questionsByModule,
    buildTestSet,
  };
}
```

- [ ] **Step 4: Hold the set in state on the Test page**

In `app/test/page.tsx`, replace `const testSet = buildTestSet();` (line ~153) with:

```tsx
  const [testSet, setTestSet] = useState<Question[]>(() => buildTestSet());
```

And add a fresh sample to the retry handler (after the resets added in Task 4):

```tsx
                onClick={() => {
                  track("test_retried", { previous_score_pct: scorePct });
                  setPhase("intro");
                  setAnswers([]);
                  setIndex(0);
                  setSubmitted(false);
                  setSelectedId(null);
                  setTestSet(buildTestSet());
                }}
```

(`FreeTestScreen` keeps calling `buildTestSet()` per render — it only reads `.length`, which is stable.)

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/hooks/useQuestions.test.ts tests/integration/testFlow.test.tsx && npm run typecheck`
Expected: PASS (the testFlow mock's `buildTestSet` is deterministic, so those tests are unaffected).

- [ ] **Step 6: Commit**

```bash
git add hooks/useQuestions.ts app/test/page.tsx tests/hooks/useQuestions.test.ts
git commit -m "feat: sample test questions randomly per attempt"
```

---

### Task 9: Wrong answers re-enter the review queue (last answer wins)

`answerQuestion` and the Postgres rpc both do sticky-correct (`correct || isCorrect`), so a question answered right once can never return to Review — even after failing it in the Test. Switch both to last-answer-wins.

**Known consequence (accepted):** module "mastered" status and green dots can regress when a previously-correct question is missed again. Sign-in sync still OR-merges (`mergeProgress`) — a conflict between an anonymous local answer and an older server row resolves optimistically; that's a sync-conflict rule, not answer semantics, and keeps its comment.

**Files:**
- Modify: `stores/appStore.ts`
- Modify: `lib/supabase/schema.sql`
- Create: `lib/supabase/migrations/20260710_last_answer_wins.sql`
- Modify: `tests/hooks/useProgress.test.ts`

- [ ] **Step 1: Write the failing test**

Add to the `getReviewQueue` describe block in `tests/hooks/useProgress.test.ts`:

```ts
    it('re-adds a previously-correct question when answered wrong again', () => {
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, true)
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, false)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getReviewQueue().map((q) => q.id)).toContain(priorityQuestions[0].id)
    })

    it('removes a question once the latest answer is correct', () => {
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, false)
      useAppStore.getState().answerQuestion(priorityQuestions[0].id, true)
      const { result } = renderHook(() => useProgress())
      expect(result.current.getReviewQueue().map((q) => q.id)).not.toContain(priorityQuestions[0].id)
    })
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/hooks/useProgress.test.ts`
Expected: FAIL — first new test fails (sticky-correct keeps it out of the queue).

- [ ] **Step 3: Update `stores/appStore.ts`**

Replace `answerQuestion` (line ~38):

```ts
      answerQuestion: (id, isCorrect) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [id]: {
              seen: true,
              // Last answer wins: missing a previously-correct question puts
              // it back in the review queue.
              correct: isCorrect,
            },
          },
        })),
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/hooks/useProgress.test.ts tests/hooks/useBadges.test.ts tests/integration/moduleSession.test.tsx`
Expected: PASS. If any existing test asserted sticky-correct, update it to the new last-answer-wins expectation — the intent change is this task's whole point.

- [ ] **Step 5: Mirror in Postgres**

In `lib/supabase/schema.sql` (line ~85) change:

```sql
    correct          = question_progress.correct or excluded.correct,
```

to:

```sql
    correct          = excluded.correct,
```

Create `lib/supabase/migrations/20260710_last_answer_wins.sql`:

```sql
-- Last answer wins: missing a previously-correct question puts it back in
-- the review queue. Replaces the sticky-correct upsert.
create or replace function public.upsert_question_progress(
  p_question_id text,
  p_correct     boolean
) returns void as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into question_progress (user_id, question_id, seen, correct, attempts, last_answered_at)
  values (auth.uid(), p_question_id, true, p_correct, 1, now())
  on conflict (user_id, question_id) do update set
    correct          = excluded.correct,
    attempts         = question_progress.attempts + 1,
    seen             = true,
    last_answered_at = now();
end;
$$ language plpgsql security definer;
```

- [ ] **Step 6: Apply the migration to Supabase**

Apply `lib/supabase/migrations/20260710_last_answer_wins.sql` via the Supabase MCP `apply_migration` tool (or paste into the Supabase SQL editor). Verify with a quick `select prosrc from pg_proc where proname = 'upsert_question_progress';` that the body contains `excluded.correct` without the `or`.

- [ ] **Step 7: Commit**

```bash
git add stores/appStore.ts lib/supabase/schema.sql lib/supabase/migrations/20260710_last_answer_wins.sql tests/hooks/useProgress.test.ts
git commit -m "feat: wrong answers re-enter review queue (last answer wins)"
```

---

### Task 10: ReturnBanner dismissal via uiStore

Both pages track dismissal in local `useState`, so dismissing on the index resurrects the banner inside a module. `uiStore` already has unused `showReturnBanner`/`dismissReturnBanner` — wire them up and use the existing `RETURN_BANNER_MIN` constant instead of the hardcoded `3`.

**Files:**
- Modify: `app/learn/page.tsx`
- Modify: `app/learn/[moduleId]/page.tsx`

- [ ] **Step 1: Update `app/learn/page.tsx`**

Change the `FREE_PER_MODULE` import line to include the constant:

```tsx
import { FREE_PER_MODULE, RETURN_BANNER_MIN } from "@/types";
```

Delete `const [bannerDismissed, setBannerDismissed] = useState(false);` (line ~184) — and remove the now-unused `import { useState } from "react";` (line 27). Add selectors:

```tsx
  const showReturnBanner = useUIStore((s) => s.showReturnBanner);
  const dismissReturnBanner = useUIStore((s) => s.dismissReturnBanner);
```

Replace the banner condition (line ~214):

```tsx
      {!isAuthLoading &&
        !user &&
        showReturnBanner &&
        progress.getTotalSeen() >= RETURN_BANNER_MIN && (
          <ReturnBanner onDismiss={dismissReturnBanner} />
        )}
```

- [ ] **Step 2: Update `app/learn/[moduleId]/page.tsx`**

Same changes: import `RETURN_BANNER_MIN` alongside `FREE_PER_MODULE`, delete `const [bannerDismissed, setBannerDismissed] = useState(false);` (line ~47), add the two `useUIStore` selectors, and replace the banner condition (line ~139):

```tsx
      {!isAuthLoading &&
        !user &&
        showReturnBanner &&
        progress.getTotalSeen() >= RETURN_BANNER_MIN && (
          <ReturnBanner onDismiss={dismissReturnBanner} />
        )}
```

- [ ] **Step 3: Verify**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: PASS — `tests/stores/uiStore.test.ts` already covers `dismissReturnBanner`.

- [ ] **Step 4: Commit**

```bash
git add app/learn/page.tsx "app/learn/[moduleId]/page.tsx"
git commit -m "fix: persist ReturnBanner dismissal across pages via uiStore"
```

---

### Task 11: Shared `useModalFocus` hook — focus trap for AuthModal and GateModal

`OnboardingOverlay` has full focus management (focus-in, restore, Escape, Tab trap); `AuthModal` and `GateModal` only handle Escape. Extract the overlay's logic into a hook and use it in all three.

**Files:**
- Create: `hooks/useModalFocus.ts`
- Modify: `components/layout/OnboardingOverlay.tsx`, `components/layout/AuthModal.tsx`, `components/layout/GateModal.tsx`
- Test: `tests/components/AuthModal.test.tsx` (new)

- [ ] **Step 1: Write the failing AuthModal test**

Create `tests/components/AuthModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthModal from "@/components/layout/AuthModal";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isPremium: false,
    isLoading: false,
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
    refreshPremiumStatus: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

describe("AuthModal focus management", () => {
  it("moves focus into the dialog on open", () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<AuthModal reason="save_progress" onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps Tab inside the dialog", async () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    // Tab far more times than there are focusables - focus must stay inside
    for (let i = 0; i < 12; i++) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/components/AuthModal.test.tsx`
Expected: FAIL — focus stays on `document.body`; Tab escapes the dialog. (Escape passes today — that's fine.)

- [ ] **Step 3: Create `hooks/useModalFocus.ts`**

```ts
"use client";

import { useEffect, useRef } from "react";

// Focus management for modal dialogs: moves focus into the dialog on mount,
// restores the previously focused element on unmount, calls onEscape for the
// Escape key, and keeps Tab cycling inside the dialog.
//
// Usage: const { dialogRef, trapFocus } = useModalFocus(onClose)
//        <div ref={dialogRef} tabIndex={-1} role="dialog" onKeyDown={trapFocus}>
export function useModalFocus(onEscape: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Latest-callback ref so the mount-once Escape listener never goes stale
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscapeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  function trapFocus(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return { dialogRef, trapFocus };
}
```

- [ ] **Step 4: Use it in AuthModal**

In `components/layout/AuthModal.tsx`: add `import { useModalFocus } from "@/hooks/useModalFocus";`, delete the Escape `useEffect` (lines 43–49), add inside the component:

```tsx
  const { dialogRef, trapFocus } = useModalFocus(onClose);
```

and change the dialog div:

```tsx
      <div
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={trapFocus}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-up focus-visible:outline-none"
      >
```

- [ ] **Step 5: Use it in GateModal**

In `components/layout/GateModal.tsx`: add the import, delete the Escape `useEffect` (lines 38–44, and the now-unused `useEffect` import), add:

```tsx
  const { dialogRef, trapFocus } = useModalFocus(() => {
    track("gate_dismissed", { module: moduleId });
    onDismiss();
  });
```

and add `ref={dialogRef} tabIndex={-1} onKeyDown={trapFocus}` to the dialog div (the one with `role="dialog"`), plus `focus-visible:outline-none` to its className.

- [ ] **Step 6: Refactor OnboardingOverlay onto the hook**

In `components/layout/OnboardingOverlay.tsx`: add the import, delete the local `dialogRef`, the `finishRef` + focus/Escape `useEffect` (lines 43–54), and the local `trapFocus` function (lines 57–73). Replace with:

```tsx
  const { dialogRef, trapFocus } = useModalFocus(() => finish(true));
```

Keep the `track("onboarding_started")` effect and everything else. The dialog div keeps its existing `ref={dialogRef} tabIndex={-1} onKeyDown={trapFocus}` attributes — they now come from the hook. The `finishRef` latest-callback ref moves into the hook, so delete it here.

- [ ] **Step 7: Run to verify pass**

Run: `npx vitest run tests/components/AuthModal.test.tsx tests/components/OnboardingOverlay.test.tsx tests/components/AppShell.test.tsx && npm run typecheck`
Expected: PASS — including the existing OnboardingOverlay suite (behavior-preserving refactor).

- [ ] **Step 8: Commit**

```bash
git add hooks/useModalFocus.ts components/layout/AuthModal.tsx components/layout/GateModal.tsx components/layout/OnboardingOverlay.tsx tests/components/AuthModal.test.tsx
git commit -m "feat: shared useModalFocus hook, focus trap on all modals"
```

---

### Task 12: Copy and constants cleanup

Hardcoded prices, wrong module counts, an untrue "Timed Test" claim, a hardcoded share URL, and a duplicated social-proof string.

**Files:**
- Modify: `data/constants.ts`, `components/layout/HeroSection.tsx`, `components/layout/GateModal.tsx`, `components/layout/UpsellBanner.tsx`, `app/review/page.tsx`, `app/test/page.tsx`, `app/learn/layout.tsx`

- [ ] **Step 1: Centralize the social-proof claim**

`data/constants.ts`:

```ts
export const APP_PRICE = "€4.99";

// Marketing claim shown in the hero and GateModal. VERIFY this number is
// true before premium launch - misleading-advertising risk in NL/EU.
export const SOCIAL_PROOF = "2,400+ expats ready to ride";
```

In `components/layout/HeroSection.tsx` add `import { SOCIAL_PROOF } from "@/data/constants";` and replace the badge text (line ~65): `{SOCIAL_PROOF}`.

In `components/layout/GateModal.tsx` add `SOCIAL_PROOF` to the existing `@/data/constants` import and replace the pill text (line ~65): `{SOCIAL_PROOF}`.

- [ ] **Step 2: Replace hardcoded €4.99 with APP_PRICE**

`app/review/page.tsx` — add `import { APP_PRICE } from "@/data/constants";`. Replace all four occurrences (two `aria-label`s, two button labels — lines ~159, ~166, ~311-312, ~320):

```tsx
aria-label={comingSoon ? "Review coming soon" : `Unlock Review for ${APP_PRICE}`}
```

```tsx
{comingSoon ? "Coming soon" : `Unlock for ${APP_PRICE}`}
```

`app/test/page.tsx` — same import; replace the `aria-label` (line ~114) and button label (line ~121):

```tsx
aria-label={comingSoon ? "Test coming soon" : `Unlock for ${APP_PRICE}`}
```

```tsx
{comingSoon ? "Coming soon" : `Unlock for ${APP_PRICE}`}
```

- [ ] **Step 3: Fix module counts and the timed-test claim**

- `components/layout/HeroSection.tsx` variant_b body (line ~30): `"Six modules."` → `"Seven modules."`
- `components/layout/UpsellBanner.tsx` (line ~29): `All 6 modules, Review queue, and the CycleDutch Test.` → `All 7 modules, Review queue, and the CycleDutch Test.`
- `app/learn/layout.tsx` metadata description: `across six modules` → `across seven modules`
- `components/layout/GateModal.tsx` features array (line ~23): `"Timed Test with results breakdown"` → `"Final Test with results breakdown"`

- [ ] **Step 4: Share URL from env**

`app/test/page.tsx` `handleShare` (line ~409):

```tsx
      navigator
        .share({
          text,
          url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cycledutch.com",
        })
        .catch(() => {});
```

- [ ] **Step 5: Verify**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: PASS. Then `grep -rn "€4.99" app components` — the only hits should be via `APP_PRICE` in `data/constants.ts`.

- [ ] **Step 6: Commit**

```bash
git add data/constants.ts components/layout/HeroSection.tsx components/layout/GateModal.tsx components/layout/UpsellBanner.tsx app/review/page.tsx app/test/page.tsx app/learn/layout.tsx
git commit -m "fix: centralize price/social-proof strings, correct module counts"
```

---

### Task 13: Documentation sync

Docs drifted from the code — and this plan changed store/API signatures the docs describe.

**Files:**
- Modify: `CLAUDE.md`, `docs/ZUSTAND.md`

- [ ] **Step 1: Update CLAUDE.md**

- Questions count: `117 questions currently, 73 of them "active"` → `122 questions currently, 77 of them "active"`.
- Analytics section: `anonymous_id UUID generated on first load, stored in localStorage.` → `anonymous_id UUID generated on first load, stored in localStorage under the key "anon_id".`
- "localStorage before auth" bullet: same key correction (`anonymous_id` → `anon_id`).
- ID-format table: change the `mixed scenarios | mixed_001, mixed_002` row to `mixed scenarios (planned) | mixed_001, mixed_002 — no mixed questions exist yet`.
- Freemium section: the flow diagram says "answers question 2" / "2 questions in all 6 modules (12 total)" but `FREE_PER_MODULE = 3` — change to "question 3" / "3 questions in all 6 gated modules (18 total)".

- [ ] **Step 2: Update docs/ZUSTAND.md**

Update the `uiStore` interface snippet to match the new signatures: `openGate: (moduleId?: ModuleId) => void`, plus the `gateModuleId: ModuleId | null`, `checkoutError: string | null`, and `setCheckoutError` fields added in Tasks 1 and 7.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/ZUSTAND.md
git commit -m "docs: sync CLAUDE.md and ZUSTAND.md with code"
```

---

### Task 14: Final verification

- [ ] **Step 1: Full suite**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 2: Manual premium-path walkthrough (dev, `NEXT_PUBLIC_PREMIUM_ENABLED=true` + Stripe test keys)**

1. Anonymous: answer 3 questions in Priority → inline gate appears (no flash before it), Upgrade card → GateModal opens (Task 1) and traps focus (Task 11).
2. GateModal → Unlock → AuthModal (not signed in) → magic link with `next=/checkout` → after clicking the link you land on **Stripe checkout**, not `checkout_failed` (Task 2).
3. Pay with `4242 4242 4242 4242` → back on `/learn?upgraded=true&session_id=...` → premium toast; kill the webhook listener and repeat to confirm session-id reconciliation alone grants premium (Task 3).
4. As premium: reload `/test` and `/review` — no free-screen flash (Task 5). Take the test twice — different questions (Task 8), "See results" step, retry starts clean (Task 4).
5. Answer a previously-correct question wrong in the test → it appears in Review (Task 9).
6. As a fresh anonymous user, complete all previews → PreviewCompleteScreen has nav + Fundamentals/Guide links (Task 6).
7. Stop the dev server's network (or point `/api/checkout` at a 500) → Unlock shows the error banner (Task 7).

- [ ] **Step 3: Report results against this checklist before merging.**

---

## Self-Review Notes

- **Coverage:** all 13 audit findings map to Tasks 1–13 (finding 12 "last-question pacing" merged into Task 4; finding on stale docs is Task 13).
- **Type consistency:** `openGate(moduleId?)` (Tasks 1, 13), `verifyPremium(sessionId?)` (Task 3), `GET(request: NextRequest)` on verify (Task 3 tests updated), `useModalFocus(onEscape)` returning `{ dialogRef, trapFocus }` (Task 11) — used consistently.
- **Ordering hazards:** Task 4 and Task 8 both edit the retry handler in `app/test/page.tsx` — Task 8's snippet includes Task 4's resets. Task 12 edits `GateModal.tsx` after Tasks 1 and 11 — line numbers shift; match on content, not line.
- **Out of scope (deliberate):** Supabase session-refresh middleware (browser-client refresh suffices for this app's client-heavy pages), rate limiting on `/api/progress`, spaced repetition beyond last-answer-wins.
