# Micro Animations Design

**Date:** 2026-06-09  
**Status:** Approved

## Goal

Add tasteful micro animations across CycleDutch to improve perceived polish and user delight - without going overboard. All animations respect `prefers-reduced-motion`.

## Existing animation baseline

- `animate-fade-up` (fadeUp keyframe, 0.25s ease-out) - QuestionCard, FeedbackPanel, OnboardingOverlay
- `animate-pop` (pop keyframe, 0.3s ease-out with overshoot) - BadgeToast
- `animate-spin` - nav loading spinner
- `transition-all duration-150/200` + `active:scale-[0.99]` - OptionButton, ModuleCard

## Changes

### 1. New keyframes in `globals.css`

- `shake` - horizontal jitter for wrong answer (`OptionButton` incorrect reveal). ~300ms, 3px lateral movement.
- `fadeSlide` - used for onboarding step transitions. Slight upward slide + fade-in, 200ms.

Add `prefers-reduced-motion` media query to disable all custom keyframes for users who opt out.

### 2. OptionButton - answer reveal animations

- Correct option: apply `animate-pop` when state transitions to `correct`
- Incorrect option (the one the user picked): apply `animate-shake` when state transitions to `incorrect`
- Implementation: add conditional class based on `state` prop

### 3. MasteryDot - correct state pop

- Convert to client component (`'use client'`)
- Track previous state with `useRef` to detect `unseen/seen → correct` transition
- Apply `animate-pop` for one render cycle when newly correct
- Reset after animation completes via `onAnimationEnd`

### 4. ModuleCard - hover lift

- Add `hover:-translate-y-0.5` to existing `transition-all` class string
- One-line change

### 5. LessonAccordion - smooth height transition

- Replace instant show/hide with CSS max-height animation
- Use `max-h-0 overflow-hidden` → `max-h-[500px]` transition with `duration-200 ease-out`

### 6. Nav review dot - pulse

- Add `animate-pulse` to the red dot indicator
- Stops calling for attention when `wrongCount` drops to 0 (already conditional render)

### 7. FeedbackPanel - staggered section reveal

- Rule section: `animation-delay: 80ms`
- Tip section: `animation-delay: 160ms`
- Both use same `animate-fade-up` keyframe
- Apply via inline style `animationDelay`

### 8. Module card list - stagger on load

- In `/learn/page.tsx`, pass `index` to `ModuleCard` or wrap each in a div with `animate-fade-up` and `animationDelay: index * 60ms`
- Max 6 cards × 60ms = 360ms total spread - subtle, not sluggish

### 9. Onboarding - step content transition

- Add a `key={step}` to the content div (emoji + title + body) inside `OnboardingOverlay`
- React unmounts/remounts on step change, re-triggering `animate-fade-up`
- No extra state needed

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Add to `globals.css`.

## Files changed

- `app/globals.css` - new keyframes, reduced-motion rule
- `components/questions/OptionButton.tsx` - correct/incorrect reveal animation
- `components/ui/MasteryDot.tsx` - pop on correct state
- `components/modules/ModuleCard.tsx` - hover lift
- `components/questions/LessonAccordion.tsx` - smooth height transition
- `components/layout/Nav.tsx` - pulse on review dot
- `components/questions/FeedbackPanel.tsx` - staggered section reveal
- `app/learn/page.tsx` - staggered card entrance
- `components/layout/OnboardingOverlay.tsx` - step content re-mount transition
