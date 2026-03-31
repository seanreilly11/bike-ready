# SPEC.md — BikeReady Product Specification

---

## What it is

BikeReady is a short, one-time preparation course for expats and internationals who have recently arrived in the Netherlands and need to cycle safely in Dutch cities. It is not a habit app. It is not a Duolingo clone. It is a well-designed short course you complete over a week or two and leave feeling genuinely ready.

**One-line summary:** The question is the lesson. You are dropped into a real cycling moment, make a call based on instinct, and the feedback confirms or corrects your mental model.

---

## Primary user

Expats and internationals who are cycling — or about to start cycling — in Dutch cities. They already know how to cycle. They are recalibrating existing instincts, not learning from scratch. The app should feel like "here is what is different here", not "here is how to cycle."

**Realistic use pattern:**
- Arrives in Amsterdam. Does first module on the train. 12 minutes.
- Cycles to work. Nearly gets hit by a tram. Goes straight to Road Users module.
- Does two more modules over lunch.
- Finishes the last modules at the weekend. Takes the Test. Done.
- Does not come back. Cycles confidently. That is the win.

---

## Three destinations

### Learn (primary)

The course. 6 modules, each with 6–20 questions. Default entry point after the landing page. Users work through modules in order but can jump freely. All modules are accessible from day one — nothing is locked.

### Review

A personal queue of wrong answers. Get a question right and it disappears from the list. The list shrinks until empty. Gated behind premium.

### Test

16–20 questions mixed across all modules. Feedback withheld until the results screen. Score ≥80% earns the BikeReady master badge. Gated behind premium.

---

## Freemium model

**Free:** 2 questions per module. All 6 modules are open and browsable. After 2 questions in a module, the gate appears inline as the next screen. The free experience shows all module cards with 2 filled dots and the rest dimmed — the incompleteness is the conversion hook.

**Preview complete screen:** Once a user has answered 2 questions in all 6 modules (12 total), the Learn index is replaced by a dedicated upsell screen. It shows the exact progress (e.g. "25% of the way there"), all 6 module cards visually incomplete, and a single upgrade CTA.

**Premium:** €4.99 one-time. No subscription. Unlocks the full course, Review, Test, badges, and progress saving across sessions.

**The gate:** Triggered after the 2nd question in any module. Shown inline — no popup — as a replacement for the next question. Shows a next-module nudge card and the upgrade prompt. Momentum is preserved.

**Auth:** Magic link only. No passwords. Account required for premium. Free users get localStorage progress; migrated to Supabase on sign-up.

---

## Anonymous tracking

Every visitor gets an `anonymous_id` (UUID) in localStorage on first load. All Posthog events are tagged with it. On sign-up, the anonymous session is linked to the authenticated account via `posthog.identify()`. No IP-based tracking.

---

## Modules

| Module | Emoji | Skills covered | Questions |
|---|---|---|---|
| Priority Rules | ⚡ | Right Before Left, Shark Teeth, Turning Traffic, Mixed Scenarios, Priority Hierarchy | 14 |
| Signs & Signals | 🪧 | Signs, Intersections | 6 |
| Road Users | 🚶 | Pedestrians, Tram | 11 |
| Infrastructure | 🔄 | Roundabouts, City Cycling | 12 |
| Legal Rules | ⚖️ | Legal | 14 |
| Vocabulary | 🇳🇱 | Dutch Words | 12 |

Total active questions: 77 (growing). Target: 100+.

---

## Question types

| Type | When used | Options |
|---|---|---|
| `scenario_decision` | Real-world cycling moment requiring a judgement call | 2–3 options |
| `multiple_choice` | Knowledge of a specific rule, sign, law, or Dutch term | 4 options |
| `true_false` | Directly targets a named misconception | 2 options (True / False) |

Questions with a `sign` field show an SVG illustration of the actual Dutch sign above the prompt. The question asks about the sign rather than describing it in words.

---

## Question data model

```ts
interface Question {
  id:         string          // e.g. "qp1", "qmix3"
  module:     ModuleId        // module the question belongs to
  skill:      string          // skill display name, e.g. "Shark Teeth"
  difficulty: Difficulty      // "easy" | "medium" | "hard"
  type:       QuestionType    // "multiple_choice" | "true_false" | "scenario_decision"
  prompt:     string          // the question text, always second person
  options:    Option[]        // answer choices — { id: string, label: string }
  correct:    string          // id of the correct option, e.g. "b"
  sign?:      SignId          // optional — renders SVG above the prompt
  feedback:   Feedback        // shown after the user answers
  status:     QuestionStatus  // "draft" | "active" | "archived"
}
```

See `DATA_MODEL.md` for the complete type definitions including `Option`, `Feedback`, all enums, and the lessons schema.

---

## Difficulty calibration

| Level | Definition |
|---|---|
| `easy` | Things a careful person from any country would probably get right using common sense |
| `medium` | Things specific to the Netherlands that differ from most other countries |
| `hard` | Things even experienced cyclists sometimes get wrong, or where two rules interact |

---

## Lesson accordion

Every question has a collapsible lesson accordion above the prompt. **Collapsed by default.** Users open it if they want context before answering.

Content comes from `data/lessons.json`, keyed by `question.skill` and `question.difficulty`. One lesson per skill, three difficulty variants:

- **Easy** — full explanation of the rule, no hedging
- **Medium** — rule plus edge cases and interactions with other rules
- **Hard** — the most complete content of any variant. Full rules, edge cases, all relevant detail. Never vague — users are learning, not being examined.

If `lessons[skill][difficulty]` has no match, the accordion is not rendered.

---

## Feedback layer

Feedback appears after every answer in Learn and Review. In Test, feedback is withheld until the results screen.

Every feedback block has four parts:
1. **Title** — `"Correct"` or `"Not quite"`. Never effusive.
2. **Body** — 2–3 sentences: correction plus brief reason. Direct, no filler.
3. **Rule** — the actual Dutch cycling rule. Law reference optional.
4. **Tip** — one memorable mental hook for the road.

Tone: direct, empathetic to the wrong instinct, practical. Never more than 3–4 sentences total.

---

## Progress system

Progress tracked per question. One row per user per question in Supabase.

**Dot system:** Each question in a module is a dot.
- Grey = not seen
- Orange = seen, answered incorrectly at least once
- Green = answered correctly at least once (`correct` is sticky)

**Module status labels:** Not started / In progress / Complete / Preview done (free, both free questions used)

**Seen vs correct:** `correct` is OR'd on upsert — once true, always true, even if answered wrong in Review later.

**Storage:** `question_progress` table in Supabase. Before auth: localStorage with identical shape `{ [questionId]: { seen, correct } }`, migrated on sign-up.

---

## Badges

Badges mark completion milestones. Not retention mechanics — completion satisfaction.

| Badge | Emoji | Trigger |
|---|---|---|
| Priority Pro | ⚡ | All Priority Rules questions seen |
| Sign Reader | 🪧 | All Signs & Signals questions seen |
| Road Aware | 🚶 | All Road Users questions seen |
| Roundabout Ready | 🔄 | All Infrastructure questions seen |
| Law Abiding | ⚖️ | All Legal Rules questions seen |
| Dutch Speaker | 🇳🇱 | All Vocabulary questions seen |
| BikeReady | 🏆 | All modules complete + Test passed ≥80% |

Badges trigger client-side after each answer. Written to `badges` Supabase table. Shown as locked on Learn index until earned. Toast notification on earn.

---

## Supabase schema

```sql
-- User profiles
profiles (id, is_premium, created_at)

-- Per-question progress
question_progress (user_id, question_id, seen, correct, attempts, last_answered_at)
-- unique: (user_id, question_id)
-- upsert: correct = correct OR excluded.correct

-- Earned badges
badges (id, user_id, badge_id, earned_at)
-- unique: (user_id, badge_id)

-- Test results
test_results (id, user_id, score_pct, answers jsonb, completed_at)
```

All tables have RLS. Users access only their own rows.

---

## Data flow

1. App loads → `data/questions.json` and `data/lessons.json` imported into memory (static, instant)
2. User authenticated → fetch `question_progress` rows from Supabase
3. Merge in-memory: each question enriched with the user's `seen`/`correct` state
4. User opens question → lesson looked up from `data/lessons.json` by `skill` + `difficulty`
5. User answers → optimistic local state update → Supabase upsert in background
6. Badge check → if all module questions now `seen`, write badge row and show toast
7. Gate check → if `moduleSeen >= FREE_PER_MODULE` and not premium → show gate screen

---

## Navigation

Three nav items: **Learn**, **Review**, **Test**. Logo links to landing page. Nav hidden on landing page. Review tab shows a red dot when there are questions to fix.

URL structure:
- `/` — Landing page
- `/learn` — Module index (or PreviewCompleteScreen if all 12 free used)
- `/learn/[moduleId]` — Module session
- `/review` — Review queue
- `/test` — Test

---

## Landing page

Orange hero, no nav. Structure:
1. Hero: logo, audience label, h1, description, social proof pill ("2,400+ expats ready to ride"), primary CTA, "2 free questions per module" subtext
2. How it works: 3 step cards
3. 6 module grid (2 columns)
4. "Built for foreigners, not Dutch people" orange callout
5. Second CTA + pricing note

---

## Onboarding

First-time visitors see a 3-screen overlay triggered by clicking "Start learning". Steps: what BikeReady is → how it works → suggested order. Skip option on screen 1. Shown once, stored in localStorage.

---

## Save progress nudges

Two moments where free users are prompted to sign in:

1. **Return visit banner** — below nav, `totalSeen >= 3`, no account. Dismissible.
2. **Module complete nudge** — after completing all questions in a module, free users only.

---

## Test results screen

Shows: score percentage, by-module breakdown with progress bars, full feedback blocks for every wrong answer (body + rule + tip). Share moment for passed tests (≥80%) — native share API or clipboard copy.

---

## MVP scope

**In scope:**
- Landing page with onboarding overlay
- Learn — module index + module sessions + dot progress + lesson accordion
- Review — shrinking wrong-answer queue
- Test — mixed questions, end feedback with full wrong-answer review
- PreviewCompleteScreen — shown when all 12 free questions used
- Freemium gate (2 per module, inline, no popup) + next-module nudge
- GateModal with social proof
- Magic link auth (Supabase)
- Stripe one-time payment
- Return visit banner + module complete nudge
- Badges (module completion + master)
- `question_progress` tracking
- Sign SVGs for Signs & Signals module
- Analytics via Posthog
- Question bank: 77 questions (33 original + 44 generated, all `draft` → review before `active`)

**Post-MVP:**
- AI question generation pipeline (expand to 100+)
- Skill-level badges (Shark Tamer, Tram Aware etc.)
- Shareable results card
- Dutch language version
- Native mobile app
- Email — welcome, test passed, re-engagement
