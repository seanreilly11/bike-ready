# Badge Mastery — Spec & Implementation Prompt

## Overview

Badges currently have two states: not earned (locked) and earned (seen all questions in a module). This adds a third state — mastered — for when a user has answered every question in a module correctly at least once.

The completion badge is kept as "seen all" — it rewards engagement and finishing the module. Mastery is a separate visual upgrade on top of the earned badge, not a replacement for it.

---

## Three badge states

| State | Trigger | Visual |
|---|---|---|
| Not earned | Module not fully seen | Greyed out, locked emoji, 0.4 opacity |
| Earned (seen all) | Every question in module has been seen | Green ring (`#4ade80`), full opacity |
| Mastered (all correct) | Every question in module has `correct: true` in progress | Gold/amber ring (`#f5a623`), faint gold background tint, gold star pip in bottom-right corner |

Mastered is a superset of earned — a mastered badge is also an earned badge. The star pip is the distinguishing mark.

---

## Visual specification

### Badge circle

**Not earned:**
- Background: `stone-100` (`#F4F2EE`)
- Border: `1px solid stone-200` (`#E8E4DC`)
- Emoji: locked padlock 🔒
- Opacity: 0.4
- Filter: none (emoji does the visual work)

**Earned:**
- Background: `stone-100`
- Border: `2.5px solid #4ade80`
- Emoji: module emoji (🚲 ⚡ 🪧 etc.)
- Opacity: 1.0

**Mastered:**
- Background: `#fffbea` (very faint amber tint)
- Border: `2.5px solid #f5a623`
- Emoji: module emoji
- Opacity: 1.0
- Plus gold star pip (see below)

### Star pip

Sits in the bottom-right corner of the badge circle. It is a circle with a white star SVG inside, overlapping the badge edge slightly.

```
position: absolute
bottom: -2px
right: -2px
border: 2px solid [page background colour — white in light mode]
background: #f5a623
border-radius: 50%
display: flex
align-items: center
justify-content: center
```

The star is an inline SVG polygon, white fill, no stroke:
```svg
<svg viewBox="0 0 10 10" fill="white">
  <polygon points="5,1 6.2,3.8 9.5,4.1 7.1,6.2 7.9,9.5 5,7.8 2.1,9.5 2.9,6.2 0.5,4.1 3.8,3.8"/>
</svg>
```

**Pip sizes at each badge size:**

| Badge size | Pip size | SVG size |
|---|---|---|
| 72px (badge grid) | 22×22px | 11×11px |
| 56px (default) | 18×18px | 9×9px |
| 36px (badge toast) | 14×14px | 7×7px |

The badge wrapper must be `position: relative` for the absolute pip to anchor correctly.

### Module card — three states

**Not started:**
- Left border: `1px solid stone-200` (default, no accent)
- Background: white
- Dots: all stone-200 (unseen)
- Status badge: "Not started" (stone background)

**Complete (seen all):**
- Left border: `3px solid #4ade80`
- Background: white
- Dots: green for seen (#4ade80), orange for seen-but-wrong (#E8500A)
- Status badge: "Complete" (green background)

**Mastered (all correct):**
- Left border: `3px solid #f5a623`
- Background: `#fffdf0` (very faint gold tint)
- Dots: all gold (#f5a623) — every dot turns gold when mastered
- Status badge: "Mastered" with a small inline star SVG, amber background (`#fef3c7`), amber-dark text (`#92400e`)

The "Mastered" status badge:

```
background: #fef3c7
color: #92400e
font-family: monospace
font-size: 9px
padding: 2px 7px
border-radius: 99px
text-transform: uppercase
letter-spacing: 0.05em
display: inline-flex
align-items: center
gap: 4px
```

With a 9×9px inline star SVG (fill `#92400e`) before the text.

---

## Logic

### isMastered(moduleId, progress, questions)

A module is mastered when every active question in that module has `correct: true` in the progress object.

```ts
function isMastered(
  moduleId: string,
  progress: Record<string, { seen: boolean; correct: boolean }>,
  questions: Question[]
): boolean {
  const moduleQuestions = questions.filter(
    q => q.module === moduleId && q.status === 'active'
  )
  if (moduleQuestions.length === 0) return false
  return moduleQuestions.every(q => progress[q.id]?.correct === true)
}
```

This is derived — it does not need to be stored anywhere. Compute it inline wherever needed. It will naturally become true as the user answers correctly in Review.

### Badge earning — no change to existing trigger

Badges are still earned on "seen all" — the existing trigger is unchanged:

```ts
const allSeen = moduleQuestions.every(q => progress[q.id]?.seen === true)
if (allSeen && !earned.includes(module.badgeId)) {
  earnBadge(module.badgeId)
}
```

The mastered state is purely visual — it does not fire a new badge award or a new toast. It is computed at render time from progress. No new entries in the `earned` array. No new database writes.

### Toast notification — no change

When a module badge is earned (seen all), the existing toast fires. There is no separate mastery toast. The visual upgrade to the mastered state happens silently as the user fixes their last wrong answer in Review — the badge ring and module card simply update.

---

## Data model — no changes

No new fields in `profiles`, `badges`, or `question_progress`. Mastery is a derived display state, not a stored state. The `badges` table records only which badges have been earned. The mastered visual is derived from `question_progress.correct` values.

---

---

# Claude Code Implementation Prompt

Implement the three-state badge system. Read the spec above before writing any code. This is a visual and logic change only — no database schema changes, no new API routes, no new Zustand store fields.

---

## STEP 1 — Add isMastered utility

Create or add to `lib/utils/progress.ts`:

```ts
export function isMastered(
  moduleId: string,
  progress: Record<string, { seen: boolean; correct: boolean }>,
  questions: Question[]
): boolean {
  const moduleQuestions = questions.filter(
    q => q.module === moduleId && q.status === 'active'
  )
  if (moduleQuestions.length === 0) return false
  return moduleQuestions.every(q => progress[q.id]?.correct === true)
}
```

This is a pure function — no side effects, no store reads, no async. Import questions from `data/questions.json` at call sites.

---

## STEP 2 — Update modStatus / getModuleStatus

The existing `getModuleStatus` function returns: `"not_started"` | `"in_progress"` | `"complete"` | `"preview_done"`.

Add `"mastered"` as a new return value. Mastered takes priority over complete — if all questions are both seen AND correct, return `"mastered"` rather than `"complete"`.

```ts
type ModuleStatus = "not_started" | "in_progress" | "complete" | "preview_done" | "mastered"

function getModuleStatus(
  module: Module,
  questions: Question[],
  progress: Record<string, { seen: boolean; correct: boolean }>,
  isPremium: boolean,
  freePerModule: number
): ModuleStatus {
  const moduleQuestions = questions.filter(
    q => q.module === module.id && q.status === 'active'
  )
  const seen = moduleQuestions.filter(q => progress[q.id]?.seen)

  if (seen.length === 0) return "not_started"

  // Check mastered first — superset of complete
  if (moduleQuestions.every(q => progress[q.id]?.correct === true)) {
    return "mastered"
  }

  if (seen.length === moduleQuestions.length) return "complete"
  if (!isPremium && !module.alwaysFree && seen.length >= freePerModule) return "preview_done"
  return "in_progress"
}
```

---

## STEP 3 — Update BadgeItem component

The badge item is used in the badge grid on the Learn index and possibly in the BadgeToast.

Update `components/badges/BadgeItem.tsx` to accept and render three visual states.

The component needs to know if a badge is mastered. Pass `isMastered` as a boolean prop:

```ts
interface BadgeItemProps {
  badge: Badge
  earned: boolean      // exists in the earned array
  mastered: boolean    // all questions in this module correct
  size?: 'sm' | 'md' | 'lg'  // 36px | 56px | 72px
}
```

Sizes:
- `sm` (36px) — used in BadgeToast
- `md` (56px) — default, used in badge grid
- `lg` (72px) — if used in a larger display

**Rendering logic:**

```tsx
const sizeMap = { sm: 36, md: 56, lg: 72 }
const pipSizeMap = { sm: 14, md: 18, lg: 22 }
const svgSizeMap = { sm: 7, md: 9, lg: 11 }

const px = sizeMap[size ?? 'md']
const pipPx = pipSizeMap[size ?? 'md']
const svgPx = svgSizeMap[size ?? 'md']

// Border and background
const borderColor = mastered ? '#f5a623' : earned ? '#4ade80' : token.s200
const borderWidth = (mastered || earned) ? 2.5 : 1
const bg = mastered ? '#fffbea' : token.s100

// Opacity and emoji
const opacity = earned ? 1 : 0.4
const emoji = earned ? badge.emoji : '🔒'
```

**Star pip** — only shown when mastered:

```tsx
{mastered && (
  <div
    style={{
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: pipPx,
      height: pipPx,
      borderRadius: '50%',
      background: '#f5a623',
      border: '2px solid white',   // matches page bg — use CSS variable in dark mode
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg
      viewBox="0 0 10 10"
      fill="white"
      style={{ width: svgPx, height: svgPx }}
    >
      <polygon points="5,1 6.2,3.8 9.5,4.1 7.1,6.2 7.9,9.5 5,7.8 2.1,9.5 2.9,6.2 0.5,4.1 3.8,3.8" />
    </svg>
  </div>
)}
```

The wrapper div must be `position: relative` for the absolute pip.

**Dark mode:** the pip border should match the surface it sits on. Use `var(--color-background-primary)` or the equivalent token rather than hardcoded white.

---

## STEP 4 — Update ModuleCard component

Update `components/modules/ModuleCard.tsx` to handle the mastered status.

**Border left:**
```ts
const borderLeft =
  status === 'mastered'    ? '3px solid #f5a623' :
  status === 'complete'    ? '3px solid #4ade80' :
  status === 'in_progress' ? `3px solid ${token.orange}` :
  isFundamentals           ? '3px solid #4ade80' :
                             `1px solid ${token.s200}`
```

**Background:**
```ts
const bg = status === 'mastered' ? '#fffdf0' : 'white'
```

**Status badge:**
```tsx
{status === 'mastered' ? (
  <span style={{
    background: '#fef3c7',
    color: '#92400e',
    fontFamily: token.mono,
    fontSize: 9,
    padding: '2px 7px',
    borderRadius: 99,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }}>
    <svg viewBox="0 0 10 10" fill="#92400e" style={{ width: 9, height: 9 }}>
      <polygon points="5,1 6.2,3.8 9.5,4.1 7.1,6.2 7.9,9.5 5,7.8 2.1,9.5 2.9,6.2 0.5,4.1 3.8,3.8" />
    </svg>
    Mastered
  </span>
) : status === 'complete' ? (
  <span style={{ background: '#dcfce7', color: '#166534', ... }}>Complete</span>
) : (
  /* existing not started / in progress / preview done badges */
)}
```

**Dot colours:**
```ts
function dotColor(questionId: string, progress: ..., moduleStatus: ModuleStatus): string {
  if (moduleStatus === 'mastered') return '#f5a623'   // all gold when mastered
  if (!progress[questionId]) return token.s200          // unseen
  if (progress[questionId].correct) return '#4ade80'    // correct = green
  return token.orange                                    // seen wrong = orange
}
```

When status is `mastered`, every dot is gold regardless of individual question state. This is a module-level display state — it communicates "you've nailed this whole module" rather than showing individual question correctness.

---

## STEP 5 — Update the badge grid call sites

In `app/learn/page.tsx` (or LearnIndex component), where badges are mapped and rendered:

For each badge, compute whether it is mastered:

```tsx
{modules.map(mod => {
  const badge = badges.find(b => b.id === mod.badgeId)
  if (!badge) return null

  const isEarned = earned.includes(badge.id)
  const isBadgeMastered = isMastered(mod.id, progress, questions)

  return (
    <BadgeItem
      key={badge.id}
      badge={badge}
      earned={isEarned}
      mastered={isBadgeMastered}
      size="md"
    />
  )
})}
```

Note: `isBadgeMastered` can be true even if `isEarned` is false only in edge cases (e.g. a user who answered everything correctly but progress wasn't fully synced). In practice, if all questions are correct they are also all seen, so mastered implies earned. Pass both anyway.

---

## STEP 6 — Update BadgeToast

The toast shown when a module badge is earned fires on "seen all" (existing trigger — unchanged). The toast uses the `sm` size of BadgeItem.

At toast time, also check if the module just became mastered to display the correct visual immediately:

```tsx
<BadgeItem
  badge={newBadge}
  earned={true}
  mastered={isMastered(newBadge.moduleId, progress, questions)}
  size="sm"
/>
```

This means if a user earns the badge by completing the last question correctly in one pass, the toast shows the gold star immediately.

---

## STEP 7 — DotMap component

Update `components/modules/DotMap.tsx` to accept and use the module status for dot colouring.

When `moduleStatus === 'mastered'`, render all dots as `#f5a623` regardless of individual progress. Otherwise use the existing per-question colour logic.

---

## What does NOT change

- Badge earning trigger — still fires on "seen all", unchanged
- The `earned` array in the store — no new entries, no new structure
- The `badges` table in Supabase — no schema changes
- The `BadgeToast` timing and content — only the visual of the BadgeItem inside it changes
- The master badge (CycleDutch 🏆) — not affected by this system
- The `preview_done` logic — unchanged
- Any routing or navigation

---

## Types to update

In `types/index.ts`:

```ts
// Add mastered to ModuleStatus
type ModuleStatus = 
  | "not_started" 
  | "in_progress" 
  | "complete" 
  | "preview_done" 
  | "mastered"
```

---

## Verify

1. A module where all questions have been seen but some are wrong shows: green left border on card, green dots (with orange for wrong), "Complete" badge, earned badge with green ring, no star pip
2. A module where all questions are correct shows: gold left border on card, all gold dots, "Mastered" badge with star, earned badge with gold ring and star pip
3. A module where no questions have been seen shows: default border, grey dots, "Not started" badge, locked badge at 0.4 opacity
4. The star pip renders correctly at all three sizes (72px, 56px, 36px)
5. No new toast fires when a module becomes mastered — only the existing "seen all" toast fires
6. The master badge (CycleDutch 🏆) is unaffected
7. Completing all questions in Review eventually turns a module mastered as the last wrong answer is fixed correctly
8. isMastered returns false if any question in the module has correct: false or is absent from progress
9. Fundamentals module correctly shows mastered when all 9 fundamentals questions are answered correctly
