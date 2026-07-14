# Onboarding Wizard — Design Spec

**Date:** 2026-07-14
**Status:** Approved, ready for planning
**Related:** UX principle #4 (Build Investment Early) and #2 (Progress & Momentum) from `docs/UX.md`

---

## Goal

Turn the single-screen onboarding overlay into a short 4-step wizard that builds user investment through two meaningful choices before the app asks for anything. Effort-justification research shows users who make a few upfront choices are retained more. Every step must be a real micro-commitment, not filler.

## Why (principles)

- **#4 Build Investment Early** — a choice made before the paywall/sign-in converts the product from "a thing I'm trying" into "a thing I'm building." The two choices (situation, timeline) are both *spent*, so the effort pays off visibly.
- **#2 Progress & Momentum** — the step dots give a visible, reachable finish line from screen one.

## Non-goals (out of scope)

- A confidence/skill self-assessment step. It can't change behavior yet (questions serve in fixed order; no difficulty-adaptive serving), so it would be effort without payoff. Deferred.
- Retroactively asking returning users who already completed onboarding. The profile is a first-run device; returning users never see the wizard.
- Consuming `ridingTimeline` in later loss-aversion nudges ("your ride is coming up"). We store it now; wiring it into nudges is a follow-up.
- Difficulty-adaptive question serving.

---

## Current state

- `components/layout/OnboardingOverlay.tsx` — a single-screen dialog. Props: `ctaLabel: string`, `onComplete: () => void`, `onSkip: () => void`. Fires `onboarding_started` on mount, `onboarding_completed`/`onboarding_skipped` in `finish(skipped)`. Focus management via `useModalFocus`.
- `components/layout/LandingButton.tsx` — shows the overlay; `onComplete` pushes `/learn/fundamentals`, `onSkip` pushes `/learn`. `ctaLabel="Start Fundamentals"`.
- `components/layout/OnboardingGate.tsx` — shows the overlay on first `/learn*` visit. Branches on `onLearnIndex` (pathname === "/learn"): on the index, `ctaLabel="Start Fundamentals"` and `onComplete` pushes `/learn/fundamentals`; inside a module, `ctaLabel="Let's go"` and `onComplete` is a no-op (stay put). `onSkip` no-op.
- `lib/onboarding.ts` — guarded localStorage for the `onboarding_done` key: `isOnboardingDone()`, `markOnboardingDone()`.
- `stores/uiStore.ts` — `onboardingDone: boolean` + `completeOnboarding()` (calls `markOnboardingDone()` + sets the flag).
- `types/index.ts` — `AnalyticsEvents` includes `onboarding_started: {}`, `onboarding_completed: {}`, `onboarding_skipped: {}`.

---

## Design

### The four screens

Every screen shows: a 4-dot progress indicator, a **Skip** control, and (steps 2–4) a **Back** control. Escape and backdrop click both skip. Focus stays trapped in the dialog (`useModalFocus`, already in place).

**Step 1 · Intro**
- Bike icon, heading "Welcome to CycleDutch".
- Body: the question→feedback loop, "no account needed to start." (Reuse today's copy, trimmed.)
- Primary CTA: **Get started →** (advances to step 2).

**Step 2 · Situation** — "What brings you to Dutch cycling?"
- Three single-select pills, default pre-selected **Just moved here**:
  - `Just moved here` · `Commute daily` · `Occasional rides`
- Primary CTA: **Continue →** (advances to step 3).

**Step 3 · Timeline** — "When do you start riding?"
- Three single-select pills, default pre-selected **This month**:
  - `This week` · `This month` · `Just exploring`
- Primary CTA: **Continue →** (advances to step 4).

**Step 4 · Your plan** — personalized payoff
- Heading "Your plan".
- Personalized line = situation base + timeline clause (see copy map).
- Reassurance line: the target module + "3 free questions, no account needed" (or "the essentials, all free" for the always-free Fundamentals target).
- Primary CTA: **Start with {Module} →** — completes onboarding and deep-links to the mapped module.

### Situation → module map

| Situation (`RiderProfile`) | Module (`ModuleId`) | Rationale |
|---|---|---|
| `just_moved` | `fundamentals` | Essentials; always-free = best free first experience |
| `commuter` | `priority` | Right-of-way = the #1 daily-commuter near-miss |
| `occasional` | `signs` | Recognizing what you encounter on leisure rides |

Note: `priority` and `signs` are gated (3 free questions, then the gate). Accepted: a first-timer gets their **3 most-relevant** free questions ("give before you ask"), and Fundamentals stays one tap away on the index.

### Plan copy map (situation base + timeline clause)

Base line by `RiderProfile`:
- `just_moved`: "New here? Start with the fundamentals every Dutch cyclist knows."
- `commuter`: "Commuting? Right-of-way is where most near-misses happen — start there."
- `occasional`: "Riding for fun? Learn to read the signs that keep you out of trouble."

Clause appended by `RidingTimeline`:
- `this_week`: " You ride this week — let's move fast."
- `this_month`: "" (none)
- `exploring`: " No rush — go at your pace."

The full plan line is `base + clause`. Kept as a small lookup, not a 3×3 matrix.

### Flow unification (a simplification)

Every onboarding entry point now shows the **same** wizard, and completing **always** deep-links to the mapped module. This removes:
- `OnboardingGate`'s `onLearnIndex` branching and dual `ctaLabel`/`onComplete`.
- The static `ctaLabel` prop on `OnboardingOverlay` (CTAs are now internal per step).

Callers reduce to: `onComplete={(moduleId) => router.push(\`/learn/${moduleId}\`)}`. `onSkip` stays caller-controlled (LandingButton → `/learn`; OnboardingGate → no-op).

---

## Data, state, persistence

### Types (`types/index.ts`)

```ts
export type RiderProfile = "just_moved" | "commuter" | "occasional";
export type RidingTimeline = "this_week" | "this_month" | "exploring";
```

### Single source of truth (`data/onboardingProfiles.ts`, new)

Exports the pill options and the copy/module maps so the overlay holds no inline content:

```ts
import type { RiderProfile, RidingTimeline, ModuleId } from "@/types";

export const RIDER_PROFILES: {
  id: RiderProfile;
  label: string;
  moduleId: ModuleId;
  base: string;
}[] = [ /* just_moved, commuter, occasional per the maps above */ ];

export const RIDING_TIMELINES: {
  id: RidingTimeline;
  label: string;
  clause: string;
}[] = [ /* this_week, this_month, exploring */ ];

export const DEFAULT_PROFILE: RiderProfile = "just_moved";
export const DEFAULT_TIMELINE: RidingTimeline = "this_month";

export function moduleForProfile(p: RiderProfile): ModuleId; // lookup
export function planLine(p: RiderProfile, t: RidingTimeline): string; // base + clause
```

### Persistence (`lib/onboarding.ts`)

Add guarded getters/setters mirroring the existing pattern, keys `rider_profile` and `riding_timeline`:

```ts
export function getRiderProfile(): RiderProfile | null;
export function setRiderProfile(p: RiderProfile): void;
export function getRidingTimeline(): RidingTimeline | null;
export function setRidingTimeline(t: RidingTimeline): void;
```

(Read functions validate the stored string against the known union and return `null` otherwise.)

### Store (`stores/uiStore.ts`)

- Add state: `riderProfile: RiderProfile | null` (init `null`), `ridingTimeline: RidingTimeline | null` (init `null`).
- Change `completeOnboarding` to accept optional choices:
  ```ts
  completeOnboarding: (choices?: { profile: RiderProfile; timeline: RidingTimeline }) => void
  ```
  It calls `markOnboardingDone()`, and when `choices` is present also persists them (`setRiderProfile`/`setRidingTimeline`) and sets `riderProfile`/`ridingTimeline` in the store. Skip path calls `completeOnboarding()` with no args.

---

## Component: OnboardingOverlay (rewrite)

- Props: `onComplete: (moduleId: ModuleId) => void`, `onSkip: () => void`. (`ctaLabel` removed.)
- Internal state: `step: 0 | 1 | 2 | 3`, `profile: RiderProfile` (init `DEFAULT_PROFILE`), `timeline: RidingTimeline` (init `DEFAULT_TIMELINE`).
- Renders the current step's content + the 4-dot indicator + Back (steps > 0) + Skip + the step's primary CTA.
- `finish(skipped)`:
  - **skipped** → `completeOnboarding()` (no choices), `track("onboarding_skipped", { step })`, `onSkip()`.
  - **completed** (only reachable from step 4's CTA) → `completeOnboarding({ profile, timeline })`, `track("onboarding_profile_selected", { profile, timeline })`, `track("onboarding_completed", {})`, `onComplete(moduleForProfile(profile))`.
- `track("onboarding_started", {})` on mount (unchanged).
- Keeps `useModalFocus(() => finish(true))` for focus-in/restore/Escape/Tab-trap. Advancing a step re-renders content inside the same trapped dialog.

## Analytics (`types/index.ts`)

- New: `onboarding_profile_selected: { profile: RiderProfile; timeline: RidingTimeline }`.
- Change: `onboarding_skipped: { step: number }` (was `{}`) — records which step the user bailed on, giving a per-step drop-off funnel.
- Unchanged: `onboarding_started: {}`, `onboarding_completed: {}`.

## Callers

- `LandingButton.tsx` — overlay usage becomes `onComplete={(moduleId) => router.push(\`/learn/${moduleId}\`)}`; `onSkip` unchanged (dismiss + push `/learn`). Remove the `ctaLabel` prop. (Leave the `cta_clicked` / `getStoredVariant` tracking as-is.)
- `OnboardingGate.tsx` — drop the `onLearnIndex` branch; `onComplete={(moduleId) => router.push(\`/learn/${moduleId}\`)}`; `onSkip` no-op. Remove `ctaLabel`.

---

## Testing

- **`tests/components/OnboardingOverlay.test.tsx` (rewrite):**
  - renders step 1 (intro) first; step dots present.
  - "Get started" advances to Situation; default pill = Just moved here.
  - "Continue" advances to Timeline; default pill = This month; selecting a different pill updates selection.
  - "Continue" advances to Your plan; the plan line reflects the chosen situation + timeline; CTA label names the mapped module.
  - completing the final CTA calls `onComplete("priority")` (for commuter) and fires `onboarding_profile_selected` with `{ profile, timeline }` and `onboarding_completed`.
  - Back from a later step returns to the previous step and preserves selections.
  - Skip on step 2 fires `onboarding_skipped` with `{ step: 1 }` and calls `onSkip`; Escape skips.
  - focus moves into the dialog on mount (retain existing assertion).
- **`tests/components/OnboardingGate.test.tsx` (update):** new `onComplete(moduleId)` signature; remove `onLearnIndex`/`ctaLabel` assertions; a completed wizard navigates to the mapped module.
- **`tests/stores/uiStore.test.ts` (extend):** `completeOnboarding({ profile, timeline })` sets `riderProfile`/`ridingTimeline`; `completeOnboarding()` leaves them `null`.
- Full suite + typecheck + lint + build green.

## Acceptance

- First-time visitor via landing CTA or first `/learn*` visit sees the 4-step wizard.
- Defaults are pre-selected (Just moved here / This month) so a user can click straight through.
- Completing deep-links to the mapped module and persists `rider_profile` + `riding_timeline` to localStorage (survives reload; wizard never reappears).
- Skipping (button/Esc/backdrop) records the step and follows the caller's skip behavior.
- Returning users (onboarding done) never see the wizard.
