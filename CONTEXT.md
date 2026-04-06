# BikeReady — Session Context for Handoff

Read CONTEXT.md for full session context, then read CLAUDE.md for project conventions. We're continuing work on BikeReady.
This document gives a new Claude Code session full context to continue work without re-reading the entire codebase from scratch.

---

## What BikeReady is

A short prep course for expats learning to cycle in the Netherlands. 6 modules of scenario-based questions (priority, signs, roadusers, infrastructure, legal, vocabulary). Users work through modules, fix mistakes in a Review queue, then sit a final Test. Progress saved per-user in Supabase. Freemium: first 3 questions per module free, rest paywalled (€4.99 one-time via Stripe).

Read `CLAUDE.md`, `SPEC.md`, `DESIGN.md`, `DATA_MODEL.md` for full product/design/data details.

---

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS (utility-first, no CSS modules)
- Supabase (Postgres + Auth via magic link + RLS)
- Stripe (one-time payment, checkout + webhook)
- PostHog (analytics)

---

## Current state of the codebase

### Everything that is complete and working

#### Core pages

- `app/page.tsx` — Landing page with onboarding overlay
- `app/learn/page.tsx` — Module index, shows ModuleCards, handles free preview / PreviewCompleteScreen
- `app/learn/[moduleId]/page.tsx` — Module session, question-by-question flow, gate screen after Q3 for free users
- `app/review/page.tsx` — Review queue (wrong answers only), gated for non-premium
- `app/test/page.tsx` — Final test, gated for non-premium

#### Layout / shell

- `components/layout/AppShell.tsx` — Wraps Nav + AuthModal. All pages use this. Provides `AuthModalContext` so child components can open the auth modal without prop drilling.
- `components/layout/Nav.tsx` — Sticky nav. Calls `useAuth()` internally (no `isPremium` prop needed). Shows loading spinner, "Go Premium" button, or "Sign in" depending on state.
- `components/layout/AuthModal.tsx` — Magic link sign-in modal.
- `components/layout/ReturnBanner.tsx` — "Welcome back — sign in to keep progress" banner. Uses `useAuthModal()` context internally (no `onSignIn` prop).
- `components/layout/GateModal.tsx` — Upgrade modal with social proof + Stripe CTA.
- `components/layout/PremiumLocked.tsx` — Full-page locked state used by review + test pages.
- `components/layout/OnboardingOverlay.tsx` — 3-screen first-visit overlay.
- `components/layout/UpsellBanner.tsx` — Upsell banner component.

#### Question components

- `components/questions/QuestionCard.tsx` — Renders a question, options, and feedback panel.
- `components/questions/LessonAccordion.tsx` — Collapsible skill lesson above each question. Always has orange border + text. `bg-orange-light` when open, `bg-white` when closed. Has `cursor-pointer`.
- `components/questions/OptionButton.tsx` — Answer option button.
- `components/questions/FeedbackPanel.tsx` — Post-answer feedback with title/body/rule/tip.

#### Module components

- `components/modules/ModuleCard.tsx` — Module card on /learn. Calls `useAuth()` internally for `isPremium`. Has `cursor-pointer`. Module title styled `text-orange`.
- `components/modules/DotMap.tsx` — Dot grid showing per-question mastery state.

#### UI primitives (`components/ui/`)

- `Button.tsx`, `Badge.tsx`, `Card.tsx`, `MasteryDot.tsx`, `ProgressBar.tsx`, `SignDisplay.tsx`

#### Hooks

- `hooks/useAuth.ts` — Auth state + `isPremium` + `sendMagicLink` + `signOut`. Calls `verifyPremium()` (fetches `/api/premium/verify`) on SIGNED_IN if not already premium. No params.
- `hooks/useProgress.ts` — Question progress read/write. Calls `useAuth()` internally (no user param). Loads from Supabase if authenticated, localStorage otherwise. Migrates localStorage → Supabase on sign-in. Exports: `progress`, `isLoaded`, `recordAnswer`, `migrateLocalProgress`, `getDotState`, `getModuleStatus`, `getReviewQueue`, `getModuleSeen`, `getTotalSeen`, `isPreviewComplete`, `getCurrentQuestionIndex`.
- `hooks/useAuthModal.ts` — `AuthModalContext` + `useAuthModal()` hook. Child components inside AppShell call `useAuthModal()` to open the sign-in modal without needing a prop.
- `hooks/useQuestions.ts` — Filters and groups questions from the JSON data.
- `hooks/useBadges.ts` — Badge state + trigger logic.
- `hooks/useAnalytics.ts` — PostHog event tracking.

#### Supabase integration

- `lib/supabase.ts` — Browser client (`createClient()`) using `@supabase/ssr`.
- `lib/supabase/server.ts` — Server client (`createClient()`) with `getAll`/`setAll` cookie methods (non-deprecated pattern). Used in API routes.
- `lib/supabase/admin.ts` — Admin client using `SUPABASE_SECRET_KEY`. Used in webhook + premium verify routes only.
- `lib/queries/fetchProgress.ts` — Fetches `question_progress` rows for current user.
- `lib/mutations/updateProgress.ts` — Upserts a progress row (calls `upsert_question_progress` Postgres function which ORs the `correct` field — never reverts once true).
- `app/auth/callback/route.ts` — Exchanges auth code for session, redirects to `/learn`.

#### Stripe integration

- `lib/stripe.ts` — Stripe client init.
- `app/api/checkout/route.ts` — GET handler. Gets user session, creates Stripe checkout session with `supabase_user_id` in metadata, redirects.
- `app/api/stripe/webhook/route.ts` — POST handler. Verifies Stripe signature, handles `checkout.session.completed`, sets `is_premium = true` on the user's profile via admin client.
- `app/api/premium/verify/route.ts` — GET handler. Fallback if webhook missed. Checks Stripe payment history, updates DB, returns `{ is_premium }`.

#### Other API routes

- `app/api/progress/route.ts` — GET/POST for question progress. Uses server Supabase client.
- `app/api/badges/route.ts` — GET/POST for badge state. Uses server Supabase client.

#### Data

- `data/questions.json` — 66 active questions total.
- `data/lessons.json` — Skill lessons keyed by skill name, 3 difficulty variants each.
- `data/modules.ts` — Module definitions.
- `data/signs.tsx` — SVG sign components + SIGN_REGISTRY.
- `data/badges.ts` — Badge definitions.

---

## Question bank state

66 questions total across 6 modules. All are `status: "active"`.

| Module         | Count | IDs                                     |
| -------------- | ----- | --------------------------------------- |
| legal          | 10    | legal_005 – legal_014                   |
| vocabulary     | 12    | vocabulary_006 – vocabulary_017         |
| roadusers      | 11    | roadusers_006 – roadusers_016           |
| infrastructure | 7     | infrastructure_006 – infrastructure_012 |
| priority       | 14    | priority_009–014, mixed_001–008         |
| signs          | 12    | signs_001 – signs_012                   |

**Free preview questions (first 3 per module in the array):**

| Module         | Free Q1            | Free Q2            | Free Q3            |
| -------------- | ------------------ | ------------------ | ------------------ |
| legal          | legal_005          | legal_006          | legal_007          |
| vocabulary     | vocabulary_006     | vocabulary_008     | vocabulary_011     |
| roadusers      | roadusers_006      | roadusers_007      | roadusers_008      |
| infrastructure | infrastructure_006 | infrastructure_007 | infrastructure_008 |
| priority       | priority_009       | priority_010       | mixed_001          |
| signs          | signs_001          | signs_004          | signs_002          |

The array order in `questions.json` determines free vs premium. `FREE_PER_MODULE = 3` (defined in `types/index.ts`). First 3 questions in each module's array slice are free; rest are premium-only.

Note: `mixed_*` questions have `module: "priority"` — they live in the priority module.

---

## Key architectural decisions made this session

### AppShell pattern

Every page wraps content in `<AppShell wrongCount={n}>`. AppShell renders Nav + AuthModal, provides `AuthModalContext`. Pages no longer manage `showAuth` state or import Nav/AuthModal directly.

Child components that need to open the auth modal (e.g. ReturnBanner, inline nudge buttons) call `const openAuth = useAuthModal()` — they're inside AppShell's subtree so the context is available.

Pages that need `isPremium` still call `useAuth()` themselves. Pages that need progress still call `useProgress()` themselves. AppShell does NOT call these — avoids double instantiation.

### useProgress no longer takes `user` param

`useProgress()` calls `useAuth()` internally. Do not pass `user` to it.

### Nav is self-contained

Nav calls `useAuth()` internally. Do not pass `isPremium` or `user` as props to Nav.

### ModuleCard is self-contained

ModuleCard calls `useAuth()` internally for `isPremium`. Do not pass it as a prop.

### Server Supabase client pattern (non-deprecated)

```ts
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(
                cookiesToSet: {
                    name: string;
                    value: string;
                    options: CookieOptions;
                }[],
            ) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options),
                    );
                } catch {}
            },
        },
    });
}
```

---

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Supabase schema additions (from this session)

Added to `profiles` table:

- `premium_since timestamptz`
- `stripe_customer_id text`
- `stripe_payment_id text`

Postgres function: `upsert_question_progress(p_question_id, p_correct, p_user_id)` — ORs the `correct` field so it never reverts to false once true.

---

## Things that are NOT done yet / possible next steps

- No known bugs at time of handoff.
- The question bank could grow — infrastructure only has 7 questions (others have 10–14).
- Badge earning logic in `useBadges.ts` may need wiring to actual question completion events.
- Analytics events (`useAnalytics.ts`) may not be fully wired to all interactions.
- `app/page.tsx` (landing) uses `<Nav logoOnly>` directly rather than `<AppShell logoOnly>` — minor inconsistency, could be unified.
- No end-to-end tests exist.
- The `/test` page flow details (how the test works, scoring) would need checking against SPEC.md.

---

## Conventions to follow

- **No `any` types.** All types in `types/index.ts`.
- **Tailwind only.** No inline styles in production code.
- **Never write to Supabase from a component.** All writes go through hooks.
- **Optimistic updates.** Update local state immediately, fire Supabase in background.
- **Questions are static.** `data/questions.json` is imported at build time. Never fetch at runtime.
- **Free questions = first `FREE_PER_MODULE` entries in each module's array slice.** The array order in `questions.json` is the source of truth for free vs premium.
- **New questions start as `status: "draft"`**, must be changed to `"active"` to appear.
- **`skill` in a question must exactly match a key in `data/lessons.json`** for the lesson accordion to render.
