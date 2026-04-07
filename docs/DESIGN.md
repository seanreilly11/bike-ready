# DESIGN.md — BikeReady Design System

---

## Aesthetic direction

Clean, confident, Dutch-inflected. The visual language is inspired by Dutch municipal signage and wayfinding — precise, functional, uncluttered — with warmth added through the orange accent and generous typography. It should feel like a well-designed city guide, not an edtech product.

**Not:** purple gradients, gamification chrome, cluttered dashboards, generic sans-serif.
**Yes:** white space, strong type hierarchy, a single warm accent colour, honest UI states.

---

## Fonts

```ts
// tailwind.config.ts
fontFamily: {
  display: ['Bricolage Grotesque', 'sans-serif'],  // headings, buttons, UI labels
  mono:    ['DM Mono', 'monospace'],               // metadata, tags, counts, code
}
```

Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Rules:**
- Headings: `font-display`, `font-bold` or `font-extrabold`, tight tracking
- Body text: `font-display`, normal or medium weight
- Labels, tags, metadata, counts, IDs: `font-mono`, uppercase, tracked
- Never: Inter, Roboto, system fonts

---

## Colour tokens

```ts
// lib/tokens.ts
export const colors = {
  // Primary accent
  orange:       '#E8500A',
  orangeLight:  '#FDF0E8',
  orangeMid:    '#FAD5B8',

  // Page backgrounds and surfaces
  stone50:  '#FAFAF8',   // page background
  stone100: '#F4F2EE',   // subtle backgrounds, disabled
  stone200: '#E8E4DC',   // borders, dividers, empty dots
  stone400: '#A89D8C',   // muted text, labels, placeholders
  stone600: '#6B6055',   // secondary text, descriptions
  stone900: '#1C1915',   // primary text, headings

  // Correct states
  green:      '#4ade80',
  greenLight: '#f0fdf4',
  greenMid:   '#bbf7d0',
  greenDark:  '#166534',

  // Incorrect / needs-work states
  red:      '#f87171',
  redLight: '#fef2f2',
  redMid:   '#fecaca',
  redDark:  '#991b1b',

  // Badge states
  yellow:      '#fde68a',
  yellowLight: '#fef9c3',
  yellowDark:  '#854d0e',
}
```

Extend `tailwind.config.ts` with these as custom colour values.

---

## Spacing and radius

Use Tailwind defaults. Key conventions:
- Page padding: `px-5` (20px)
- Card padding: `p-4` or `p-5`
- Gap between stacked cards: `gap-2.5` or `gap-3`
- Section spacing: `mb-6` or `mb-8`
- Border radius: `rounded-xl` (14px) for cards, `rounded-lg` (12px) for buttons, `rounded-full` for tags

---

## Shadows

Minimal. Only where content needs to float.

```
shadow-sm   → card at rest (optional, only if needed)
shadow-md   → card on hover
shadow-xl   → modals, gate overlay
```

Never coloured shadows.

---

## Component API

### `Button`

```tsx
<Button variant="primary" size="lg" onClick={fn}>Start learning →</Button>
<Button variant="secondary">Back</Button>
<Button variant="ghost">Not now</Button>
```

- `primary` — orange background, white text, `rounded-xl`, `font-display font-bold`
- `secondary` — white background, stone border
- `ghost` — no background, no border, stone text
- All: `w-full` prop, `disabled` state (stone200 bg, stone400 text), `active:scale-[0.98]`

### `Card`

```tsx
<Card accent="orange">...</Card>
<Card accent="green">...</Card>
<Card hover>...</Card>
<Card variant="muted">...</Card>
```

White background, `border border-stone200`, `rounded-xl`, `p-4`. `accent` adds a 3px left border. `hover` adds shadow transition.

### `Badge`

```tsx
<Badge variant="easy" />
<Badge variant="medium" />
<Badge variant="hard" />
<Badge variant="earned" label="Priority Pro" emoji="⚡" />
<Badge variant="locked" label="Sign Reader" />
```

`font-mono text-xs uppercase tracking-wide rounded-full px-2 py-0.5`. Difficulty colours: easy = green tint, medium = yellow tint, hard = red tint.

### `MasteryDot`

```tsx
<MasteryDot state="unseen" />   // grey
<MasteryDot state="seen" />     // orange (answered, not yet correct)
<MasteryDot state="correct" />  // green
<MasteryDot state="active" />   // orange with focus ring (current question)
```

`w-2.5 h-2.5 rounded-full`. Active adds `ring-2 ring-orange ring-offset-1`.

### `DotMap`

```tsx
<DotMap
  questions={moduleQuestions}
  progress={userProgress}
  currentId={currentQuestionId}
  isPremium={isPremium}
  freeLimit={FREE_PER_MODULE}
  onDotClick={setIndex}
/>
```

Renders a row of `MasteryDot`. Dots beyond index `freeLimit` render at 35% opacity for free users. Clickable to jump to a question.

### `ProgressBar`

```tsx
<ProgressBar value={40} color="orange" height={4} />
```

`rounded-full overflow-hidden bg-stone200`. Inner fill transitions via `transition-[width] duration-500`.

### `LessonAccordion`

```tsx
<LessonAccordion skill={question.skill} difficulty={question.difficulty} />
```

Looks up `lessons[skill][difficulty]` from `data/lessons.json`. Renders a collapsible button (collapsed by default) showing the lesson title. Expanded panel shows the lesson body in an orange-tinted card. If no lesson found, renders nothing.

State is local to the component — resets to closed on each new question.

### `QuestionCard`

```tsx
<QuestionCard
  question={q}
  onAnswer={(optionId: string, correct: boolean) => void}
  answered={false}
  selectedId={null}
  hideCorrect={false}   // true in Test mode — show selection but not correct/wrong
/>
```

Renders:
1. Skill tag + difficulty badge + type label
2. `LessonAccordion` (collapsed by default)
3. Prompt card with optional `SignDisplay` above prompt text
4. `OptionButton` list
5. `FeedbackPanel` (only when `answered && !hideCorrect`)

### `OptionButton`

```tsx
<OptionButton
  option={{ id: 'a', label: 'You have priority' }}
  state="idle" | "selected" | "correct" | "incorrect" | "unselected-after-answer"
  onClick={() => void}
  disabled={answered}
/>
```

States:
- `idle` — white bg, stone border
- `selected` — orange tint, orange border
- `correct` — green tint, green border, `✓` dot
- `incorrect` — red tint, red border, `✗` dot
- `unselected-after-answer` — white bg, stone border (the other options when answered)

### `FeedbackPanel`

```tsx
<FeedbackPanel feedback={question.fb} correct={true} />
```

Green (correct) or red (incorrect) tinted card. Shows title, body, then a divider with Rule and Tip sections labelled in mono uppercase.

### `SignDisplay`

```tsx
<SignDisplay signId="mandatory_cycle" />
```

Looks up the SVG component from `SIGN_REGISTRY` in `data/signs.tsx`. Renders centred in a `bg-stone100 rounded-xl p-4` container above the prompt text.

### `ModuleCard`

```tsx
<ModuleCard
  module={mod}
  progress={userProgress}
  isPremium={isPremium}
  totalSeen={totalSeen}
  onClick={() => void}
/>
```

Shows: emoji, title, question count, status badge, dot map, seen count. Status badge variants: Not started (stone), In progress (orange tint), Complete (green tint), Preview done (red tint).

Dots beyond `FREE_PER_MODULE` index render at 35% opacity for free users after they've used their 2 free questions in that module.

### `GateModal`

```tsx
<GateModal
  moduleName="Priority Rules"
  nextModule={nextModule}
  onUnlock={() => void}
  onNextModule={(id) => void}
  onDismiss={() => void}
/>
```

Full-screen backdrop overlay. Content: social proof pill → headline → feature list → €4.99 CTA → fine subtext → "Not now" dismiss. Next module card shown above if `nextModule` provided.

### `OnboardingOverlay`

```tsx
<OnboardingOverlay onDone={() => void} />
```

3-screen full-screen overlay. Step indicator dots with animated width transition (active dot wider). Skip option on screen 1. Calls `onDone` after screen 3 or skip.

### `ReturnBanner`

```tsx
<ReturnBanner totalSeen={8} onSignIn={() => void} onDismiss={() => void} />
```

Slim banner below nav. Shown when `totalSeen >= 3` and no account. Dismissible with ×.

### `AuthModal`

```tsx
<AuthModal onClose={() => void} />
```

Two states: email input → magic link sent confirmation. No password field.

### `BadgeToast`

```tsx
<BadgeToast badge={badge} />
```

Small animated toast notification. Yellow tint. Shows badge emoji and name. Auto-dismisses after 4 seconds. Appears bottom-right (desktop) or bottom-center (mobile).

### `Nav`

```tsx
<Nav currentRoute="/learn" wrongCount={3} isPremium={false} onSignIn={() => void} />
```

Sticky. Hidden on `/`. Logo → `/`. Three items: Learn, Review, Test. Review shows red dot when `wrongCount > 0`. Premium chip (⭐ Premium) or Sign in button.

---

## Screen-level patterns

### Landing page (`/`)
No nav. Full orange hero. Social proof pill in hero. Two CTAs (hero + bottom). Module grid, how-it-works cards, foreigner callout in between.

### Learn index (`/learn`)
Free banner (free users only). Module cards stacked. Badge grid at bottom. Replaced by PreviewCompleteScreen when all 12 free questions answered.

### PreviewCompleteScreen
Dark (`stone900`) hero with progress bar and "Don't leave it unfinished" headline. Module cards below with dimmed incomplete dots. Unlock CTA repeated twice (hero + bottom).

### Module session (`/learn/[moduleId]`)
Sticky sub-header: back button, module title, progress bar, seen count. Dot map. Badge toast (if just earned). AllDone state + save nudge. Gate screen (if free limit hit) OR active question.

### Review (`/review`)
Empty state. Working state: hint card + questions grouped by module with red left border. Active question view. All-cleared state.

### Test (`/test`)
Three phases: intro → questions (no mid-question feedback) → results (score, module breakdown, full feedback for wrong answers, share moment if passed).

---

## Responsive layout

### Approach

Mobile-first. Build for ~375px then expand. No fixed-width containers in components — let the layout system handle width. The prototype used a hard 480px cap for demonstration purposes; remove this in the real app.

### Breakpoints

Use Tailwind's default breakpoints:

| Breakpoint | Min-width | Use |
|---|---|---|
| (default) | 0px | Mobile — single column, full width, everything stacked |
| `sm` | 640px | Large phones / small tablets — minor spacing adjustments |
| `md` | 768px | Tablet — two-column layouts begin |
| `lg` | 1024px | Desktop — full multi-column layouts, max-width containers |
| `xl` | 1280px | Wide desktop — nothing changes beyond `lg`, just more margin |

### Content vs layout content

**Content** (question cards, feedback, lesson accordions, review questions) should max out at `max-w-2xl` (672px) and centre on wide screens. Reading content has an optimal line length — don't stretch it to fill a 1440px monitor.

**Layout content** (landing page, module index, test results) can use the full width and introduce multi-column layouts at `md`/`lg`.

### Per-screen responsive behaviour

**Navigation (`Nav`)**
- Mobile: logo left, nav items + sign-in right, compact spacing
- Desktop: same structure, more horizontal padding, slightly larger tap targets
- No change in structure — just spacing

**Landing page (`/`)**
- Mobile: single column, all sections stacked
- `md`: hero taller, how-it-works cards in a `grid-cols-3` row
- `lg`: module grid goes `grid-cols-3` (from `grid-cols-2`), hero content max ~560px wide with visual element alongside

**Learn index (`/learn`)**
- Mobile: module cards in a single column
- `md`: module cards in `grid-cols-2` — all 6 visible without scrolling
- Badge grid: `flex-wrap` stays the same, naturally reflows

**Module session (`/learn/[moduleId]`)**
- All widths: content column max `max-w-2xl`, centred
- Sticky sub-header spans full width
- Dot map, lesson accordion, question card all within the content column
- No two-column layout — focus is the question, not the screen real estate

**Review (`/review`)**
- All widths: content column max `max-w-2xl`, centred
- Question list single column at all widths

**Test (`/test`)**
- Questions: `max-w-2xl` centred, same as module session
- Results screen at `lg`: two-column layout — score + badge on the left (`col-span-1`), module breakdown on the right (`col-span-2`)
- Wrong answers review: full width within the content column

**GateModal / AuthModal / OnboardingOverlay**
- Mobile: full screen or near-full screen card (`max-w-sm`, `mx-4`)
- Desktop: centred modal card, `max-w-md`, backdrop blur

**PreviewCompleteScreen**
- Mobile: single column, dark hero full width
- `md`: module cards in `grid-cols-2`
- `lg`: module cards in `grid-cols-3`

### Page wrapper pattern

Every app page should use this wrapper:

```tsx
// Full-width pages (landing, learn index)
<main className="min-h-screen bg-stone-50">
  {children}
</main>

// Content pages (module session, review, test)
<main className="min-h-screen bg-stone-50">
  <div className="max-w-2xl mx-auto px-5 py-6 lg:py-10">
    {children}
  </div>
</main>
```

### Typography scaling

Scale heading sizes up slightly at `lg`:

```tsx
// Page heading
<h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">

// Section heading
<h2 className="text-lg font-bold lg:text-xl">
```

Body text and UI labels stay the same size across breakpoints.

### Touch targets

All interactive elements must meet minimum 44×44px touch target on mobile. Use padding to achieve this rather than setting explicit dimensions:

```tsx
// Nav button — visually compact but touch-safe
<button className="px-3 py-2 ...">Label</button>

// Dot map dots — small visual but larger hit area
<button className="p-2 -m-2">
  <div className="w-2.5 h-2.5 rounded-full ..." />
</button>
```

### Scroll behaviour

- `overflow-x: hidden` on `<body>` — no horizontal scroll at any breakpoint
- Module session sticky header: `position: sticky; top: 56px` (nav height) — adjust if nav height changes at breakpoints
- Modals: `overflow-y: auto` on modal content, max height `90vh` on mobile

---

## Animation

Two keyframes only:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pop {
  0%   { transform: scale(0.94); opacity: 0; }
  60%  { transform: scale(1.03); }
  100% { transform: scale(1);    opacity: 1; }
}
```

`fadeUp` — new questions, feedback panels, gate/modal appearing, badge toast.
`pop` — badge toast entry.

Add as custom Tailwind `animate-` utilities.

---

## States to design for every interactive component

- Default
- Hover
- Active / pressed
- Disabled
- Loading (where async)
- Empty (where lists can be empty)

Never leave a state undesigned.

---

## Accessibility

- All interactive elements keyboard accessible
- `aria-label` on icon-only buttons
- `aria-disabled` on disabled buttons
- `role="status"` on toast notifications
- Focus rings: `focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2`
- Orange (#E8500A) on white fails WCAG AA for body text — never use orange as body text colour. Use for UI elements, borders, and backgrounds only.

---

## Don'ts

- No streaks or streak counters
- No XP points or level-up mechanics
- No leaderboards
- No overall "completion %" progress bar
- No "Amazing work!", "You're crushing it!", "Great job!"
- No purple gradients
- No Inter, Roboto, or system fonts
- No inline styles in production components
- No hardcoded hex values — always use tokens
- No CSS modules
