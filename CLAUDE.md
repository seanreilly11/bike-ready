# CLAUDE.md — BikeReady

Instructions for Claude Code when working on this project.

---

## What this project is

BikeReady is a short one-time preparation course for expats learning to cycle safely in the Netherlands. It is a web app built with Next.js, Tailwind CSS, and Supabase. Users work through 6 modules of scenario-based questions, fix mistakes in a Review queue, then test themselves in a final Test. Progress is saved per-user in Supabase.

Read `SPEC.md` for the full product spec, `DESIGN.md` for the design system, and `DATA_MODEL.md` for the complete data model before making any changes.

---

## Stack

- **Next.js 16** — App Router, TypeScript
- **Tailwind CSS** — utility-first styling, no CSS modules
- **Supabase** — Postgres + Auth (magic link) + Row Level Security
- **Stripe** — one-time payment for premium unlock
- **Posthog** — analytics and anonymous-to-identified user tracking

---

## Development principles

### React

- Functional components only. No class components.
- Co-locate state as close to where it is used as possible. Lift only when necessary.
- Prefer `useState` + `useReducer` for local state. Use React Context only for genuinely global state (auth, premium status).
- Never use `useEffect` to sync state that can be derived. Derive it inline instead.
- Keep components small and focused. If a component exceeds ~80 lines it probably needs splitting.
- Name components by what they render, not by where they are used. `QuestionCard`, not `ModulePageCard`.

### SOLID

- **Single responsibility** — each component, hook, and utility does one thing. `QuestionCard` renders a question. `useProgress` manages progress state. They do not cross into each other's concerns.
- **Open/closed** — question types (`multiple_choice`, `true_false`, `scenario_decision`) are extendable by adding new types to the data, not by modifying component logic. Use a map/registry pattern.
- **Liskov** — if a component accepts a `question` prop, any question shape that satisfies the `Question` type should work without the component knowing the specific type.
- **Interface segregation** — pass only what a component needs. Never spread entire state objects as props.
- **Dependency inversion** — components depend on abstractions, not concrete implementations. `QuestionCard` receives `onAnswer` as a prop; it does not know about Supabase.

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
bikeready/
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
│   └── api/
│       ├── progress/route.ts     # POST answers, GET progress
│       └── badges/route.ts       # GET/POST badge state
├── components/                   # As above
├── data/
│   ├── questions.json            # Full question bank — single source of truth
│   ├── lessons.json              # Skill lessons — single source of truth
│   ├── modules.ts                # Module definitions (id, title, emoji, badgeId)
│   ├── signs.tsx                 # SVG sign components + SIGN_REGISTRY
│   └── badges.ts                 # Badge definitions
├── hooks/
│   ├── useAuth.ts                # Auth state, magic link, premium status
│   ├── useProgress.ts            # Question progress read/write + localStorage fallback
│   ├── useBadges.ts              # Badge state + trigger logic
│   └── useAnalytics.ts           # Posthog event tracking
├── lib/
│   ├── tokens.ts                 # Design tokens (colours, fonts, spacing)
│   ├── supabase.ts               # Supabase browser client
│   └── stripe.ts                 # Stripe checkout helper
├── types/
│   └── index.ts                  # All TypeScript types
└── supabase/
    └── schema.sql                # Database schema + RLS policies
```

---

## Data files — single source of truth

### `data/questions.json`

The full question bank. Imported at build time. Never fetched at runtime. 77 questions currently (33 original + 44 generated). All additions go here and nowhere else.

**Schema:**

```json
{
  "id": "qp1",
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

**ID prefix conventions:**

| Module | Prefix | Example |
|---|---|---|
| priority | qp | qp9, qp10 |
| signs | qs | qs7, qs8 |
| roadusers | qr | qr6, qr7 |
| infrastructure | qi | qi6, qi7 |
| legal | ql | ql5, ql6 |
| vocabulary | qv | qv6, qv7 |
| mixed scenarios | qmix | qmix1, qmix2 |

### `data/lessons.json`

Skill lessons displayed in the collapsible accordion above each question. One entry per skill, three difficulty variants. Keyed by skill display name — must exactly match `question.skill`.

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

**localStorage before auth.** Free users get progress in localStorage: `{ [questionId]: { seen: boolean, correct: boolean } }`. Same shape as Supabase. Also store `anonymous_id` (UUID) from first visit. On sign-up, migrate localStorage to Supabase and clear it.

**Per-module free limit.** `FREE_PER_MODULE = 2`. After 2 questions in a module, question 3 is replaced by the gate screen inline — no popup. Gate shows a next-module nudge card and an upgrade prompt.

**Preview-complete screen.** Once a user has answered 2 questions in all 6 modules (12 total), the Learn index is replaced by a dedicated upsell screen: dark hero with exact progress shown, all 6 module cards with 2 filled dots and the rest dimmed, and the unlock CTA.

**TypeScript strictly.** No `any`. No type assertions unless absolutely unavoidable. All types in `types/index.ts`.

**Tailwind only.** No inline styles in production. No CSS modules. Tokens from `lib/tokens.ts` extend `tailwind.config.ts`.

---

## Freemium gate behaviour

```
User answers question 2 in a module (not premium)
  → Next question replaced by gate screen (no popup)
  → Gate screen shows:
      1. Next module card with "Try it →" button (hidden on last module)
      2. Upgrade card: "Want to finish [module name]?" + €4.99 CTA

User answers 2 questions in all 6 modules (12 total, not premium)
  → /learn replaced by PreviewCompleteScreen
  → Shows: dark hero + progress bar + 6 incomplete module cards + unlock CTA

GateModal (opened from upgrade CTA or nav Unlock button)
  → Social proof: "2,400+ expats have unlocked this"
  → Feature list (questions, Test, badges, progress saving)
  → €4.99 button
  → Subtext: "Less than the fine for running a red light"
  → Dismissible with "Not now"
```

---

## Onboarding

First-time visitors see a 3-screen overlay after clicking "Start learning" on the landing page:

1. **Welcome** — what BikeReady is, who it is for
2. **How it works** — question → feedback loop explained
3. **Suggested order** — start with Priority Rules

Animated step indicator dots. Skip option on screen 1. Stored in localStorage as `bikeready_onboarding_done`. Never shown again once completed.

---

## Save progress nudges

**Return visit banner** — below the nav, shown when `totalSeen >= 3` and no account. Dismissible. "Welcome back — sign in to keep your progress safe." Opens AuthModal.

**Module complete nudge** — inside the module, after all questions are seen, free users only. "Sign in so you don't lose what you've done." Opens AuthModal.

---

## Analytics

`anonymous_id` UUID generated on first load, stored in localStorage. On sign-up: `posthog.identify(userId, { anonymous_id })`.

| Event | Properties |
|---|---|
| `question_answered` | questionId, skill, difficulty, correct, moduleId |
| `module_started` | moduleId |
| `module_completed` | moduleId |
| `gate_seen` | moduleId, source |
| `gate_converted` | — |
| `test_completed` | score_pct, passed |
| `badge_earned` | badgeId |
| `onboarding_completed` | — |

---

## Auth

Magic link only via Supabase. No passwords.

1. User enters email in AuthModal → Supabase sends magic link
2. User clicks link → session created
3. If not yet premium → Stripe checkout → webhook sets `is_premium = true`
4. On first authenticated load → migrate localStorage progress to Supabase

Session length: 30 days. Cookie-based via `@supabase/ssr`.

---

## Supabase

- `@supabase/ssr` for the browser client
- All tables have RLS — users access only their own rows
- `is_premium` boolean on `profiles`, set by Stripe webhook
- Magic link is the only auth method
- See `supabase/schema.sql` for full schema

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Operational guides

### Adding questions
1. Add to `data/questions.json` following the schema exactly
2. Set `status: "draft"` — review against `QUESTION_FRAMEWORK.md` checklist before changing to `"active"`
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
4. Hard variants should be the most thorough — full rules, edge cases, all relevant detail
