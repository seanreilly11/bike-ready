# DATA_MODEL.md — BikeReady

Full data model for all static content and dynamic user data.

---

## Principles

**Content is static. Progress is dynamic.**

All question and lesson content lives in JSON files imported at build time. The database stores only user progress, badges, and test results. These two concerns never mix.

**All keys use full descriptive names.** No abbreviations anywhere in the data model.

---

## Static content

### `data/questions.json`

The full question bank. Array of `Question` objects.

#### Question

```ts
interface Question {
  id:         string          // unique identifier, e.g. "qp1", "qmix3"
  module:     ModuleId        // which module this question belongs to
  skill:      string          // skill display name, e.g. "Shark Teeth"
                              // must match a key in data/lessons.json
  difficulty: Difficulty      // "easy" | "medium" | "hard"
  type:       QuestionType    // "multiple_choice" | "true_false" | "scenario_decision"
  prompt:     string          // the question text, always second person
  options:    Option[]        // answer choices
  correct:    string          // id of the correct Option, e.g. "b"
  sign?:      SignId          // optional — renders SVG above prompt
  feedback:   Feedback        // shown after the user answers
  status:     QuestionStatus  // "draft" | "active" | "archived"
}
```

#### Option

```ts
interface Option {
  id:    string   // single letter, e.g. "a", "b", "c", "d"
  label: string   // the answer text shown to the user
}
```

#### Feedback

```ts
interface Feedback {
  title: "Correct" | "Not quite"   // always one of these two — never anything else
  body:  string                    // 2–3 sentences: correction + brief reason
  rule:  string                    // the actual Dutch cycling rule, plain English
                                   // law reference (e.g. "RVV 1990 Art. 15") optional
  tip:   string                    // one memorable sentence — a mental hook for the road
}
```

#### Enums and unions

```ts
type ModuleId =
  | "priority"
  | "signs"
  | "roadusers"
  | "infrastructure"
  | "legal"
  | "vocabulary"

type Difficulty = "easy" | "medium" | "hard"

type QuestionType = "multiple_choice" | "true_false" | "scenario_decision"

type QuestionStatus = "draft" | "active" | "archived"

type SignId =
  | "mandatory_cycle"   // round blue sign, white bicycle — G11
  | "no_cycling"        // round white, red border, red diagonal
  | "priority_road"     // yellow diamond — voorrangsweg
  | "uitgezonderd"      // no entry + uitgezonderd fietsers sub-sign
  | "fietsstraat"       // red rectangular FIETSSTRAAT sign
  | "cyclist_light"     // small traffic light with bicycle symbol, red active
  | "shark_teeth"       // road marking — three white triangles
```

#### ID prefix conventions

| Module | Prefix | Examples |
|---|---|---|
| priority | qp | qp1, qp9, qp14 |
| signs | qs | qs1, qs6 |
| roadusers | qr | qr1, qr6, qr11 |
| infrastructure | qi | qi1, qi6, qi12 |
| legal | ql | ql1, ql5, ql14 |
| vocabulary | qv | qv1, qv6, qv12 |
| mixed scenarios (lives in priority module) | qmix | qmix1, qmix8 |

#### Full example

```json
{
  "id": "qp3",
  "module": "priority",
  "skill": "Shark Teeth",
  "difficulty": "medium",
  "type": "scenario_decision",
  "prompt": "You're cycling toward a crossing. Shark teeth are on your side. Another cyclist is approaching from your right. Who goes first?",
  "options": [
    { "id": "a", "label": "You — they're not on a main road" },
    { "id": "b", "label": "The other cyclist — shark teeth override right-before-left" }
  ],
  "correct": "b",
  "feedback": {
    "title": "Correct",
    "body": "The shark teeth override the right-before-left rule. Road markings always take precedence over default priority rules.",
    "rule": "Road markings override default priority rules.",
    "tip": "Always check for markings before applying right-before-left."
  },
  "status": "active"
}
```

---

### `data/lessons.json`

Skill lessons shown in the collapsible accordion above each question.

#### Top-level structure

```ts
interface LessonsFile {
  meta:    LessonsMeta
  lessons: Record<string, SkillLessons>
  //       key = skill display name, must match Question.skill exactly
}
```

#### SkillLessons

```ts
interface SkillLessons {
  easy:   LessonVariant   // full rule explanation
  medium: LessonVariant   // rule + edge cases
  hard:   LessonVariant   // most complete — full rules, edge cases, all detail
}
```

#### LessonVariant

```ts
interface LessonVariant {
  title: string   // short heading shown in the collapsed accordion button
  body:  string   // 2–4 sentences of lesson content shown when expanded
}
```

#### Lookup

```ts
const lesson = lessons[question.skill]?.[question.difficulty]
// if undefined, accordion is not rendered
```

#### Full example

```json
{
  "lessons": {
    "Shark Teeth": {
      "easy": {
        "title": "Shark teeth (haaientanden)",
        "body": "White triangles painted on the road are called shark teeth. They always point toward the road user who must yield. If they point at you, you must give way to crossing traffic — regardless of where the other road user is coming from."
      },
      "medium": {
        "title": "Shark teeth override defaults",
        "body": "Shark teeth are a road marking, and road markings take precedence over default priority rules like right-before-left. Always check for markings before applying the default. The direction the teeth point tells you who yields."
      },
      "hard": {
        "title": "Shark teeth and the rules they override",
        "body": "Shark teeth override the right-before-left default — the marking takes precedence, full stop. The key is identifying which road has the teeth. Teeth on your side mean you yield, even if the other road user is also coming from your right. Teeth on the other road mean they yield to you. When shark teeth and another rule both apply, the teeth win."
      }
    }
  }
}
```

---

### `data/modules.ts`

Module definitions. Static, not JSON — imported as TypeScript since it may include logic (e.g. badge trigger functions).

```ts
interface Module {
  id:          ModuleId
  title:       string       // display name, e.g. "Priority Rules"
  emoji:       string       // single emoji used throughout the UI
  description: string       // one sentence shown on module cards
  badgeId:     string       // id of the badge earned on completion
  badgeName:   string       // display name of the badge
}
```

#### All modules

```ts
const modules: Module[] = [
  { id: "priority",       title: "Priority Rules",   emoji: "⚡", badgeId: "badge_priority",  badgeName: "Priority Pro"       },
  { id: "signs",          title: "Signs & Signals",  emoji: "🪧", badgeId: "badge_signs",     badgeName: "Sign Reader"         },
  { id: "roadusers",      title: "Road Users",       emoji: "🚶", badgeId: "badge_roadusers", badgeName: "Road Aware"          },
  { id: "infrastructure", title: "Infrastructure",   emoji: "🔄", badgeId: "badge_infra",     badgeName: "Roundabout Ready"    },
  { id: "legal",          title: "Legal Rules",      emoji: "⚖️", badgeId: "badge_legal",     badgeName: "Law Abiding"         },
  { id: "vocabulary",     title: "Vocabulary",       emoji: "🇳🇱", badgeId: "badge_vocab",     badgeName: "Dutch Speaker"       },
]
```

---

### `data/badges.ts`

```ts
interface Badge {
  id:          string   // e.g. "badge_priority", "badge_master"
  name:        string   // display name, e.g. "Priority Pro"
  emoji:       string   // single emoji
  description: string   // one sentence, e.g. "Completed Priority Rules"
  moduleId:    ModuleId | null   // null for the master badge
}
```

---

### `data/signs.tsx`

SVG sign components. Each is a zero-prop React component returning an `<svg>` element. All registered in `SIGN_REGISTRY`:

```ts
const SIGN_REGISTRY: Record<SignId, React.FC> = {
  mandatory_cycle: SignMandatoryCycle,
  no_cycling:      SignNoCycling,
  priority_road:   SignPriorityRoad,
  uitgezonderd:    SignUitgezonderd,
  fietsstraat:     SignFietsstraat,
  cyclist_light:   SignCyclistLight,
  shark_teeth:     SignSharkTeeth,
}
```

---

## Dynamic data (Supabase)

### `profiles`

One row per user. Extends Supabase `auth.users`.

```ts
interface Profile {
  id:         string    // uuid — matches auth.users.id
  is_premium: boolean   // true after successful Stripe payment
  created_at: string    // ISO 8601 timestamp
}
```

---

### `question_progress`

One row per user per question. The core progress table.

```ts
interface QuestionProgress {
  id:               string    // uuid
  user_id:          string    // uuid — references profiles.id
  question_id:      string    // references Question.id in static data
  seen:             boolean   // true once the user has answered at any time
  correct:          boolean   // true if ever answered correctly — sticky, never reverts
  attempts:         number    // total number of times answered
  last_answered_at: string    // ISO 8601 timestamp
}
// unique constraint: (user_id, question_id)
```

**Upsert logic:**

```sql
on conflict (user_id, question_id) do update set
  correct          = question_progress.correct OR excluded.correct,
  attempts         = question_progress.attempts + 1,
  seen             = true,
  last_answered_at = now()
```

`correct` is OR'd — once `true`, always `true`, even if the user answers incorrectly later in Review.

**Before auth — localStorage shape:**

```ts
type LocalProgress = Record<string, { seen: boolean; correct: boolean }>
// key = question_id
// migrated to Supabase on sign-up, then cleared from localStorage
```

---

### `badges`

One row per user per badge earned.

```ts
interface EarnedBadge {
  id:        string   // uuid
  user_id:   string   // uuid — references profiles.id
  badge_id:  string   // references Badge.id in static data
  earned_at: string   // ISO 8601 timestamp
}
// unique constraint: (user_id, badge_id)
```

---

### `test_results`

One row per completed Test session.

```ts
interface TestResult {
  id:           string    // uuid
  user_id:      string    // uuid — references profiles.id
  score_pct:    number    // 0–100, rounded integer
  answers:      Record<string, string>   // { [question_id]: selected_option_id }
  passed:       boolean   // score_pct >= 80
  completed_at: string    // ISO 8601 timestamp
}
```

---

## Derived / computed state

These are never stored — always computed at runtime from the static content and `question_progress`.

### Dot state

```ts
type DotState = "unseen" | "seen" | "correct" | "active"

function getDotState(questionId: string, progress: LocalProgress, currentId: string): DotState {
  if (questionId === currentId) return "active"
  const p = progress[questionId]
  if (!p) return "unseen"
  if (p.correct) return "correct"
  return "seen"
}
```

### Module status

```ts
type ModuleStatus = "not_started" | "in_progress" | "complete" | "preview_done"

function getModuleStatus(
  moduleId: ModuleId,
  questions: Question[],
  progress: LocalProgress,
  isPremium: boolean,
  freePerModule: number
): ModuleStatus {
  const moduleQuestions = questions.filter(q => q.module === moduleId)
  const seen = moduleQuestions.filter(q => progress[q.id])

  if (seen.length === 0) return "not_started"
  if (seen.length === moduleQuestions.length) return "complete"
  if (!isPremium && seen.length >= freePerModule) return "preview_done"
  return "in_progress"
}
```

### Review queue

```ts
// Questions the user has answered incorrectly and not yet corrected in Review
function getReviewQueue(questions: Question[], progress: LocalProgress): Question[] {
  return questions.filter(q => {
    const p = progress[q.id]
    return p?.seen && !p?.correct
  })
}
```

### Preview complete

```ts
// True when all 6 modules have hit their free question limit
function isPreviewComplete(
  modules: Module[],
  questions: Question[],
  progress: LocalProgress,
  freePerModule: number
): boolean {
  return modules.every(mod => {
    const seen = questions
      .filter(q => q.module === mod.id && progress[q.id])
      .length
    return seen >= freePerModule
  })
}
```

---

## Analytics events

Tracked via Posthog. Every visitor has an `anonymous_id` UUID in localStorage from first load.

```ts
interface AnalyticsEvents {
  question_answered: {
    question_id: string
    module:      ModuleId
    skill:       string
    difficulty:  Difficulty
    correct:     boolean
  }
  module_started:    { module: ModuleId }
  module_completed:  { module: ModuleId }
  gate_seen:         { module: ModuleId; source: "inline" | "nav" | "preview_complete" }
  gate_converted:    {}
  test_completed:    { score_pct: number; passed: boolean }
  badge_earned:      { badge_id: string }
  onboarding_completed: {}
}
```

---

## Constants

```ts
const FREE_PER_MODULE   = 2       // free questions per module before gate
const TEST_PASS_PCT     = 80      // minimum % to earn BikeReady master badge
const RETURN_BANNER_MIN = 3       // minimum questions seen before showing return banner
```
