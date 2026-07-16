# Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-screen onboarding overlay with a 4-step wizard (Intro → Situation → Timeline → Your plan) that captures two choices, personalizes the payoff, deep-links to the mapped module, and persists the choices.

**Architecture:** A new single-source-of-truth data module (`data/onboardingProfiles.ts`) holds the pill options, module map, and copy. `OnboardingOverlay` becomes a self-contained stepper owning step/profile/timeline state; callers pass only `onComplete(moduleId)` / `onSkip()`. Choices persist through guarded localStorage helpers in `lib/onboarding.ts`, mirrored into `uiStore`. New types and analytics events live in `types/index.ts`.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict (no `any`), Zustand, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-14-onboarding-wizard-design.md`

**Conventions:** single-file test runs `npx vitest run <path>`; full suite `npm run test:run`. Commits: short subject, no body, **no `Co-Authored-By` trailer**. The vitest worker pool occasionally flakes on Windows with "no tests / all files failed" — if the full suite reports that, re-run once before treating it as real.

---

## File Structure

| File | Change |
|---|---|
| `types/index.ts` | Add `RiderProfile`, `RidingTimeline`; add `onboarding_profile_selected`; change `onboarding_skipped` to `{ step: number }` |
| `data/onboardingProfiles.ts` | **New** — pill options, module map, copy, `moduleForProfile`, `planLine`, defaults |
| `lib/onboarding.ts` | Add guarded get/set for `rider_profile` + `riding_timeline` |
| `stores/uiStore.ts` | Add `riderProfile`/`ridingTimeline` state; `completeOnboarding(choices?)` persists them |
| `components/layout/OnboardingOverlay.tsx` | Rewrite as the 4-step wizard; props drop `ctaLabel`, `onComplete` gains `moduleId` |
| `components/layout/LandingButton.tsx` | Overlay usage: `onComplete={(moduleId) => router.push(...)}`, remove `ctaLabel` |
| `components/layout/OnboardingGate.tsx` | Drop `onLearnIndex` branch + `usePathname`; unified `onComplete` |
| `tests/data/onboardingProfiles.test.ts` | **New** |
| `tests/lib/onboarding.test.ts` | New cases (create if file absent) |
| `tests/stores/uiStore.test.ts` | Extend for choices |
| `tests/components/OnboardingOverlay.test.tsx` | Rewrite for the wizard |
| `tests/components/OnboardingGate.test.tsx` | Update for unified navigation |

---

### Task 1: Types and the data source of truth

**Files:**
- Modify: `types/index.ts`
- Create: `data/onboardingProfiles.ts`
- Test: `tests/data/onboardingProfiles.test.ts`

- [ ] **Step 1: Add the union types to `types/index.ts`**

Immediately after the `ModuleId` union type definition (the block ending in `| "vocabulary";`), add:

```ts
export type RiderProfile = "just_moved" | "commuter" | "occasional";
export type RidingTimeline = "this_week" | "this_month" | "exploring";
```

- [ ] **Step 2: Update the analytics events in `types/index.ts`**

In the `AnalyticsEvents` interface, the current lines are:

```ts
  onboarding_completed: Record<string, never>;
```
and (further down)
```ts
  onboarding_skipped: Record<string, never>;
```

Change `onboarding_skipped` to carry the step, and add the profile event right after `onboarding_completed`:

```ts
  onboarding_completed: Record<string, never>;
  onboarding_profile_selected: { profile: RiderProfile; timeline: RidingTimeline };
```
```ts
  onboarding_skipped: { step: number };
```

(`RiderProfile`/`RidingTimeline` are defined in this same file, so no import is needed.)

- [ ] **Step 3: Write the failing data test**

Create `tests/data/onboardingProfiles.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  moduleForProfile,
  planLine,
  RIDER_PROFILES,
  RIDING_TIMELINES,
} from "@/data/onboardingProfiles";

describe("onboardingProfiles", () => {
  it("maps each profile to its module", () => {
    expect(moduleForProfile("just_moved")).toBe("fundamentals");
    expect(moduleForProfile("commuter")).toBe("priority");
    expect(moduleForProfile("occasional")).toBe("signs");
  });

  it("builds a plan line from base + timeline clause", () => {
    expect(planLine("commuter", "this_week")).toBe(
      "Commuting? Right-of-way is where most near-misses happen - start there. You ride this week - let's move fast.",
    );
    expect(planLine("just_moved", "this_month")).toBe(
      "New here? Start with the fundamentals every Dutch cyclist knows.",
    );
  });

  it("has three profiles and three timelines", () => {
    expect(RIDER_PROFILES).toHaveLength(3);
    expect(RIDING_TIMELINES).toHaveLength(3);
  });
});
```

- [ ] **Step 4: Run to verify failure**

Run: `npx vitest run tests/data/onboardingProfiles.test.ts`
Expected: FAIL — module `@/data/onboardingProfiles` does not exist.

- [ ] **Step 5: Create `data/onboardingProfiles.ts`**

```ts
import type { ModuleId, RiderProfile, RidingTimeline } from "@/types";

export const RIDER_PROFILES: {
  id: RiderProfile;
  label: string;
  moduleId: ModuleId;
  base: string;
}[] = [
  {
    id: "just_moved",
    label: "Just moved here",
    moduleId: "fundamentals",
    base: "New here? Start with the fundamentals every Dutch cyclist knows.",
  },
  {
    id: "commuter",
    label: "Commute daily",
    moduleId: "priority",
    base: "Commuting? Right-of-way is where most near-misses happen - start there.",
  },
  {
    id: "occasional",
    label: "Occasional rides",
    moduleId: "signs",
    base: "Riding for fun? Learn to read the signs that keep you out of trouble.",
  },
];

export const RIDING_TIMELINES: {
  id: RidingTimeline;
  label: string;
  clause: string;
}[] = [
  {
    id: "this_week",
    label: "This week",
    clause: " You ride this week - let's move fast.",
  },
  { id: "this_month", label: "This month", clause: "" },
  {
    id: "exploring",
    label: "Just exploring",
    clause: " No rush - go at your pace.",
  },
];

export const DEFAULT_PROFILE: RiderProfile = "just_moved";
export const DEFAULT_TIMELINE: RidingTimeline = "this_month";

export function moduleForProfile(profile: RiderProfile): ModuleId {
  return (
    RIDER_PROFILES.find((p) => p.id === profile)?.moduleId ?? "fundamentals"
  );
}

export function planLine(
  profile: RiderProfile,
  timeline: RidingTimeline,
): string {
  const base =
    RIDER_PROFILES.find((p) => p.id === profile)?.base ?? RIDER_PROFILES[0].base;
  const clause = RIDING_TIMELINES.find((t) => t.id === timeline)?.clause ?? "";
  return base + clause;
}
```

- [ ] **Step 6: Run to verify pass + typecheck**

Run: `npx vitest run tests/data/onboardingProfiles.test.ts && npm run typecheck`
Expected: PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add types/index.ts data/onboardingProfiles.ts tests/data/onboardingProfiles.test.ts
git commit -m "feat: onboarding rider-profile types and data source"
```

---

### Task 2: Persistence helpers and store wiring

**Files:**
- Modify: `lib/onboarding.ts`
- Modify: `stores/uiStore.ts`
- Test: `tests/lib/onboarding.test.ts`, `tests/stores/uiStore.test.ts`

- [ ] **Step 1: Write the failing persistence test**

Create `tests/lib/onboarding.test.ts` (if it already exists, add this `describe` block to it):

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  getRiderProfile,
  setRiderProfile,
  getRidingTimeline,
  setRidingTimeline,
} from "@/lib/onboarding";

describe("rider profile persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a stored profile and timeline", () => {
    setRiderProfile("commuter");
    setRidingTimeline("this_week");
    expect(getRiderProfile()).toBe("commuter");
    expect(getRidingTimeline()).toBe("this_week");
  });

  it("returns null when nothing is stored", () => {
    expect(getRiderProfile()).toBeNull();
    expect(getRidingTimeline()).toBeNull();
  });

  it("returns null for an unrecognised stored value", () => {
    localStorage.setItem("rider_profile", "astronaut");
    localStorage.setItem("riding_timeline", "someday");
    expect(getRiderProfile()).toBeNull();
    expect(getRidingTimeline()).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lib/onboarding.test.ts`
Expected: FAIL — the four functions are not exported.

- [ ] **Step 3: Add the helpers to `lib/onboarding.ts`**

At the top, add the import:

```ts
import type { RiderProfile, RidingTimeline } from "@/types";
```

At the end of the file, add:

```ts
const RIDER_PROFILE_KEY = "rider_profile";
const RIDING_TIMELINE_KEY = "riding_timeline";

const RIDER_PROFILE_VALUES: Set<string> = new Set([
  "just_moved",
  "commuter",
  "occasional",
]);
const RIDING_TIMELINE_VALUES: Set<string> = new Set([
  "this_week",
  "this_month",
  "exploring",
]);

export function getRiderProfile(): RiderProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(RIDER_PROFILE_KEY);
    return v && RIDER_PROFILE_VALUES.has(v) ? (v as RiderProfile) : null;
  } catch {
    return null;
  }
}

export function setRiderProfile(profile: RiderProfile): void {
  try {
    localStorage.setItem(RIDER_PROFILE_KEY, profile);
  } catch {
    // Storage blocked - the uiStore field still holds it for this session
  }
}

export function getRidingTimeline(): RidingTimeline | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(RIDING_TIMELINE_KEY);
    return v && RIDING_TIMELINE_VALUES.has(v) ? (v as RidingTimeline) : null;
  } catch {
    return null;
  }
}

export function setRidingTimeline(timeline: RidingTimeline): void {
  try {
    localStorage.setItem(RIDING_TIMELINE_KEY, timeline);
  } catch {
    // Storage blocked
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/lib/onboarding.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing store test**

Add to `tests/stores/uiStore.test.ts`. First, add `riderProfile: null` and `ridingTimeline: null` to the state-reset object at the top of the file (the object passed to `useUIStore.setState` in `beforeEach`, so completions don't leak between tests). Then add:

```ts
  describe("completeOnboarding choices", () => {
    it("stores and persists profile + timeline when choices are given", () => {
      localStorage.clear();
      useUIStore
        .getState()
        .completeOnboarding({ profile: "commuter", timeline: "this_week" });
      expect(useUIStore.getState().onboardingDone).toBe(true);
      expect(useUIStore.getState().riderProfile).toBe("commuter");
      expect(useUIStore.getState().ridingTimeline).toBe("this_week");
      expect(localStorage.getItem("rider_profile")).toBe("commuter");
      expect(localStorage.getItem("riding_timeline")).toBe("this_week");
    });

    it("leaves profile + timeline null when no choices are given", () => {
      useUIStore.getState().completeOnboarding();
      expect(useUIStore.getState().onboardingDone).toBe(true);
      expect(useUIStore.getState().riderProfile).toBeNull();
      expect(useUIStore.getState().ridingTimeline).toBeNull();
    });
  });
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run tests/stores/uiStore.test.ts`
Expected: FAIL — `completeOnboarding` takes no argument / `riderProfile` undefined.

- [ ] **Step 7: Update `stores/uiStore.ts`**

Change the imports at the top:

```ts
import { markOnboardingDone, setRiderProfile, setRidingTimeline } from '@/lib/onboarding'
import type { ModuleId, RiderProfile, RidingTimeline } from '@/types'
```

(The `ModuleId` import already exists from an earlier feature — if the line is `import type { ModuleId } from '@/types'`, extend it to include `RiderProfile, RidingTimeline`.)

Add to the `UIState` interface, near `onboardingDone`:

```ts
  riderProfile: RiderProfile | null
  ridingTimeline: RidingTimeline | null
```

Change the `completeOnboarding` signature in the interface:

```ts
  completeOnboarding: (choices?: { profile: RiderProfile; timeline: RidingTimeline }) => void
```

In the store body, add the initial values near `onboardingDone: false`:

```ts
  riderProfile: null,
  ridingTimeline: null,
```

Replace the `completeOnboarding` implementation:

```ts
  completeOnboarding: (choices) => {
    markOnboardingDone()
    if (choices) {
      setRiderProfile(choices.profile)
      setRidingTimeline(choices.timeline)
      set({
        onboardingDone: true,
        riderProfile: choices.profile,
        ridingTimeline: choices.timeline,
      })
    } else {
      set({ onboardingDone: true })
    }
  },
```

- [ ] **Step 8: Run to verify pass + typecheck**

Run: `npx vitest run tests/lib/onboarding.test.ts tests/stores/uiStore.test.ts && npm run typecheck`
Expected: PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add lib/onboarding.ts stores/uiStore.ts tests/lib/onboarding.test.ts tests/stores/uiStore.test.ts
git commit -m "feat: persist onboarding rider profile and timeline"
```

---

### Task 3: OnboardingOverlay 4-step wizard

**Files:**
- Modify: `components/layout/OnboardingOverlay.tsx` (rewrite)
- Test: `tests/components/OnboardingOverlay.test.tsx` (rewrite)

- [ ] **Step 1: Rewrite the overlay test**

Replace the entire contents of `tests/components/OnboardingOverlay.test.tsx`:

```tsx
const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track, identify: vi.fn() }),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingOverlay from "@/components/layout/OnboardingOverlay";
import { useUIStore } from "@/stores/uiStore";

function renderOverlay(
  overrides: Partial<{
    onComplete: (moduleId: string) => void;
    onSkip: () => void;
  }> = {},
) {
  const onComplete = overrides.onComplete ?? vi.fn();
  const onSkip = overrides.onSkip ?? vi.fn();
  render(<OnboardingOverlay onComplete={onComplete} onSkip={onSkip} />);
  return { onComplete, onSkip };
}

async function advance(user: ReturnType<typeof userEvent.setup>) {
  // step 0 -> 1
  await user.click(screen.getByRole("button", { name: /get started/i }));
}

describe("OnboardingOverlay wizard", () => {
  beforeEach(() => {
    track.mockReset();
    localStorage.clear();
    useUIStore.setState({
      onboardingDone: false,
      riderProfile: null,
      ridingTimeline: null,
    });
  });

  it("opens on the intro step with no choice pills yet", () => {
    renderOverlay();
    expect(screen.getByText(/welcome to cycledutch/i)).toBeInTheDocument();
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /just moved here/i }),
    ).not.toBeInTheDocument();
  });

  it("tracks onboarding_started on mount", () => {
    renderOverlay();
    expect(track).toHaveBeenCalledWith("onboarding_started", {});
  });

  it("moves focus into the dialog on open", () => {
    renderOverlay();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(
      true,
    );
  });

  it("defaults the situation pill to Just moved here", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await advance(user);
    expect(
      screen.getByRole("button", { name: /just moved here/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("completes with defaults: fundamentals + this_month", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderOverlay();
    await advance(user); // -> situation
    await user.click(screen.getByRole("button", { name: /continue/i })); // -> timeline
    await user.click(screen.getByRole("button", { name: /continue/i })); // -> plan
    await user.click(
      screen.getByRole("button", { name: /start with fundamentals/i }),
    );
    expect(track).toHaveBeenCalledWith("onboarding_profile_selected", {
      profile: "just_moved",
      timeline: "this_month",
    });
    expect(track).toHaveBeenCalledWith("onboarding_completed", {});
    expect(onComplete).toHaveBeenCalledWith("fundamentals");
    expect(useUIStore.getState().onboardingDone).toBe(true);
    expect(localStorage.getItem("rider_profile")).toBe("just_moved");
  });

  it("routes a commuter riding this week to Priority Rules", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /commute daily/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /this week/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(
      screen.getByRole("button", { name: /start with priority rules/i }),
    );
    expect(onComplete).toHaveBeenCalledWith("priority");
    expect(track).toHaveBeenCalledWith("onboarding_profile_selected", {
      profile: "commuter",
      timeline: "this_week",
    });
  });

  it("Back preserves the situation selection", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /commute daily/i }));
    await user.click(screen.getByRole("button", { name: /continue/i })); // timeline
    await user.click(screen.getByRole("button", { name: /back/i })); // situation
    expect(
      screen.getByRole("button", { name: /commute daily/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("Skip on the situation step records step 1", async () => {
    const user = userEvent.setup();
    const { onSkip, onComplete } = renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(track).toHaveBeenCalledWith("onboarding_skipped", { step: 1 });
    expect(onSkip).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("skipping on the final step records step 3", async () => {
    const user = userEvent.setup();
    const { onSkip } = renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(track).toHaveBeenCalledWith("onboarding_skipped", { step: 3 });
    expect(onSkip).toHaveBeenCalled();
  });

  it("skips via Escape", async () => {
    const user = userEvent.setup();
    const { onSkip } = renderOverlay();
    await user.keyboard("{Escape}");
    expect(onSkip).toHaveBeenCalled();
    expect(useUIStore.getState().onboardingDone).toBe(true);
  });

  it("traps Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    renderOverlay();
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/components/OnboardingOverlay.test.tsx`
Expected: FAIL — the overlay still requires `ctaLabel` and has no wizard steps.

- [ ] **Step 3: Rewrite `components/layout/OnboardingOverlay.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Bike, ArrowRight, ArrowLeft } from "lucide-react";
import type { ModuleId, RiderProfile, RidingTimeline } from "@/types";
import Button from "@/components/ui/Button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useUIStore } from "@/stores/uiStore";
import modules from "@/data/modules";
import {
  RIDER_PROFILES,
  RIDING_TIMELINES,
  DEFAULT_PROFILE,
  DEFAULT_TIMELINE,
  moduleForProfile,
  planLine,
} from "@/data/onboardingProfiles";

interface OnboardingOverlayProps {
  onComplete: (moduleId: ModuleId) => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 4;

// A 4-step investment wizard: intro -> situation -> timeline -> personalized
// plan. Two choices are captured and spent (situation picks the first module,
// timeline flavors the plan copy). The real onboarding is still the first
// question the plan deep-links to.
export default function OnboardingOverlay({
  onComplete,
  onSkip,
}: OnboardingOverlayProps) {
  const { track } = useAnalytics();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<RiderProfile>(DEFAULT_PROFILE);
  const [timeline, setTimeline] = useState<RidingTimeline>(DEFAULT_TIMELINE);

  const finish = (skipped: boolean) => {
    if (skipped) {
      track("onboarding_skipped", { step });
      useUIStore.getState().completeOnboarding();
      onSkip();
    } else {
      track("onboarding_profile_selected", { profile, timeline });
      track("onboarding_completed", {});
      useUIStore.getState().completeOnboarding({ profile, timeline });
      onComplete(moduleForProfile(profile));
    }
  };

  useEffect(() => {
    track("onboarding_started", {});
  }, [track]);

  const { dialogRef, trapFocus } = useModalFocus(() => finish(true));

  const targetModule = modules.find((m) => m.id === moduleForProfile(profile));
  const isLastStep = step === TOTAL_STEPS - 1;

  const pillClass = (selected: boolean) =>
    [
      "w-full text-left rounded-xl border px-4 py-3 text-sm font-display transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange",
      selected
        ? "border-orange bg-orange-light text-stone-900 font-bold"
        : "border-stone-200 text-stone-700 hover:border-stone-400",
    ].join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop - clicking it skips, same as Escape */}
      <div
        className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
        onClick={() => finish(true)}
        aria-hidden
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onKeyDown={trapFocus}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 pb-8 animate-fade-up focus-visible:outline-none"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-5" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 rounded-full transition-all duration-200",
                i === step ? "w-5 bg-orange" : "w-1.5 bg-stone-200",
              ].join(" ")}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center mb-6">
            <div className="mb-3 flex justify-center">
              <Bike size={48} className="text-orange" aria-hidden="true" />
            </div>
            <h2
              id="onboarding-title"
              className="font-display font-extrabold text-xl text-stone-900 mb-2"
            >
              Welcome to CycleDutch
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              You&apos;re dropped into real Dutch cycling moments - answer on
              instinct, and the feedback confirms or corrects your mental model.
              The question is the lesson. No account needed to start.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="mb-6">
            <h2
              id="onboarding-title"
              className="font-display font-extrabold text-xl text-stone-900 mb-4 text-center"
            >
              What brings you to Dutch cycling?
            </h2>
            <div className="flex flex-col gap-2">
              {RIDER_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfile(p.id)}
                  aria-pressed={profile === p.id}
                  className={pillClass(profile === p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mb-6">
            <h2
              id="onboarding-title"
              className="font-display font-extrabold text-xl text-stone-900 mb-4 text-center"
            >
              When do you start riding?
            </h2>
            <div className="flex flex-col gap-2">
              {RIDING_TIMELINES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeline(t.id)}
                  aria-pressed={timeline === t.id}
                  className={pillClass(timeline === t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center mb-6">
            <p className="font-mono text-xs uppercase tracking-wide text-orange mb-2">
              Your plan
            </p>
            <h2
              id="onboarding-title"
              className="font-display font-extrabold text-lg text-stone-900 mb-3 leading-snug"
            >
              {planLine(profile, timeline)}
            </h2>
            <p className="text-stone-600 text-sm">
              {targetModule?.alwaysFree
                ? "The essentials, all free. No account needed."
                : "3 free questions, no account needed."}
            </p>
          </div>
        )}

        {/* Primary CTA */}
        {isLastStep ? (
          <Button variant="primary" size="lg" full onClick={() => finish(false)}>
            <span>Start with {targetModule?.title}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => setStep((s) => s + 1)}
          >
            <span>{step === 0 ? "Get started" : "Continue"}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        )}

        {/* Back + Skip row */}
        <div className="flex items-center justify-between mt-3">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back</span>
            </Button>
          ) : (
            <span />
          )}
          <Button variant="ghost" size="sm" onClick={() => finish(true)}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass + typecheck**

Run: `npx vitest run tests/components/OnboardingOverlay.test.tsx && npm run typecheck`
Expected: PASS. `types/index.ts` will report a type error at the two caller sites (`LandingButton`, `OnboardingGate`) because they still pass `ctaLabel` and a no-arg `onComplete` — that is fixed in Task 4. If `npm run typecheck` fails **only** on those two files, that is expected; proceed. (The vitest run itself passes because those callers aren't imported by this test.)

- [ ] **Step 5: Commit**

```bash
git add components/layout/OnboardingOverlay.tsx tests/components/OnboardingOverlay.test.tsx
git commit -m "feat: onboarding overlay becomes a 4-step investment wizard"
```

---

### Task 4: Wire the callers to the wizard

**Files:**
- Modify: `components/layout/LandingButton.tsx`
- Modify: `components/layout/OnboardingGate.tsx`
- Test: `tests/components/OnboardingGate.test.tsx`

- [ ] **Step 1: Update the OnboardingGate test**

Replace the entire contents of `tests/components/OnboardingGate.test.tsx`:

```tsx
const { push, getPathname } = vi.hoisted(() => ({
  push: vi.fn(),
  getPathname: vi.fn(() => "/learn"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => getPathname(),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingGate from "@/components/layout/OnboardingGate";
import { useUIStore } from "@/stores/uiStore";

async function completeWizard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /get started/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await user.click(
    screen.getByRole("button", { name: /start with fundamentals/i }),
  );
}

describe("OnboardingGate", () => {
  beforeEach(() => {
    push.mockReset();
    getPathname.mockReturnValue("/learn");
    localStorage.clear();
    useUIStore.setState({
      onboardingDone: false,
      riderProfile: null,
      ridingTimeline: null,
    });
  });

  it("shows the overlay on a first visit to /learn", async () => {
    render(<OnboardingGate />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("shows nothing when onboarding was already completed", () => {
    localStorage.setItem("onboarding_done", "true");
    render(<OnboardingGate />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deep-links to the mapped module on complete (default -> fundamentals)", async () => {
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await completeWizard(user);
    expect(push).toHaveBeenCalledWith("/learn/fundamentals");
  });

  it("navigates to the mapped module even when opened inside another module", async () => {
    getPathname.mockReturnValue("/learn/legal");
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await completeWizard(user);
    expect(push).toHaveBeenCalledWith("/learn/fundamentals");
  });

  it("closes without navigating on skip", async () => {
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await user.click(await screen.findByRole("button", { name: /^skip$/i }));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/components/OnboardingGate.test.tsx`
Expected: FAIL — the gate still renders the old single-CTA overlay / branches on `onLearnIndex`.

- [ ] **Step 3: Update `components/layout/OnboardingGate.tsx`**

Replace the whole file:

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import OnboardingOverlay from "@/components/layout/OnboardingOverlay";
import { useUIStore } from "@/stores/uiStore";
import { isOnboardingDone } from "@/lib/onboarding";

// Storage never changes behind our back within a session (completion goes
// through the uiStore flag), so no subscription is needed.
const subscribeNoop = () => () => {};

// Shows onboarding on the first visit to any /learn page - visitors arriving
// via the guide or a shared link never pass the landing CTA. The server
// snapshot reads "done" so SSR renders nothing and hydration stays stable.
// Completing the wizard always deep-links to the module its plan recommends.
export default function OnboardingGate() {
  const router = useRouter();
  const onboardingDone = useUIStore((s) => s.onboardingDone);
  const storageDone = useSyncExternalStore(
    subscribeNoop,
    isOnboardingDone,
    () => true,
  );

  if (storageDone || onboardingDone) return null;

  return (
    <OnboardingOverlay
      onComplete={(moduleId) => router.push(`/learn/${moduleId}`)}
      onSkip={() => {}}
    />
  );
}
```

- [ ] **Step 4: Update `components/layout/LandingButton.tsx`**

Replace the `{showOnboarding && (...)}` block (near the end of the JSX) with:

```tsx
      {showOnboarding && (
        <OnboardingOverlay
          onComplete={(moduleId) => router.push(`/learn/${moduleId}`)}
          onSkip={() => {
            // They still clicked "Start learning" - take them to the index
            setShowOnboarding(false)
            router.push('/learn')
          }}
        />
      )}
```

(Only the `ctaLabel` prop and the no-arg `onComplete` change; everything else in the file stays.)

- [ ] **Step 5: Run to verify pass + typecheck**

Run: `npx vitest run tests/components/OnboardingGate.test.tsx && npm run typecheck`
Expected: PASS, no type errors (the Task 3 caller type errors are now resolved).

- [ ] **Step 6: Commit**

```bash
git add components/layout/OnboardingGate.tsx components/layout/LandingButton.tsx tests/components/OnboardingGate.test.tsx
git commit -m "feat: route onboarding callers through the wizard's chosen module"
```

---

### Task 5: Full verification

- [ ] **Step 1: Full suite + typecheck + lint + build**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run build`
Expected: all green (lint may show the one pre-existing `react-hooks/exhaustive-deps` warning in `app/learn/[moduleId]/page.tsx` — unrelated). If `test:run` reports "no tests / all files failed", re-run once (known Windows worker-pool flake) before investigating.

- [ ] **Step 2: Manual smoke (optional, if a dev server is run)**

`npm run dev`, then in a fresh browser profile (or clear localStorage): the landing "Start learning" CTA opens the 4-step wizard; defaults let you click straight through to Fundamentals; picking "Commute daily" changes the final CTA to "Start with Priority Rules" and lands there; the final step's skip reads "No thanks, I'll wing it"; reloading `/learn` does not show the wizard again; `localStorage.rider_profile` / `riding_timeline` are set.

- [ ] **Step 3: Report the verification output.**

---

## Self-Review Notes

- **Spec coverage:** 4 screens (Task 3); situation→module map + copy map + defaults (Task 1); persistence keys + guarded helpers (Task 2); `uiStore` choices (Task 2); flow unification / dropped `onLearnIndex` + `ctaLabel` (Task 4); analytics `onboarding_profile_selected` + `onboarding_skipped {step}` (Tasks 1, 3); uniform plain "Skip" on every step (Task 3); step dots (Task 3). All covered.
- **Type consistency:** `onComplete: (moduleId: ModuleId) => void`, `completeOnboarding(choices?: { profile; timeline })`, `moduleForProfile`, `planLine`, `RiderProfile`/`RidingTimeline`, keys `rider_profile`/`riding_timeline` used consistently across tasks.
- **Cross-task typecheck:** Task 3 intentionally leaves the two callers type-broken; Task 4 fixes them. The Task 3 step notes this so an engineer running tasks in order isn't alarmed. Anyone running out of order should do Task 4 alongside Task 3.
- **Out of scope (per spec):** confidence step, difficulty-adaptive serving, consuming `ridingTimeline` in later nudges, re-onboarding returning users.
