# AUTH_FLOWS.md — BikeReady

Authentication and payment flows. Three distinct user journeys, each with different triggers and outcomes.

---

## Overview

| Journey | Trigger | Auth needed? | Payment needed? |
|---|---|---|---|
| Save progress | Return banner, module complete nudge | Yes | No |
| Go pro (not logged in) | Gate, Unlock button | Yes — before payment | Yes |
| Go pro (already logged in) | Gate, Unlock button | No — already done | Yes |

---

## Journey 1 — Save progress (free user, not logged in)

User wants to keep their free progress across sessions. No payment involved.

**Trigger points:**
- Return visit banner ("Welcome back — sign in to keep your progress safe")
- Module complete nudge ("Sign in so you don't lose what you've done")
- Nav "Sign in" button

**Flow:**

```
User taps "Sign in"
  → AuthModal opens
      Title: "Save your progress"
      Body: "Enter your email and we'll send a magic link."
  → User enters email
  → supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/learn` }
    })
  → "Check your email" confirmation shown
  → User clicks magic link in email
  → /auth/callback?next=/learn
      → exchangeCodeForSession(code)
      → migrateLocalProgress(user.id)   // localStorage → Supabase
      → redirect to /learn
  → User is now logged in, progress saved, still free
```

**UI changes after sign-in:**
- Return banner disappears
- Module complete nudge disappears
- Nav: "Sign in" button replaced by account indicator

---

## Journey 2 — Go pro (free user, not logged in)

User wants to pay. They have no account yet. Auth must happen before payment — a Supabase user ID is required to attach the Stripe payment to.

**Trigger points:**
- "Unlock for €4.99" button in gate screen (inline, after question 2)
- "Unlock for €4.99" button in GateModal
- "Unlock everything" button in PreviewCompleteScreen

**Flow:**

```
User taps "Unlock for €4.99"
  → Check auth state: not logged in
  → GateModal closes (if open)
  → AuthModal opens with reason="upgrade"
      Title: "Create a free account to unlock"
      Body: "We need your email to complete the purchase. Takes 30 seconds."
      Note: no mention of price here — they already know, don't repeat it
  → User enters email
  → supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/checkout` }
    })
  → "Check your email" confirmation shown
  → User clicks magic link in email
  → /auth/callback?next=/checkout
      → exchangeCodeForSession(code)
      → migrateLocalProgress(user.id)   // migrate any existing progress first
      → fetch /api/checkout (POST, authenticated)
      → redirect to Stripe checkout URL
  → User completes Stripe payment
  → Stripe webhook fires → profiles.is_premium = true
  → Stripe redirects to /learn?upgraded=true
  → /learn shows a success toast: "Welcome to BikeReady Premium 🚲"
```

---

## Journey 3 — Go pro (already logged in)

User is already authenticated. Skip auth entirely — go straight to Stripe.

**Trigger points:** Same as Journey 2.

**Flow:**

```
User taps "Unlock for €4.99"
  → Check auth state: logged in
  → fetch /api/checkout (POST, authenticated)
  → redirect to Stripe checkout URL
  → User completes Stripe payment
  → Stripe webhook fires → profiles.is_premium = true
  → Stripe redirects to /learn?upgraded=true
  → /learn shows a success toast: "Welcome to BikeReady Premium 🚲"
```

---

## The `next` parameter

The magic link email redirect URL carries a `next` query parameter that tells `/auth/callback` what to do after authentication.

| Value | Behaviour |
|---|---|
| `/learn` | Migrate localStorage, redirect to /learn |
| `/checkout` | Migrate localStorage, create Stripe session, redirect to Stripe |

Always include a `next` parameter. Default to `/learn` if absent.

---

## API routes required

### `POST /api/checkout`

Creates a Stripe checkout session for the authenticated user. Called server-side from `/auth/callback` (when `next=/checkout`) or client-side (when already logged in and tapping Unlock).

```ts
// app/api/checkout/route.ts

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL}/learn?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL}/learn`,
    customer_email: user.email,
    metadata: {
      supabase_user_id: user.id,
    },
  })

  return Response.json({ url: session.url })
}
```

### `GET/POST /auth/callback`

Handles the magic link return. Exchanges the code for a session, migrates localStorage progress, then routes based on `next`.

```ts
// app/auth/callback/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/learn'

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (next === '/checkout' && user) {
      // Create Stripe session and redirect
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL}/api/checkout`, {
        method: 'POST',
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      })
      const { url } = await res.json()
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

Note: localStorage migration (`migrateLocalProgress`) runs client-side inside `useProgress` on the `SIGNED_IN` auth event — not in the callback route. The callback only handles server-side session creation and routing.

---

## AuthModal props

The AuthModal needs a `reason` prop to adjust its copy:

```ts
interface AuthModalProps {
  reason: 'save_progress' | 'upgrade'
  onClose: () => void
}
```

| reason | Title | Body |
|---|---|---|
| `save_progress` | "Save your progress" | "Enter your email and we'll send a magic link. No password needed." |
| `upgrade` | "Create a free account to unlock" | "We need your email to complete your purchase. Takes 30 seconds." |

The email input and send button are identical in both cases. Only the copy changes.

---

## GateModal logic

The GateModal's "Unlock for €4.99" button must check auth state before acting:

```ts
async function handleUnlock() {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Already logged in — go straight to Stripe
    const res = await fetch('/api/checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  } else {
    // Not logged in — auth first
    onClose()
    openAuthModal({ reason: 'upgrade' })
  }
}
```

The same logic applies to every "Unlock" button across the app — gate screen, PreviewCompleteScreen, nav Unlock button.

---

## Premium state after payment

After Stripe redirects to `/learn?upgraded=true`:

1. Show a success toast: "Welcome to BikeReady Premium 🚲" (auto-dismiss after 5 seconds)
2. The `useAuth` hook re-fetches `is_premium` from Supabase profiles
3. All gate screens, dimmed dots, and preview-done badges disappear
4. Full course is accessible

The `upgraded=true` param is only used to trigger the toast. Remove it from the URL after reading it (`router.replace('/learn')`).

---

## Edge cases

**User pays but webhook fails**
The fallback verify route in SUPABASE.md checks Stripe directly on sign-in when `is_premium` is false. Most cases resolve automatically via Stripe's retry mechanism within 24 hours.

**User clicks magic link on a different device**
The session is created on the device where the link was clicked. If they click on their phone but started on desktop, their desktop session will still be the old free session until they sign in again there. Not a major issue for this app — just note that sessions are device-specific until a refresh.

**User enters wrong email for upgrade**
They create a new account with no progress. The original account's progress is on the original email. Nothing is lost — they just need to sign in with the original email. A friendly note in the AuthModal for the upgrade flow: "Use the same email you've been using on this device."

**User is already premium and taps Unlock again**
The `/api/checkout` route should check `is_premium` before creating a session and return early:

```ts
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('is_premium')
  .eq('id', user.id)
  .single()

if (profile?.is_premium) {
  return Response.json({ alreadyPremium: true })
}
```

The client should handle `alreadyPremium: true` by simply refreshing the premium state and skipping the redirect.
