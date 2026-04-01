# BikeReady — Project Kickoff Prompt for Claude Code

Use this prompt when starting work on BikeReady from an empty repo. Copy and paste it as your first message to Claude Code.

---

## Prompt

I'm building BikeReady — a short one-time preparation course for expats learning to cycle safely in the Netherlands. The app is fully designed and specced. Your job is to scaffold the project and build the foundation.

**First, read these files in this order before writing a single line of code:**

1. `CLAUDE.md` — how to work on this project, stack, principles, file structure, all operational rules
2. `SPEC.md` — full product specification
3. `DATA_MODEL.md` — complete data model, all types, all schemas
4. `DESIGN.md` — design system, tokens, component API, responsive layout rules

These files are the source of truth. If anything in your output conflicts with them, the files win.

---

**Once you've read the docs, do the following in order:**

### Step 1 — Project scaffold

Set up the Next.js 16 project with the exact file structure defined in `CLAUDE.md`. Include:

- Next.js 16 App Router with TypeScript
- Tailwind CSS configured with the design tokens from `DESIGN.md` (Bricolage Grotesque + DM Mono fonts, all colour tokens as custom Tailwind values)
- Supabase client (`@supabase/ssr`)
- Posthog client
- All environment variable placeholders in `.env.local.example`
- `types/index.ts` with every type defined in `DATA_MODEL.md` — `Question`, `Option`, `Feedback`, `Feedback`, `Module`, `Badge`, `QuestionProgress`, `EarnedBadge`, `TestResult`, all enums and unions
- `lib/tokens.ts` with all colour and font tokens
- `supabase/schema.sql` with the full schema from `DATA_MODEL.md` (all four tables, RLS policies, upsert logic)

### Step 2 — Static data files

Create the data layer:

- `data/questions.json` — copy the questions from the provided `questions.json` file (44 questions, all `status: "draft"`)
- `data/lessons.json` — copy from the provided `lessons.json` file (13 skills, 3 variants each)
- `data/modules.ts` — all 6 modules as defined in `DATA_MODEL.md`
- `data/badges.ts` — all 7 badges as defined in `SPEC.md`
- `data/signs.tsx` — the 7 SVG sign components with `SIGN_REGISTRY`, as described in `DATA_MODEL.md`

### Step 3 — Primitive UI components

Build the components in `components/ui/` first — nothing else depends on them:

- `Button` — `primary`, `secondary`, `ghost` variants, `sm`/`md`/`lg` sizes, `disabled` state, `w-full` prop
- `Card` — `accent`, `hover`, `variant` props as per `DESIGN.md`
- `Badge` — difficulty variants (easy/medium/hard), earned/locked badge variants
- `MasteryDot` — `unseen`, `seen`, `correct`, `active` states
- `ProgressBar` — animated fill, colour prop
- `SignDisplay` — looks up component from `SIGN_REGISTRY` by `signId` prop

All components must use Tailwind only. No inline styles. Tokens from `lib/tokens.ts` via `tailwind.config.ts`.

### Step 4 — Hooks

Build the hooks before any pages:

- `useAuth` — Supabase auth state, magic link send, premium status, sign out
- `useProgress` — read/write `question_progress`, localStorage fallback with migration on sign-up, derived helpers (dot state, module status, review queue, preview complete check)
- `useBadges` — read earned badges, trigger badge on module completion
- `useAnalytics` — Posthog event tracking with the events defined in `DATA_MODEL.md`

### Step 5 — Question components

- `FeedbackPanel` — correct/incorrect states, title/body/rule/tip sections
- `OptionButton` — all 5 states from `DESIGN.md`
- `LessonAccordion` — looks up lesson from `data/lessons.json` by skill + difficulty, collapsed by default, resets on question change
- `QuestionCard` — composes `LessonAccordion`, `SignDisplay`, prompt card, `OptionButton` list, `FeedbackPanel`. `hideCorrect` prop for Test mode.

### Step 6 — Layout components

- `Nav` — sticky, hidden on `/`, three items, review red dot, premium chip / sign in button
- `GateModal` — social proof, feature list, €4.99 CTA, dismissible
- `AuthModal` — email input → sent confirmation, magic link flow
- `OnboardingOverlay` — 3 screens, step indicator, skip on screen 1, localStorage persistence
- `ReturnBanner` — dismissible, shown when `totalSeen >= 3` and no account
- `BadgeToast` — animated, auto-dismiss after 4s
- `DotMap` — row of `MasteryDot` components, free-limit dimming, clickable
- `ModuleCard` — all status variants, dot map, preview dimming

### Step 7 — Pages

Build pages in this order:

1. **`/` (Landing page)** — orange hero with social proof, how-it-works cards, module grid, foreigner callout, two CTAs. No nav. Triggers `OnboardingOverlay` on first visit.
2. **`/learn` (Module index)** — free banner, module cards, badge grid. Shows `PreviewCompleteScreen` when all 12 free questions used (build this as a separate component).
3. **`/learn/[moduleId]` (Module session)** — sticky header, dot map, `QuestionCard`, gate screen inline after question 2, all-done state with save nudge, next-module nudge.
4. **`/review` (Review queue)** — empty state, question list grouped by module, active question view, all-cleared state.
5. **`/test` (Test)** — intro → questions (no mid-question feedback) → results with full feedback review and share moment.

### Step 8 — API routes

- `app/api/progress/route.ts` — POST to upsert `question_progress`, GET to fetch progress for authenticated user
- `app/api/badges/route.ts` — POST to award badge, GET to fetch earned badges

---

**Throughout all of the above:**

- Mobile-first, fully responsive. Follow the breakpoints and layout rules in `DESIGN.md` exactly.
- TypeScript strictly — no `any`, all types from `types/index.ts`.
- Tailwind only for styling — no inline styles, no CSS modules.
- Never write to Supabase directly from a component — always via hooks.
- Optimistic updates on every answer — local state first, Supabase write in background.
- `questions.json` and `lessons.json` are the single source of truth for content — never duplicate or inline content.

**After each step, confirm what was built and flag any decisions that deviated from the docs before moving to the next step.**

---

## Files to add to the repo alongside this prompt

Before running the prompt, add these files to the repo root:

```
CLAUDE.md              — working instructions (Claude Code reads this automatically)
SPEC.md                — product specification
DATA_MODEL.md          — complete data model
DESIGN.md              — design system
QUESTION_FRAMEWORK.md  — question writing framework (for future content work)
data/questions.json    — question bank (44 questions, status: "draft")
data/lessons.json      — skill lessons (13 skills, 3 variants each)
```

Claude Code will read `CLAUDE.md` automatically on every task. Reference the others explicitly in prompts when working on specific areas.

---

## Follow-up prompts for subsequent sessions

Once the foundation is built, use these focused prompts for subsequent work:

**Activating questions:**
> Review the questions in `data/questions.json` against `QUESTION_FRAMEWORK.md`. For each question that passes the checklist, change `status` from `"draft"` to `"active"`. Flag any that need editing before activation.

**Adding Stripe:**
> Add Stripe one-time payment for the premium unlock. On successful payment, set `is_premium = true` on the user's profile via a Stripe webhook. The price is €4.99. Use the `NEXT_PUBLIC_STRIPE_PRICE_ID` environment variable. After payment, redirect back to `/learn` with premium unlocked.

**Adding Posthog:**
> Wire up the `useAnalytics` hook to Posthog using `NEXT_PUBLIC_POSTHOG_KEY`. Implement all events defined in `DATA_MODEL.md`. Ensure `anonymous_id` is generated on first load and stored in localStorage. On sign-up, call `posthog.identify()` with the Supabase user ID and the `anonymous_id`.

**Generating more questions:**
> Read `QUESTION_FRAMEWORK.md`. Generate [N] new questions for the [module] module covering [topics]. Output as JSON matching the schema in `DATA_MODEL.md` exactly, with `status: "draft"`. Append to `data/questions.json`.
