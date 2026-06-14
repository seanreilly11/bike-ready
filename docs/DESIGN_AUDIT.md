# DESIGN_AUDIT.md — BikeReady web design audit & change plan

> Status: **Fully approved (2026-06-14)** — all tiers signed off. Ready to implement.
> Audited from live screenshots (mobile + desktop, Chrome) and component source.

---

## Review decisions (2026-06-14)

| Item | Decision |
|---|---|
| 2.2 Nav active indicator | ✅ Approved |
| 2.3 Status-badge / muted-text contrast | ✅ Approved |
| 2.5 Feedback panel correct/wrong icon chip | ✅ Approved |
| Tier 3 (all) | ✅ Approved |
| Tier 1 — 1.1 hero visual, 1.2 hero two-column, 1.3 desktop context rail, 1.4 progress legibility | ✅ Approved (all) — hero visual uses lucide + flat token shapes; sign in the rail stays a PNG. |
| 2.1 Module icons | ⚠️ Approved **with change** — use **lucide** icons, not custom SVGs. **Remove emojis entirely** and replace the stored emojis in `data/modules.ts` with lucide icons. |
| 2.4 Sign assets → SVG | ❌ **Dropped** — sign PNGs stay as-is. |
| 2.5 Success / empty-state spot illustrations | ❌ **Dropped** — keep the existing lucide-glyph treatment. |

**Implement now (everything approved):** Tier 1 (hero two-column + visual, desktop
context rail, progress legibility), 2.1 (lucide icons + emoji removal), 2.2, 2.3,
2.5-feedback, all of Tier 3.

---

## Context

BikeReady's current design is **competent and calm** — disciplined color use (orange
accent + stone neutrals + semantic green/red/gold), a clear type system (Bricolage
Grotesque display + DM Mono labels), consistent card language, honest UI states, SVG
(lucide) icons, and the accessibility basics (focus rings, `aria-label`s,
`prefers-reduced-motion`). It already matches the "well-designed city guide, not an
edtech product" intent in [docs/DESIGN.md](docs/DESIGN.md).

Where it underdelivers on **modern, inviting, and easy-to-learn-from**:

1. **The landing hero is a flat solid-orange block with no visual.** DESIGN.md
   (line 366) describes a desktop hero with "a visual element alongside" — never built.
2. **Desktop has large empty voids.** Content pages center a narrow `max-w-2xl`
   column; on a 1280px screen the question floats as a small card in a beige sea, with
   a tall void below it. Index pages are left-weighted with dead space below the fold.
3. **Progress feedback — a core learning motivator — is visually weak.** Bars are 3–4px
   tall (the module sub-header bar is nearly invisible) and mastery dots are 2.5px.
4. **Module cards are text-only.** Emojis exist in [data/modules.ts](data/modules.ts)
   but are never shown on the landing grid or the Practice cards.
5. **Nav has no active indicator** beyond orange text; the Guide sub-tabs do (underline).
6. **Sign assets are raster PNGs** (100×100) in [data/signs.tsx](data/signs.tsx).
   _(Observation only — kept as PNGs by decision; see Review decisions.)_

**Approved direction for this plan:** refinement + **lucide-based iconography** (no
bespoke SVG art); emojis removed entirely; sign PNGs retained; desktop voids filled with
a **context side-panel while keeping the reading width**; two-column hero with a flat
lucide-based visual. All tiers approved.

### Locked — do NOT change
- The palette in [lib/tokens.ts](lib/tokens.ts) / `@theme` in
  [app/globals.css](app/globals.css). Usage may be re-allocated; **no new hex, no new
  fonts.** Any new visual element uses existing tokens; **icons come from lucide.**
- The reading-width principle (`max-w-2xl` for question/answer content).
- The "Don'ts" in DESIGN.md: no gradients, no streaks/XP/leaderboards, no
  "Amazing work!" copy, no system fonts, no hardcoded hex, no inline styles in prod.
- Overall structure and navigation — this is a polish + illustration pass, not a rebuild.

---

## Change plan (prioritized)

### Tier 1 — Highest impact on "modern & inviting"

#### 1.1 Hero visual treatment ✅ approved
**What:** A single tasteful hero visual for the desktop two-column layout (1.2),
composed from **lucide icons + simple flat token-colored shapes** — not bespoke
illustration. The mockup uses a translucent "what you'll master" panel of module tiles
(lucide icons) plus two low-opacity background circles for depth. (Module icons and
success/empty states are explicitly **not** part of this: icons → lucide via 2.1; spot
illustrations → dropped.)
**Why:** Adds warmth to the flat orange hero without the quality risk of hand-rolled art.
**Risk:** Low–medium.

#### 1.2 Hero: build the desktop two-column layout + add depth
**Files:** [components/layout/HeroSection.tsx](components/layout/HeroSection.tsx),
[app/page.tsx](app/page.tsx).
**What:**
- On `lg`, split the hero into text (left, ~560px) + illustration (right) as DESIGN.md
  intended. Mobile keeps the stacked layout with a slim illustrative band.
- Add depth with **flat** layered shapes / a faint signage motif behind the text at low
  opacity (no gradient — stay within the Don'ts).
- Verify the `text-4xl` heading wraps cleanly at 360px; add a responsive step-down
  (`text-3xl` on the smallest screens) so long variant headings never feel cramped.
**Why:** Turns the flat orange block into a confident, branded first impression.
**Risk:** Low–medium (hero is isolated; A/B copy variants must keep working).

#### 1.3 Desktop context rail for study pages (fill the void, keep reading width)
**Files:** [app/learn/[moduleId]/page.tsx](app/learn/%5BmoduleId%5D/page.tsx),
[app/review/page.tsx](app/review/page.tsx), [app/test/page.tsx](app/test/page.tsx);
new `components/layout/StudyLayout.tsx`.
**What:** On `lg`, render two columns: **left** = the existing `max-w-2xl` reading
column, vertically centered in the viewport; **right** = a sticky context panel showing
module title, the dot-map progress, the current `SignDisplay` when the question has a
sign, and the skill / lesson title ("what you're learning"). Below `lg`, layout is
unchanged.
**Why:** Removes the "small card in a beige sea" feeling, reinforces learning context,
and keeps the optimal reading measure — the approved option.
**Risk:** Medium — it restructures the desktop page wrapper. The reading column's
internals (`QuestionCard` etc.) stay untouched.

#### 1.4 Progress legibility
**Files:** [components/ui/ProgressBar.tsx](components/ui/ProgressBar.tsx),
[components/ui/MasteryDot.tsx](components/ui/MasteryDot.tsx),
[components/modules/DotMap.tsx](components/modules/DotMap.tsx), call sites.
**What:** Bump `ProgressBar` default height 4→6 and the module/test sub-header bars 3→6.
Grow `MasteryDot` 2.5→3px and slightly widen dot-map gaps. Optionally render the dot map
on a faint baseline so it reads as a "route" (Dutch wayfinding) — no new colors.
**Why:** Progress is the main non-gamified motivator; right now it's almost invisible.
**Risk:** Low. Pure sizing; states and colors unchanged.

---

### Tier 2 — Consistency & polish

#### 2.1 Module icons via lucide (remove emojis entirely) ✅ approved (with change)
**Files:** [data/modules.ts](data/modules.ts) (replace `emoji` with a lucide `icon`), new
`components/ui/ModuleIcon.tsx`, plus every current emoji call site.
**What:**
- In `data/modules.ts`, **drop the `emoji` field** and add an `icon` mapped to a lucide
  component. Proposed mapping (finalize in build): Fundamentals→`Bike`,
  Priority→`Zap`, Signs→`Signpost` (or `TriangleAlert`), Road Users→`Footprints`
  (or `PersonStanding`), Infrastructure→`RotateCw`, Legal→`Scale`,
  Vocabulary→`Languages` (or `Flag`).
- New `ModuleIcon.tsx`: renders the module's lucide icon in the orange-on-`orange-light`
  rounded tile shown in the mockup. Consistent size/stroke with the rest of the app.
- **Show it on every module card** (landing grid in `app/page.tsx` is currently
  text-only) and **replace every remaining emoji usage**:
  - `components/modules/ModuleCard.tsx` (add the tile to the header)
  - `app/page.tsx` landing grid cards
  - `app/learn/[moduleId]/page.tsx` — the module-complete `text-4xl` emoji and the
    `Next: {emoji} {title}` buttons
  - `app/learn/page.tsx` PreviewComplete card headers
  - `app/test/page.tsx` module-breakdown rows (`{emoji} {title}`)
**Why:** Scannability + cross-page consistency; satisfies "no emoji as structural icons"
using the icon family already in the app (lucide) — no hand-rolled SVGs.
**Risk:** Low. Touches several call sites but each is a small swap; `Module` type changes
(`emoji` → `icon`) so TypeScript will surface every spot to update.

#### 2.2 Nav active indicator + narrow-width check ✅ approved
**File:** [components/layout/Nav.tsx](components/layout/Nav.tsx).
**What:** Add an active-state indicator (underline bar to match the Guide sub-tabs, or a
subtle `orange-light` pill) instead of color-only. Confirm the 4 links + Sign-in fit at
360–390px (the headless screenshots clipped due to a capture quirk, but a real-device
check is warranted); tighten spacing on the smallest breakpoint if needed.
**Why:** Clearer wayfinding (`nav-state-active`); avoids color-only signalling.
**Risk:** Low.

#### 2.3 Status-badge & muted-text contrast ✅ approved
**Files:** [components/ui/Badge.tsx](components/ui/Badge.tsx) (`locked` variant),
module count labels.
**What:** The "Not started" badge is `stone-400` on `stone-100` (low contrast); move the
text to `stone-600`. Audit other `stone-400`-on-light body text for the 4.5:1 minimum.
**Why:** Legibility / WCAG AA — same tokens, just better pairing.
**Risk:** Low.

#### 2.4 Sign assets → SVG ❌ dropped
Sign PNGs stay as-is by decision. The `uitgezonderd` `// TODO: add` in
[data/signs.tsx](data/signs.tsx) can still be resolved separately if desired, but no
PNG→SVG conversion and no `public/assets/signs/` changes.

#### 2.5 Feedback panel correct/wrong icon chip ✅ approved
**Files:** [components/questions/FeedbackPanel.tsx](components/questions/FeedbackPanel.tsx).
**What:** Add a leading correct/wrong icon chip (green `Check` / red `X` in a filled
circle) before the "Correct" / "Not quite" title, as shown in the mockup. Keep the
existing green/red tinted panel.
**Why:** `color-not-only` accessibility — meaning no longer relies on the tint alone.
**Risk:** Low.
**Not included:** success / empty-state spot illustrations (dropped) — the
module-complete, Review "All cleared", and Test pass screens keep their current lucide
glyph.

---

### Tier 3 — Nice-to-have

- **Cookie banner offset:** ensure bottom page padding so the fixed consent bar doesn't
  cover the bottom CTA before consent ([components/layout/CookieConsentBanner.tsx]).
- **Rhythm pass:** document an explicit spacing + elevation scale and standardize section
  spacing / card shadows (DESIGN.md already defines shadow tiers — apply consistently).
- **Index-page desktop:** give Practice/Guide indexes a bit more vertical interest
  (e.g., a lightweight header band) so they don't feel bottom-empty at `lg`.

---

## Icon guardrails (2.1)
- Icons come from **lucide-react** (already a dependency) — no hand-rolled SVGs.
- One consistent size + stroke; render in the orange-on-`orange-light` rounded tile.
- Tile colors from tokens only (`orange`, `orange-light`); icon is `aria-hidden` (the
  module title is the accessible label next to it).
- No emojis anywhere after this change.

## Files affected (approved scope)
- Hero (1.1/1.2): `components/layout/HeroSection.tsx`, `app/page.tsx`.
- Desktop context rail (1.3): new `components/layout/StudyLayout.tsx`;
  `app/learn/[moduleId]/page.tsx`, `app/review/page.tsx`, `app/test/page.tsx`.
- Progress legibility (1.4): `components/ui/ProgressBar.tsx`,
  `components/ui/MasteryDot.tsx`, `components/modules/DotMap.tsx` + call sites.
- Icons (2.1): `data/modules.ts` (`emoji`→`icon`), new `components/ui/ModuleIcon.tsx`,
  `components/modules/ModuleCard.tsx`, `app/page.tsx`, `app/learn/page.tsx`,
  `app/learn/[moduleId]/page.tsx`, `app/test/page.tsx`, plus the `Module` type in
  `types/index.ts`.
- Nav active state (2.2): `components/layout/Nav.tsx`.
- Contrast (2.3): `components/ui/Badge.tsx` (+ any low-contrast `stone-400` body text).
- Feedback chip (2.5): `components/questions/FeedbackPanel.tsx`.
- Tier 3: `components/layout/CookieConsentBanner.tsx` (offset), index header band in
  `app/learn/page.tsx` / `app/guide/page.tsx`, shadow/spacing standardization.

## Verification
- `npm run dev`, then re-screenshot the landing, Practice, a module question, Review,
  Test, and Guide at 360 / 768 / 1280; confirm: hero two-column on `lg` (stacked on
  mobile), no desktop void on study pages (context rail present, reading column centered),
  6px progress bars + larger dots, lucide module-icon tiles everywhere (no emoji left),
  nav active underline, readable "Not started" badge, feedback icon chip.
- Real-device or DevTools device-emulation check at 360px (the CLI screenshots laid out
  wider than the window, so narrow-width wrapping/overflow must be verified properly).
- `npm run typecheck` (will flag every `emoji` call site) and `npm run test:run` green.
- Contrast: spot-check new/changed text pairs at ≥4.5:1.
- Confirm nothing regressed with `NEXT_PUBLIC_PREMIUM_ENABLED` toggled (gate/upsell
  screens are off in this build but must still render correctly when on).
