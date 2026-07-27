# CI/CD Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions CI workflow (lint, typecheck, test, build) that runs on every push/PR to `main`, with all prerequisite lint errors fixed so it's green from the first run.

**Architecture:** Fix the 7 existing `eslint .` errors first (one task each), add a `typecheck` script, run a full local verification pass, then add `.github/workflows/ci.yml` and confirm a green run on GitHub.

**Tech Stack:** Next.js 16, TypeScript, ESLint 9 (`eslint-config-next` flat config), Vitest, GitHub Actions.

---

### Task 1: Add `typecheck` npm script

**Files:**

- Modify: `package.json:9` (scripts block)

- [ ] **Step 1: Add the script**

In `package.json`, the `scripts` block currently reads:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest",
    "test:run": "vitest run"
  },
```

Add `typecheck` after `lint`:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  },
```

- [ ] **Step 2: Run it to verify it passes**

Run: `npm run typecheck`
Expected: command exits with no output and exit code 0 (no type errors).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add typecheck script"
```

---

### Task 2: Fix `@next/next/no-html-link-for-pages` in error boundaries

**Files:**

- Modify: `app/error.tsx`
- Modify: `app/global-error.tsx`

- [ ] **Step 1: Update `app/error.tsx`**

Add the `Link` import and replace the `<a>` tag. The full file becomes:

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <p className="text-4xl mb-4">🚲</p>
      <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-stone-500 mb-8 max-w-sm">
        An unexpected error occurred. Your progress is safe.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/learn"
          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 transition-colors"
        >
          Back to modules
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/global-error.tsx`**

Same change - add the `Link` import and replace the `<a>` tag. The full file becomes:

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-50 px-6 text-center">
          <p className="text-4xl mb-4">🚲</p>
          <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-stone-500 mb-8 max-w-sm">
            An unexpected error occurred. Your progress is safe.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/learn"
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 transition-colors"
            >
              Back to modules
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the lint errors are gone**

Run: `npx eslint app/error.tsx app/global-error.tsx`
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add app/error.tsx app/global-error.tsx
git commit -m "fix: use next/link in error boundary back-to-modules links"
```

---

### Task 3: Fix `react-hooks/set-state-in-effect` in `LessonAccordion`

**Files:**

- Modify: `components/questions/LessonAccordion.tsx`

- [ ] **Step 1: Replace the reset effect with render-time state adjustment**

Current top of the file:

```tsx
'use client'

import { useState, useEffect } from 'react'
import type { Difficulty, Question } from '@/types'
import lessonsData from '@/data/lessons.json'
import { useAnalytics } from '@/hooks/useAnalytics'

interface LessonAccordionProps {
  skill:      string
  difficulty: Difficulty
  question:   Question
}

export default function LessonAccordion({ skill, difficulty, question }: LessonAccordionProps) {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  // Reset to closed on each new question
  useEffect(() => {
    setOpen(false)
  }, [skill, difficulty])

  const lesson = (lessonsData.lessons as Record<string, Record<Difficulty, { title: string; body: string }>>)[skill]?.[difficulty]
```

Replace with:

```tsx
'use client'

import { useState } from 'react'
import type { Difficulty, Question } from '@/types'
import lessonsData from '@/data/lessons.json'
import { useAnalytics } from '@/hooks/useAnalytics'

interface LessonAccordionProps {
  skill:      string
  difficulty: Difficulty
  question:   Question
}

export default function LessonAccordion({ skill, difficulty, question }: LessonAccordionProps) {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  // Reset to closed when the question changes
  const resetKey = `${skill}-${difficulty}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setOpen(false)
  }

  const lesson = (lessonsData.lessons as Record<string, Record<Difficulty, { title: string; body: string }>>)[skill]?.[difficulty]
```

The rest of the file (from `if (!lesson) return null` onward) is unchanged.

- [ ] **Step 2: Verify the lint error is gone**

Run: `npx eslint components/questions/LessonAccordion.tsx`
Expected: no output, exit code 0.

- [ ] **Step 3: Run the test suite**

Run: `npm run test:run`
Expected: `Test Files  13 passed (13)`, `Tests  152 passed (152)`.

- [ ] **Step 4: Commit**

```bash
git add components/questions/LessonAccordion.tsx
git commit -m "fix: reset LessonAccordion open state during render, not in effect"
```

---

### Task 4: Fix `react-hooks/set-state-in-effect` in `OptionButton`

**Files:**

- Modify: `components/questions/OptionButton.tsx`

- [ ] **Step 1: Replace the ref+effect with render-time state adjustment**

Current top of the file:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Option } from '@/types'

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'unselected-after-answer'

interface OptionButtonProps {
  option:   Option
  state:    OptionState
  onClick:  () => void
  disabled: boolean
}

const stateClasses: Record<OptionState, string> = {
  'idle':                    'bg-white border-stone-200 text-stone-900 hover:border-stone-400',
  'selected':                'bg-orange-light border-orange text-stone-900',
  'correct':                 'bg-green-light border-green text-green-dark',
  'incorrect':               'bg-red-light border-red text-red-dark',
  'unselected-after-answer': 'bg-white border-stone-200 text-stone-400',
}

const stateHasIndicator = new Set<OptionState>(['correct', 'incorrect'])

export default function OptionButton({ option, state, onClick, disabled }: OptionButtonProps) {
  const prevState = useRef<OptionState>(state)
  const [burst, setBurst] = useState<'pop' | 'shake' | null>(null)

  useEffect(() => {
    const prev = prevState.current
    if (prev !== 'correct' && state === 'correct') setBurst('pop')
    if (prev !== 'incorrect' && state === 'incorrect') setBurst('shake')
    prevState.current = state
  }, [state])
```

Replace with:

```tsx
'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Option } from '@/types'

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'unselected-after-answer'

interface OptionButtonProps {
  option:   Option
  state:    OptionState
  onClick:  () => void
  disabled: boolean
}

const stateClasses: Record<OptionState, string> = {
  'idle':                    'bg-white border-stone-200 text-stone-900 hover:border-stone-400',
  'selected':                'bg-orange-light border-orange text-stone-900',
  'correct':                 'bg-green-light border-green text-green-dark',
  'incorrect':               'bg-red-light border-red text-red-dark',
  'unselected-after-answer': 'bg-white border-stone-200 text-stone-400',
}

const stateHasIndicator = new Set<OptionState>(['correct', 'incorrect'])

export default function OptionButton({ option, state, onClick, disabled }: OptionButtonProps) {
  const [burst, setBurst] = useState<'pop' | 'shake' | null>(null)
  const [prevState, setPrevState] = useState<OptionState>(state)

  if (state !== prevState) {
    if (prevState !== 'correct' && state === 'correct') setBurst('pop')
    if (prevState !== 'incorrect' && state === 'incorrect') setBurst('shake')
    setPrevState(state)
  }
```

The rest of the file (from `return (` onward) is unchanged.

- [ ] **Step 2: Verify the lint error is gone**

Run: `npx eslint components/questions/OptionButton.tsx`
Expected: no output, exit code 0.

- [ ] **Step 3: Run the test suite**

Run: `npm run test:run`
Expected: `Test Files  13 passed (13)`, `Tests  152 passed (152)`.

- [ ] **Step 4: Commit**

```bash
git add components/questions/OptionButton.tsx
git commit -m "fix: compute OptionButton burst animation during render, not in effect"
```

---

### Task 5: Fix `react-hooks/set-state-in-effect` in `MasteryDot`

**Files:**

- Modify: `components/ui/MasteryDot.tsx`

- [ ] **Step 1: Replace the ref+effect with render-time state adjustment**

Current file:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { DotState } from "@/types";

interface MasteryDotProps {
  state: DotState;
}

const stateClasses: Record<DotState, string> = {
  unseen: "bg-stone-200",
  seen: "bg-orange",
  correct: "bg-green",
  active: "bg-orange ring-2 ring-orange ring-offset-1",
  locked: "bg-stone-300",
};

export default function MasteryDot({ state }: MasteryDotProps) {
  const prevState = useRef<DotState>(state);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    if (prevState.current !== "correct" && state === "correct") {
      setPopping(true);
    }
    prevState.current = state;
  }, [state]);

  return (
    <div
      className={[
        "w-2.5 h-2.5 rounded-full transition-colors duration-200",
        stateClasses[state],
        popping ? "animate-pop" : "",
      ].join(" ")}
      onAnimationEnd={() => setPopping(false)}
    />
  );
}
```

Replace with:

```tsx
"use client";

import { useState } from "react";
import type { DotState } from "@/types";

interface MasteryDotProps {
  state: DotState;
}

const stateClasses: Record<DotState, string> = {
  unseen: "bg-stone-200",
  seen: "bg-orange",
  correct: "bg-green",
  active: "bg-orange ring-2 ring-orange ring-offset-1",
  locked: "bg-stone-300",
};

export default function MasteryDot({ state }: MasteryDotProps) {
  const [popping, setPopping] = useState(false);
  const [prevState, setPrevState] = useState<DotState>(state);

  if (state !== prevState) {
    if (prevState !== "correct" && state === "correct") {
      setPopping(true);
    }
    setPrevState(state);
  }

  return (
    <div
      className={[
        "w-2.5 h-2.5 rounded-full transition-colors duration-200",
        stateClasses[state],
        popping ? "animate-pop" : "",
      ].join(" ")}
      onAnimationEnd={() => setPopping(false)}
    />
  );
}
```

- [ ] **Step 2: Verify the lint error is gone**

Run: `npx eslint components/ui/MasteryDot.tsx`
Expected: no output, exit code 0.

- [ ] **Step 3: Run the test suite**

Run: `npm run test:run`
Expected: `Test Files  13 passed (13)`, `Tests  152 passed (152)`.

- [ ] **Step 4: Commit**

```bash
git add components/ui/MasteryDot.tsx
git commit -m "fix: compute MasteryDot pop animation during render, not in effect"
```

---

### Task 6: Fix `@typescript-eslint/no-explicit-any` in `DotMap.test.tsx`

**Files:**

- Modify: `tests/components/DotMap.test.tsx:4-16`

- [ ] **Step 1: Type `moduleId` as `ModuleId` instead of casting**

Current (lines 4-16):

```tsx
import DotMap from '@/components/modules/DotMap'
import { useAppStore } from '@/stores/appStore'
import type { Question, LocalProgress } from '@/types'
import { FREE_PER_MODULE } from '@/types'

function resetStore() {
  useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false })
}

function makeQuestions(count: number, moduleId = 'priority'): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    module: moduleId as any,
    skill: 'Test',
```

Replace with:

```tsx
import DotMap from '@/components/modules/DotMap'
import { useAppStore } from '@/stores/appStore'
import type { ModuleId, Question, LocalProgress } from '@/types'
import { FREE_PER_MODULE } from '@/types'

function resetStore() {
  useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false })
}

function makeQuestions(count: number, moduleId: ModuleId = 'priority'): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    module: moduleId,
    skill: 'Test',
```

The rest of the file is unchanged.

- [ ] **Step 2: Verify the lint error is gone**

Run: `npx eslint tests/components/DotMap.test.tsx`
Expected: no output, exit code 0.

- [ ] **Step 3: Run this test file**

Run: `npx vitest run tests/components/DotMap.test.tsx`
Expected: all tests in this file pass.

- [ ] **Step 4: Commit**

```bash
git add tests/components/DotMap.test.tsx
git commit -m "fix: type DotMap test moduleId as ModuleId instead of any"
```

---

### Task 7: Fix `@typescript-eslint/no-explicit-any` in `questions.test.ts`

**Files:**

- Modify: `tests/data/questions.test.ts:57`

- [ ] **Step 1: Replace the `any` cast**

Current (line 57):

```ts
expect(
  (q.feedback as any).title,
  `${q.id} still has deprecated feedback.title`,
).toBeUndefined();
```

Replace with:

```ts
expect(
  (q.feedback as Record<string, unknown>).title,
  `${q.id} still has deprecated feedback.title`,
).toBeUndefined();
```

- [ ] **Step 2: Verify the lint error is gone**

Run: `npx eslint tests/data/questions.test.ts`
Expected: no output, exit code 0.

- [ ] **Step 3: Run this test file**

Run: `npx vitest run tests/data/questions.test.ts`
Expected: all tests in this file pass.

- [ ] **Step 4: Commit**

```bash
git add tests/data/questions.test.ts
git commit -m "fix: avoid any in questions.test feedback.title check"
```

---

### Task 8: Fix `@typescript-eslint/no-explicit-any` in `appStore.test.ts`

**Files:**

- Modify: `tests/stores/appStore.test.ts:1`, `:99`

- [ ] **Step 1: Add the `User` type import**

Current (line 1):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
```

Replace with:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
```

- [ ] **Step 2: Replace the `any` cast**

Current (line 100, after the import is added it shifts down by one - search for this exact line):

```ts
const fakeUser = { id: "u1", email: "test@example.com" } as any;
```

Replace with:

```ts
const fakeUser = { id: "u1", email: "test@example.com" } as unknown as User;
```

- [ ] **Step 3: Verify the lint error is gone**

Run: `npx eslint tests/stores/appStore.test.ts`
Expected: no output, exit code 0.

- [ ] **Step 4: Run this test file**

Run: `npx vitest run tests/stores/appStore.test.ts`
Expected: all tests in this file pass.

- [ ] **Step 5: Commit**

```bash
git add tests/stores/appStore.test.ts
git commit -m "fix: avoid any in appStore test fake user"
```

---

### Task 9: Full local verification

**Files:** none (verification only)

- [ ] **Step 1: Lint the whole project**

Run: `npm run lint`
Expected: `✖ 11 problems (0 errors, 11 warnings)` - 0 errors. (The 11 pre-existing warnings, e.g. `useAuth.ts:153` missing `track` dependency, are out of scope and expected to remain.)

- [ ] **Step 2: Typecheck the whole project**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Run the full test suite**

Run: `npm run test:run`
Expected: `Test Files  13 passed (13)`, `Tests  152 passed (152)`.

- [ ] **Step 4: Build with placeholder env vars (same values CI will use)**

Run (PowerShell):

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="placeholder"
$env:SUPABASE_SECRET_KEY="placeholder"
$env:NEXT_PUBLIC_SUPABASE_REDIRECT_URL="http://localhost:3000"
npm run build
```

Expected: build completes with `✓ Compiled successfully` and the route table printed, no errors.

No commit for this task - it's a checkpoint before adding the workflow.

---

### Task 10: Add the GitHub Actions CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - run: npm run lint

      - run: npm run typecheck

      - run: npm run test:run

      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: placeholder
          SUPABASE_SECRET_KEY: placeholder
          NEXT_PUBLIC_SUPABASE_REDIRECT_URL: http://localhost:3000
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, typecheck, test, build"
```

- [ ] **Step 3: Push and verify a green run**

Run: `git push`

Then check the run with the GitHub CLI:

Run: `gh run list --branch main --limit 1`
Expected: a row showing the just-pushed commit with status `completed` and conclusion `success` (may need to re-run after a minute if it's still `in_progress`).

If it fails, run `gh run view --log-failed` to see which step failed and why.

---

## Self-Review Notes

- **Spec coverage:** All 7 lint-error fixes (Task 2-8), `typecheck` script (Task 1), full local verification (Task 9), and the CI workflow with placeholder build env vars (Task 10) are covered. Branch protection and E2E tests were explicitly out of scope per the spec.
- **Type consistency:** `ModuleId`, `Question`, `Feedback`, `User`, `OptionState`, `DotState` all match their definitions in `types/index.ts` / `@supabase/supabase-js` as read from the current codebase.
- **Placeholder scan:** no TBD/TODO; every step shows full before/after code or exact commands with expected output.
