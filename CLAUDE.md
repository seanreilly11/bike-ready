# CLAUDE.md - CycleDutch

Instructions for Claude Code when working on this project.

---

## What this project is

CycleDutch is a short one-time preparation course for expats learning to cycle safely in the Netherlands. It is a web app built with Next.js, Tailwind CSS, and Supabase. Users work through 6 modules of scenario-based questions, fix mistakes in a Review queue, then test themselves in a final Test. Progress is saved per-user in Supabase.

Read `SPEC.md` for the full product spec, `DESIGN.md` for the design system, and `DATA_MODEL.md` for the complete data model before making any changes.

---

## Stack

- **Next.js 16** - App Router, TypeScript
- **Tailwind CSS** - utility-first styling, no CSS modules
- **Supabase** - Postgres + Auth (magic link) + Row Level Security
- **Paddle** - Merchant of Record; one-time overlay payment for premium unlock
- **Posthog** - analytics and anonymous-to-identified user tracking

---

## Development principles

### React

- Functional components only. No class components.
- Co-locate state as close to where it is used as possible. Lift only when necessary.
- Prefer `useState` + `useReducer` for local state. Genuinely global state (progress, badges, auth/premium, modal/UI flags) lives in **Zustand stores** - `stores/appStore.ts` (domain state) and `stores/uiStore.ts` (UI state). Read/write it only through the hooks layer, never reach into Supabase or PostHog from a component.
- Never use `useEffect` to sync state that can be derived. Derive it inline instead.
- Keep components small and focused. If a component exceeds ~80 lines it probably needs splitting.
- Name components by what they render, not by where they are used. `QuestionCard`, not `ModulePageCard`.

### SOLID

- **Single responsibility** - each component, hook, and utility does one thing. `QuestionCard` renders a question. `useProgress` manages progress state. They do not cross into each other's concerns.
- **Open/closed** - question types (`multiple_choice`, `true_false`, `scenario_decision`) are extendable by adding new types to the data, not by modifying component logic. Use a map/registry pattern.
- **Liskov** - if a component accepts a `question` prop, any question shape that satisfies the `Question` type should work without the component knowing the specific type.
- **Interface segregation** - pass only what a component needs. Never spread entire state objects as props.
- **Dependency inversion** - components depend on abstractions, not concrete implementations. `QuestionCard` receives `onAnswer` as a prop; it does not know about Supabase.

### DRY

- All design tokens in `lib/tokens.ts`. Never hardcode hex values or font strings in components.
- Shared UI primitives in `components/ui/`. Build these first and use them everywhere.
- `data/questions.json` and `data/lessons.json` are the single source of truth for all content. Never duplicate or inline content elsewhere.
- Auth and premium status via `useAuth` hook only. Never read Supabase auth directly in a component.
- Progress state via `useProgress` hook only. Never write to `question_progress` directly from a component.
- Analytics events via `useAnalytics` hook only. Never call Posthog directly from a component.

### Component structure

```
components/
  ui/                   # Primitive, reusable, no business logic
    Button.tsx
    Badge.tsx
    Card.tsx
    MasteryDot.tsx
    ProgressBar.tsx
    SignDisplay.tsx      # Renders SVG sign by sign id
  questions/            # Question rendering
    QuestionCard.tsx
    LessonAccordion.tsx  # Skill lesson shown above prompt, collapsed by default
    OptionButton.tsx
    FeedbackPanel.tsx
  modules/              # Module-level components
    ModuleCard.tsx
    DotMap.tsx
  badges/
    BadgeGrid.tsx
    BadgeItem.tsx
    BadgeToast.tsx
  layout/
    Nav.tsx
    GateModal.tsx
    AuthModal.tsx
    OnboardingOverlay.tsx
    ReturnBanner.tsx
```

---

## File structure

```
CycleDutch/
├── app/
│   ├── page.tsx                  # Landing page (/)
│   ├── learn/
│   │   ├── page.tsx              # Module index (/learn)
│   │   └── [moduleId]/
│   │       └── page.tsx          # Module session (/learn/[moduleId])
│   ├── review/
│   │   └── page.tsx              # Review queue (/review)
│   ├── test/
│   │   └── page.tsx              # Test (/test)
│   ├── guide/                    # Static reference guide (/guide, /guide/[moduleId], signs, glossary)
│   ├── (legal)/                  # Privacy, terms, imprint, cookies
│   ├── auth/callback/route.ts    # Magic-link exchange + checkout hand-off
│   └── api/
│       ├── progress/route.ts     # POST answers, GET progress
│       ├── badges/route.ts       # GET/POST badge state
│       ├── paddle/webhook/route.ts  # Paddle webhook → grant premium
│       ├── premium/verify/route.ts  # Reconcile premium from Paddle
│       └── health/route.ts       # Uptime health check
├── components/                   # As above
├── data/
│   ├── questions.json            # Full question bank - single source of truth
│   ├── lessons.json              # Skill lessons - single source of truth
│   ├── modules.ts                # Module definitions (id, title, emoji, badgeId)
│   ├── signs.tsx                 # SVG sign components + SIGN_REGISTRY
│   └── badges.ts                 # Badge definitions
├── hooks/
│   ├── useAuth.ts                # Auth state, magic link, premium status
│   ├── useProgress.ts            # Question progress read/write + localStorage fallback
│   ├── useBadges.ts              # Badge state + trigger logic
│   ├── useQuestions.ts           # Active question bank + test-set builder
│   ├── useUnlock.ts              # Premium unlock / opens Paddle overlay
│   ├── usePaddle.ts              # Paddle.js init (client overlay)
│   ├── useABTest.ts              # A/B variant assignment
│   └── useAnalytics.ts           # Posthog event tracking
├── stores/
│   ├── appStore.ts               # Global domain state (progress, badges, user, premium)
│   └── uiStore.ts                # Global UI state (modals, onboarding, toasts)
├── lib/
│   ├── tokens.ts                 # Design tokens (colours, fonts, spacing)
│   ├── supabase.ts               # Supabase browser client
│   ├── supabase/                 # server.ts (SSR client), admin.ts (service role), schema.sql
│   ├── validIds.ts               # Server-safe valid question/badge id sets
│   ├── cooldown.ts               # In-memory per-user rate limiting for API routes
│   ├── posthogServer.ts          # Server-side PostHog capture (webhook revenue events)
│   ├── actions/billing.ts        # startCheckoutAction server action (customer + priceId)
│   └── paddle/                   # env, config, paddle (SDK), data (writer), webhook, checkout
├── types/
│   └── index.ts                  # All TypeScript types
└── lib/supabase/
    └── schema.sql                # Database schema + RLS policies
```

---

## Data files - single source of truth

### `data/questions.json`

The full question bank. Imported at build time. Never fetched at runtime. 122 questions currently, 77 of them `active` (the rest `draft`/`archived` and filtered out by `activeQuestions` in `hooks/useQuestions.ts`). All additions go here and nowhere else.

**Schema:**

```json
{
  "id": "priority_001",
  "module": "priority",
  "skill": "Right Before Left",
  "difficulty": "easy",
  "type": "true_false",
  "prompt": "At an unmarked intersection...",
  "options": [
    { "id": "a", "label": "True" },
    { "id": "b", "label": "False" }
  ],
  "correct": "b",
  "sign": "mandatory_cycle",
  "feedback": {
    "title": "Correct",
    "body": "2-3 sentences explaining why.",
    "rule": "Plain English rule. Law reference optional.",
    "tip": "One memorable sentence."
  },
  "status": "draft"
}
```

- `sign` is optional. Only present on Signs & Signals questions. Value is a key in `SIGN_REGISTRY`.
- `status` must be `"active"` for a question to appear. New questions start as `"draft"`.
- `correct` is the `id` of the correct option (e.g. `"b"`).
- `feedback.title` is always `"Correct"` or `"Not quite"`.
- `skill` must exactly match a key in `data/lessons.json` for the lesson accordion to render.

See `DATA_MODEL.md` for the full type definitions and all enums.

**ID format:** `[module]_[number]` where number is zero-padded to three digits.

| Module          | Example IDs                                                               |
| --------------- | -------------------------------------------------------------------------- |
| priority        | priority_009, priority_010                                                |
| signs           | signs_001, signs_006                                                      |
| roadusers       | roadusers_006, roadusers_007                                              |
| infrastructure  | infrastructure_006, infrastructure_007                                    |
| legal           | legal_005, legal_006                                                      |
| vocabulary      | vocabulary_006, vocabulary_007                                            |
| mixed scenarios | mixed_001-mixed_008 (module field is "priority"; skill "Mixed Scenarios") |

### `data/lessons.json`

Skill lessons displayed in the collapsible accordion above each question. One entry per skill, three difficulty variants. Keyed by skill display name - must exactly match `question.skill`.

**Schema:**

```json
{
  "lessons": {
    "Shark Teeth": {
      "easy": {
        "title": "Shark teeth (haaientanden)",
        "body": "White triangles painted on the road..."
      },
      "medium": {
        "title": "Shark teeth override defaults",
        "body": "Shark teeth are a road marking..."
      },
      "hard": {
        "title": "Shark teeth and the rules they override",
        "body": "Full explanation including edge cases..."
      }
    }
  }
}
```

Lookup: `lessons[question.skill]?.[question.difficulty]`. If no match found, the accordion is not rendered.

**Hard variants contain the fullest content.** Users are learning, not being examined. Never make hard lessons vague.

---

## Key rules

**Content is static, progress is dynamic.** Question and lesson JSON files are imported at build time. Supabase stores only `seen` and `correct` per question per user.

**Never write to Supabase from a component.** All writes go through hooks. Components call hook methods only.

**Optimistic updates always.** Update local state immediately on answer. Fire the Supabase upsert in the background.

**localStorage before auth.** Free users get progress in localStorage: `{ [questionId]: { seen: boolean, correct: boolean } }`. Same shape as Supabase. Also store an `anonymous_id` (UUID) from first visit, under the localStorage key `anon_id`. On sign-up, migrate localStorage to Supabase and clear it.

**Per-module free limit.** `FREE_PER_MODULE = 3` (see `types/index.ts`). After 3 questions in a gated module the next question is replaced by the gate screen inline - no popup. Gate shows a next-module nudge card and an upgrade prompt. Modules flagged `alwaysFree` (Fundamentals) are never gated.

**Preview-complete screen.** Once a free user has answered `FREE_PER_MODULE` questions in every gated module, the Learn index is replaced by a dedicated upsell screen: dark hero with exact progress shown, module cards with filled preview dots and the rest dimmed, and the unlock CTA.

**TypeScript strictly.** No `any`. No type assertions unless absolutely unavoidable. All types in `types/index.ts`.

**Tailwind only.** Tokens live in `lib/tokens.ts` (JS access) mirrored in `app/globals.css` `@theme` (Tailwind v4 utilities) - no `tailwind.config.ts`. Prefer token utility classes; inline `style` is only for genuinely dynamic values (animation delays, computed widths) and must reference `colors`/`fonts` from `lib/tokens.ts`, never raw hex.

---

## Freemium gate behaviour

```
User answers question 3 in a module (not premium)
  → Next question replaced by gate screen (no popup)
  → Gate screen shows:
      1. Next module card with "Try it →" button (hidden on last module)
      2. Upgrade card: "Want to finish [module name]?" + €4.99 CTA

User answers 3 questions in all 6 gated modules (18 total, not premium)
  → /learn replaced by PreviewCompleteScreen
  → Shows: dark hero + progress bar + 6 incomplete module cards + unlock CTA

GateModal (opened from upgrade CTA or nav Unlock button)
  → Trust line: "Based on Dutch traffic law (RVV 1990)" (never a user-count claim)
  → Feature list (questions, Test, badges, progress saving)
  → €4.99 button
  → Subtext: "Less than the fine for running a red light"
  → Dismissible with "Not now"
```

---

## Onboarding

First-time visitors see a single-screen overlay (`OnboardingOverlay`): what CycleDutch is, how the question → feedback loop works, "no account needed", and a CTA that deep-links to the free Fundamentals module. The first Fundamentals question is the real onboarding.

Two triggers, one persistence path:

1. **Landing CTA** (`LandingButton`) - shows the overlay before navigating
2. **First visit to any `/learn` page** (`OnboardingGate` in the learn layout) - covers visitors arriving via the guide or shared links; inside a module the CTA dismisses without redirecting

Dismissible via Skip, Escape, or backdrop click; focus is trapped in the dialog and restored on close. Persisted through `lib/onboarding.ts` (guarded localStorage, key `onboarding_done`) mirrored by `uiStore.onboardingDone`. Analytics: `onboarding_started`, `onboarding_completed`, `onboarding_skipped`. Never shown again once completed or skipped.

---

## Save progress nudges

**Return visit banner** - below the nav, shown when `totalSeen >= 3` and no account. Dismissible. "Welcome back - sign in to keep your progress safe." Opens AuthModal.

**Module complete nudge** - inside the module, after all questions are seen, free users only. "Sign in so you don't lose what you've done." Opens AuthModal.

---

## Analytics

`anonymous_id` UUID generated on first load, stored in localStorage under the key `"anon_id"`. On sign-up: `posthog.identify(userId, { anonymous_id })`.

**The `AnalyticsEvents` type in `types/index.ts` is the source of truth** for the full event list and their property shapes - it is far richer than the table below (funnel, retention, test, review, guide events). All client events fire through the `useAnalytics` hook. Add new events to that type first.

Core events (illustrative subset):

| Event                                 | Properties                                       |
| ------------------------------------- | ------------------------------------------------ |
| `question_answered`                   | questionId, skill, difficulty, correct, moduleId |
| `module_started` / `module_completed` | moduleId                                         |
| `gate_seen`                           | moduleId, source                                 |
| `checkout_started` / `gate_converted` | -                                                |
| `test_completed`                      | score_pct, passed                                |
| `badge_earned`                        | badgeId                                          |
| `onboarding_completed`                | -                                                |

Ground-truth revenue is captured **server-side** in the Paddle webhook via `lib/posthogServer.ts` (`purchase_completed`), since the browser may be closed by the time payment settles.

---

## Auth

Email (6-digit code) and Google OAuth via Supabase. No passwords.

1. User enters email in AuthModal → `signInWithOtp` → Supabase emails a code
2. User types the code into `EmailCodeForm` → `verifyOtp` → session created **in the same tab**
3. If not yet premium → Paddle overlay checkout → webhook sets `is_premium = true`
4. On first authenticated load → migrate localStorage progress to Supabase

The same email also carries the magic link, and `/auth/callback` still handles
it - the code is just the path that doesn't strand the user in a second tab.
Both email templates (Magic Link **and** Confirm signup, which is what
first-time addresses receive) must render `{{ .Token }}`.

Session length: 30 days. Cookie-based via `@supabase/ssr`.

---

## Supabase

- `@supabase/ssr` for the browser client (`lib/supabase.ts`) and server client (`lib/supabase/server.ts`)
- All tables have RLS - users access only their own rows
- `profiles` has **no client-side UPDATE policy**: `is_premium`/`provider_*` are written only by the service-role client (`lib/supabase/admin.ts`) in the Paddle webhook and premium-verify routes
- `upsert_question_progress` derives the user from `auth.uid()` - never pass a user id from the client
- Magic link is the only auth method
- See `lib/supabase/schema.sql` for full schema

---

## Environment variables

See `.env.local.example` for the full list. Validated at build time by `lib/validateEnv.ts`: the Supabase vars are always required; PostHog and Sentry vars are required on production, and the Paddle vars only when premium is enabled on production (`VERCEL_ENV === "production"` + `NEXT_PUBLIC_PREMIUM_ENABLED === "true"`). `PADDLE_ENV` and `NEXT_PUBLIC_PADDLE_ENV` must match.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
PADDLE_ENV=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_ID=
NEXT_PUBLIC_PADDLE_ENV=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

---

## Operational guides

### Adding questions

1. Add to `data/questions.json` following the schema exactly
2. Set `status: "draft"` - review against `QUESTION_FRAMEWORK.md` checklist before changing to `"active"`
3. `skill` value must exactly match a key in `data/lessons.json`
4. If the question has a `sign`, ensure the SVG exists in `data/signs.tsx` and is registered in `SIGN_REGISTRY`
5. Use the correct ID prefix for the module

### Adding a new sign SVG

1. Create the SVG component in `data/signs.tsx`
2. Register it in `SIGN_REGISTRY` with a descriptive snake_case key
3. Add the key to the `SignId` union type in `types/index.ts`
4. Reference the key in the question's `sign` field

### Adding a new skill lesson

1. Add entry to `data/lessons.json` under `lessons`
2. Key must exactly match the `skill` display name used in questions
3. Provide all three variants: `easy`, `medium`, `hard`
4. Hard variants should be the most thorough - full rules, edge cases, all relevant detail
