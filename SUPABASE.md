# SUPABASE.md — BikeReady

Everything needed to connect to Supabase, set up auth, and migrate localStorage progress. The database schema is run manually in the Supabase dashboard — no CLI or migrations folder needed.

---

## Keys

BikeReady uses the new Supabase API keys (not the legacy anon/service_role JWT keys).

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000
```

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — replaces the old `ANON_KEY`. Safe to expose client-side. Used to initialise the Supabase browser client.
- `SUPABASE_SECRET_KEY` — replaces the old `SERVICE_ROLE_KEY`. Never expose this client-side. Used only in server-side API routes (e.g. Stripe webhook setting `is_premium = true`).

To find these: Supabase dashboard → Settings → API Keys → API Keys tab. If no publishable key exists yet, click "Create new API Keys".

---

## Database schema

**Run this SQL once in the Supabase dashboard → SQL Editor.** Do not create a migrations folder — just paste and run.

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  is_premium          boolean not null default false,
  premium_since       timestamptz,
  stripe_customer_id  text,
  stripe_payment_id   text,
  created_at          timestamptz not null default now()
);

-- Question progress
create table question_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  question_id      text not null,
  seen             boolean not null default true,
  correct          boolean not null default false,
  attempts         integer not null default 1,
  last_answered_at timestamptz not null default now(),
  constraint question_progress_user_question_unique unique (user_id, question_id)
);

-- Earned badges
create table badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references profiles(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  constraint badges_user_badge_unique unique (user_id, badge_id)
);

-- Test results
create table test_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  score_pct    integer not null,
  answers      jsonb not null default '{}',
  passed       boolean not null default false,
  completed_at timestamptz not null default now()
);

-- Row Level Security — users can only access their own rows
alter table profiles        enable row level security;
alter table question_progress enable row level security;
alter table badges          enable row level security;
alter table test_results    enable row level security;

-- Profiles policies
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Question progress policies
create policy "Users can read own progress"
  on question_progress for select using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on question_progress for insert with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on question_progress for update using (auth.uid() = user_id);

-- Badges policies
create policy "Users can read own badges"
  on badges for select using (auth.uid() = user_id);

create policy "Users can insert own badges"
  on badges for insert with check (auth.uid() = user_id);

-- Test results policies
create policy "Users can read own test results"
  on test_results for select using (auth.uid() = user_id);

create policy "Users can insert own test results"
  on test_results for insert with check (auth.uid() = user_id);

-- Auto-create profile row when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

**Why the trigger matters:** when a user signs up via magic link, Supabase creates a row in `auth.users` automatically. The trigger fires on that insert and creates the corresponding `profiles` row. Without it the app would need to create the profile row manually in code after every sign-up, which is fragile.

**Why the unique constraints matter:** `question_progress` has a unique constraint on `(user_id, question_id)`. This means the database physically cannot create duplicate rows — every upsert either inserts or updates the single existing row. This is the foundation that keeps progress correct.

---

## Supabase client setup

Use `@supabase/ssr` for all client and server-side usage in Next.js 16.

```ts
// lib/supabase/client.ts — browser client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

```ts
// lib/supabase/server.ts — server component / route handler client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## Auth — magic link flow

Magic link is the only auth method. No passwords.

**Sending the magic link:**

```ts
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL}/auth/callback`,
  },
})
```

**The `/auth/callback` route is required.** Without it, the magic link lands on a dead page. Create `app/auth/callback/route.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/learn', request.url))
}
```

**Dashboard configuration required:**
- Authentication → URL Configuration → Site URL: `http://localhost:3000` (dev) / your production domain
- Authentication → URL Configuration → Redirect URLs: add `http://localhost:3000/auth/callback` and `https://yourapp.com/auth/callback`

The `emailRedirectTo` in `signInWithOtp` must exactly match one of these registered URLs or Supabase will reject it.

**Reading the user:**

Always use `auth.getUser()` for server-side auth checks — not `auth.getSession()`. `getSession()` reads from the cookie and can be tampered with. `getUser()` always makes a request to the Auth server and returns verified data.

```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/') // not authenticated
```

---

## Upserting question progress

Always use `.upsert()` not `.insert()`. The unique constraint on `(user_id, question_id)` means upsert either creates a new row or updates the existing one — never duplicates.

```ts
await supabase
  .from('question_progress')
  .upsert(
    {
      user_id:          userId,
      question_id:      questionId,
      seen:             true,
      correct:          answeredCorrectly,
      attempts:         1,           // DB increments this via the upsert
      last_answered_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,question_id' }
  )
```

The `correct` field is handled at the database level with the OR logic in the upsert — once `true` it never goes back to `false`. This is enforced by the schema, not just the app code.

---

## Same email = same account

`signInWithOtp()` handles both sign-up and sign-in in a single call. If the email already has an account, the user is logged back into that account with all their existing progress intact. If the email is new, a fresh account is created. The app code does not need to distinguish between these two cases.

---

## Migrating localStorage progress on sign-in

Free users accumulate progress in localStorage before creating an account. On sign-in, that progress must be migrated to Supabase. This runs inside the `useProgress` hook.

```ts
// hooks/useProgress.ts

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    await migrateLocalProgress(session.user.id)
  }
})

async function migrateLocalProgress(userId: string) {
  const raw = localStorage.getItem('bikeready_progress')
  if (!raw) return

  const localProgress: Record<string, { seen: boolean; correct: boolean }> =
    JSON.parse(raw)

  const entries = Object.entries(localProgress)
  if (entries.length === 0) return

  const rows = entries.map(([questionId, p]) => ({
    user_id:          userId,
    question_id:      questionId,
    seen:             true,
    correct:          p.correct,
    attempts:         1,
    last_answered_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('question_progress')
    .upsert(rows, { onConflict: 'user_id,question_id' })

  if (error) {
    console.error('localStorage migration failed:', error)
    return
  }

  // Supabase is now the source of truth — clear localStorage
  localStorage.removeItem('bikeready_progress')
}
```

**Returning user edge case:** if a user had a previous account, logged out, answered some questions as a guest again, then logged back in — the upsert handles it correctly. The unique constraint prevents duplicates, and the database-level `correct OR` logic means a previous correct answer is never downgraded by a new wrong answer.

**After migration:** the hook switches from reading localStorage to reading from Supabase. The rest of the app does not need to know migration happened — it just reads from the hook as normal.

---

## Stripe webhook — setting is_premium

The Stripe webhook runs server-side and needs to bypass RLS to update the user's profile. Use the `SUPABASE_SECRET_KEY` (not the publishable key) to create an admin client in the webhook route.

**Set all four fields atomically when the payment succeeds:**

```ts
// app/api/stripe/webhook/route.ts
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession

    // Get the Supabase user id stored in metadata when creating the checkout
    const userId = session.metadata?.supabase_user_id
    if (!userId) return new Response('No user id in metadata', { status: 400 })

    await supabaseAdmin
      .from('profiles')
      .update({
        is_premium:         true,
        premium_since:      new Date().toISOString(),
        stripe_customer_id: session.customer as string,
        stripe_payment_id:  session.payment_intent as string,
      })
      .eq('id', userId)
  }

  return new Response('OK', { status: 200 })
}
```

**Pass the user id when creating the Stripe checkout session** so the webhook knows which profile to update:

```ts
const session = await stripe.checkout.sessions.create({
  // ...
  metadata: {
    supabase_user_id: user.id,
  },
})
```

The secret key has full database access and bypasses RLS — only ever use it server-side in API routes, never in client code.

---

## Webhook reliability and fallback

Webhooks can fail — network blip, cold start, Stripe can't reach your server. If the webhook fails, the user has paid but `is_premium` is still `false` and they still see the gate.

**Stripe's retry behaviour:** Stripe automatically retries failed webhooks multiple times over 24 hours. Most failures resolve themselves without any action needed.

**Fallback on sign-in:** For the cases that don't self-resolve, add a Stripe lookup as a fallback inside `useAuth`. On `SIGNED_IN`, if `is_premium` is `false`, call your own API route which checks Stripe directly:

```ts
// app/api/premium/verify/route.ts
// Called client-side on sign-in when is_premium is false

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id, is_premium')
    .eq('id', user.id)
    .single()

  // Already premium — nothing to do
  if (profile?.is_premium) return Response.json({ is_premium: true })

  // No Stripe customer yet — definitely not premium
  if (!profile?.stripe_customer_id) return Response.json({ is_premium: false })

  // Check Stripe directly for completed payments
  const payments = await stripe.paymentIntents.list({
    customer: profile.stripe_customer_id,
    limit: 5,
  })

  const hasPaid = payments.data.some(p => p.status === 'succeeded')

  if (hasPaid) {
    // Recover the missed webhook — set premium now
    await supabaseAdmin
      .from('profiles')
      .update({ is_premium: true, premium_since: new Date().toISOString() })
      .eq('id', user.id)
  }

  return Response.json({ is_premium: hasPaid })
}
```

Call this route in `useAuth` after sign-in only when `is_premium` is `false` — not on every load. If it finds a completed payment it silently recovers and the user gets premium access without needing to contact support.

**Refunds:** `is_premium` does not revert automatically on a refund. Handle refunds manually in the Supabase dashboard (set `is_premium = false`, clear `stripe_payment_id`), or build a `charge.refunded` webhook handler if refund volume warrants it.
