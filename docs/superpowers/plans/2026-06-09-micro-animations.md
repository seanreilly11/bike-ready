# Micro Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tasteful micro animations across BikeReady to improve perceived polish — answer reveals, state pops, hover lifts, staggered entrances, and smooth accordion transitions.

**Architecture:** All animations are CSS-driven via Tailwind utility classes and custom keyframes in `globals.css`. Animation state (pop/shake triggers) is handled with `useRef` + `useState` where components need to detect prop transitions. No external animation libraries needed.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 (`@import "tailwindcss"` with `@theme` block in `globals.css`), React hooks

---

### Task 1: Add keyframes and reduced-motion rule to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add `shake` keyframe and `animate-shake` theme variable**

In `app/globals.css`, inside the `@theme` block, add after the existing `--animate-pop` line:

```css
--animate-shake: shake 0.3s ease-out both;

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-3px); }
  40%      { transform: translateX(3px); }
  60%      { transform: translateX(-2px); }
  80%      { transform: translateX(2px); }
}
```

- [ ] **Step 2: Add `prefers-reduced-motion` rule**

After the closing `}` of the `@theme` block, add:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add shake keyframe and prefers-reduced-motion rule"
```

---

### Task 2: OptionButton — animate correct pop and incorrect shake on reveal

**Files:**
- Modify: `components/questions/OptionButton.tsx`

The component currently receives `state` as a prop. We need to detect when `state` transitions to `correct` or `incorrect` and apply the matching animation class for one render cycle.

- [ ] **Step 1: Add imports and animation state tracking**

Replace the entire file with:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
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

const stateIndicator: Partial<Record<OptionState, string>> = {
  correct:   '✓',
  incorrect: '✗',
}

export default function OptionButton({ option, state, onClick, disabled }: OptionButtonProps) {
  const prevState = useRef<OptionState>(state)
  const [burst, setBurst] = useState<'pop' | 'shake' | null>(null)

  useEffect(() => {
    const prev = prevState.current
    if (prev !== 'correct' && state === 'correct') setBurst('pop')
    if (prev !== 'incorrect' && state === 'incorrect') setBurst('shake')
    prevState.current = state
  }, [state])

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      onAnimationEnd={() => setBurst(null)}
      className={[
        'w-full flex items-center gap-3 rounded-xl border px-4 py-3 min-h-[44px]',
        'text-left font-display text-base leading-relaxed',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        disabled ? 'cursor-default' : 'cursor-pointer',
        stateClasses[state],
        burst === 'pop'   ? 'animate-pop'   : '',
        burst === 'shake' ? 'animate-shake' : '',
      ].join(' ')}
    >
      <span className="font-mono text-xs uppercase tracking-wide text-stone-400 shrink-0 w-4">
        {option.id}
      </span>
      <span className="flex-1">{option.label}</span>
      {stateIndicator[state] && (
        <span className={[
          'shrink-0 font-bold',
          state === 'correct'   ? 'text-green-dark' : '',
          state === 'incorrect' ? 'text-red-dark'   : '',
        ].join(' ')}>
          {stateIndicator[state]}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Verify visually**

Start dev server (`npm run dev`), open a module, answer a question correctly — the correct option should pop. Answer incorrectly — the selected option should shake.

- [ ] **Step 3: Commit**

```bash
git add components/questions/OptionButton.tsx
git commit -m "feat: animate option button on correct/incorrect reveal"
```

---

### Task 3: MasteryDot — pop when transitioning to correct

**Files:**
- Modify: `components/ui/MasteryDot.tsx`

Currently a server component (no `'use client'`). Must convert to client component to use `useRef`.

- [ ] **Step 1: Rewrite MasteryDot with transition detection**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { DotState } from '@/types'

interface MasteryDotProps {
  state: DotState
}

const stateClasses: Record<DotState, string> = {
  unseen:  'bg-stone-200',
  seen:    'bg-orange',
  correct: 'bg-green',
  active:  'bg-orange ring-2 ring-orange ring-offset-1',
  locked:  'bg-stone-300',
}

export default function MasteryDot({ state }: MasteryDotProps) {
  const prevState = useRef<DotState>(state)
  const [popping, setPopping] = useState(false)

  useEffect(() => {
    if (prevState.current !== 'correct' && state === 'correct') {
      setPopping(true)
    }
    prevState.current = state
  }, [state])

  return (
    <div
      className={[
        'w-2.5 h-2.5 rounded-full transition-colors duration-200',
        stateClasses[state],
        popping ? 'animate-pop' : '',
      ].join(' ')}
      onAnimationEnd={() => setPopping(false)}
    />
  )
}
```

- [ ] **Step 2: Verify visually**

Answer a question correctly. The mastery dot for that question in the module card should pop green.

- [ ] **Step 3: Commit**

```bash
git add components/ui/MasteryDot.tsx
git commit -m "feat: pop mastery dot when transitioning to correct state"
```

---

### Task 4: ModuleCard — subtle hover lift

**Files:**
- Modify: `components/modules/ModuleCard.tsx`

One-line change. The existing className string already has `transition-all duration-200`.

- [ ] **Step 1: Add hover lift**

In `components/modules/ModuleCard.tsx`, find the className array on the `<button>` element (around line 63). Add `hover:-translate-y-0.5` to the array:

```tsx
className={[
  "w-full text-left border border-stone-200 rounded-xl p-4 cursor-pointer",
  "hover:border-stone-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
  "active:scale-[0.99]",
].join(" ")}
```

- [ ] **Step 2: Commit**

```bash
git add components/modules/ModuleCard.tsx
git commit -m "feat: add subtle hover lift to module card"
```

---

### Task 5: LessonAccordion — smooth height transition on open/close

**Files:**
- Modify: `components/questions/LessonAccordion.tsx`

Replace the conditional render (`{open && <div ...>}`) with a CSS grid trick. The element stays mounted; `grid-template-rows` animates from `0fr` to `1fr`. This is more reliable than `max-height` because it doesn't require guessing a max value.

- [ ] **Step 1: Replace conditional render with animated wrapper**

Find the `{open && (` block at the bottom of the component (lines 58–62). Replace that entire block with:

```tsx
<div
  className="grid transition-[grid-template-rows] duration-200 ease-out"
  style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
>
  <div className="overflow-hidden">
    <div className="mt-1.5 bg-orange-light border border-orange-mid rounded-xl px-4 py-3">
      <p className="text-base text-stone-700 leading-relaxed">{lesson.body}</p>
    </div>
  </div>
</div>
```

Note: remove the `animate-fade-up` that was on the old conditional div — it conflicts with always-mounted approach.

- [ ] **Step 2: Verify visually**

Open a question with a lesson. Click the accordion toggle — content should slide open and closed smoothly rather than snapping.

- [ ] **Step 3: Commit**

```bash
git add components/questions/LessonAccordion.tsx
git commit -m "feat: smooth height transition on lesson accordion open/close"
```

---

### Task 6: Nav review dot — pulse animation

**Files:**
- Modify: `components/layout/Nav.tsx`

The red dot renders conditionally when `wrongCount > 0` (line 82).

- [ ] **Step 1: Add animate-pulse to the review dot**

Find the `<span>` that renders the red dot (around line 82):

```tsx
{item.label === "Review" && wrongCount > 0 && (
  <span
    className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-red animate-pulse"
    aria-label={`${wrongCount} questions to review`}
  />
)}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Nav.tsx
git commit -m "feat: pulse animation on review badge dot"
```

---

### Task 7: FeedbackPanel — staggered reveal of Rule and Tip sections

**Files:**
- Modify: `components/questions/FeedbackPanel.tsx`

The Rule and Tip `<div>` blocks are inside a `border-t` wrapper. Add `animate-fade-up` with increasing `animationDelay` inline styles.

- [ ] **Step 1: Add staggered delays to Rule and Tip sections**

Find the `<div className="border-t border-current/10 pt-3 space-y-2">` block and its two child divs. Replace that whole block with:

```tsx
<div className="border-t border-current/10 pt-3 space-y-2">
  <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
    <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-0.5">
      Rule
    </span>
    <p className="text-sm text-stone-600 leading-relaxed">{feedback.rule}</p>
  </div>
  <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
    <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-0.5">
      Tip
    </span>
    <p className="text-sm text-stone-600 leading-relaxed">{feedback.tip}</p>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add components/questions/FeedbackPanel.tsx
git commit -m "feat: staggered reveal of rule and tip in feedback panel"
```

---

### Task 8: Learn page — staggered module card entrance

**Files:**
- Modify: `app/learn/page.tsx`

The module cards are rendered in a grid. Wrap each card in an `animate-fade-up` div with increasing `animationDelay`.

- [ ] **Step 1: Wrap each ModuleCard with a staggered delay**

Find the module cards grid (around line 162):

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
  {modules.map((mod, i) => (
    <div key={mod.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
      <ModuleCard
        module={mod}
        onClick={() => router.push(`/learn/${mod.id}`)}
      />
    </div>
  ))}
</div>
```

Note: remove the `key={mod.id}` from the inner `ModuleCard` — it now belongs on the outer `div`.

- [ ] **Step 2: Verify visually**

Navigate to `/learn`. Cards should fade up one by one in quick succession (0ms, 60ms, 120ms... up to ~300ms for 6 cards).

- [ ] **Step 3: Commit**

```bash
git add app/learn/page.tsx
git commit -m "feat: staggered fade-up entrance for module cards on learn page"
```

---

### Task 9: OnboardingOverlay — fade transition between steps

**Files:**
- Modify: `components/layout/OnboardingOverlay.tsx`

Add `key={step}` to the content `<div>` (emoji + title + body). React will unmount and remount it on step change, re-triggering `animate-fade-up`.

- [ ] **Step 1: Key the content div on step**

Find the `<div className="text-center mb-6">` block (around line 56). Add `key={step}` to it:

```tsx
<div key={step} className="text-center mb-6 animate-fade-up">
  <div className="text-5xl mb-3">{screen.emoji}</div>
  <h2 className="font-display font-extrabold text-xl text-stone-900 mb-2">
    {screen.title}
  </h2>
  <p className="text-stone-600 text-sm leading-relaxed">{screen.body}</p>
</div>
```

Note: `animate-fade-up` is already on the outer card div. Add it here specifically on the content div so only the text content re-animates on step change, not the whole card.

- [ ] **Step 2: Verify visually**

Trigger the onboarding overlay (clear `bikeready_onboarding_done` from localStorage, reload). Click Next — the emoji/title/body should fade up on each step transition.

- [ ] **Step 3: Commit**

```bash
git add components/layout/OnboardingOverlay.tsx
git commit -m "feat: fade transition between onboarding steps"
```
