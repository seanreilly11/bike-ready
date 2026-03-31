# BikeReady — Question Writing Framework

---

## Purpose

Every question in BikeReady should do one thing: build real cycling instinct. Not test memory of rules. Not catch people out. The question drops you into a real moment, you make a call, and the feedback either confirms or sharpens your mental model.

---

## Voice

**Default to second person.** Most questions should put the user in the moment.

✓ "You are cycling toward a crossing. Shark teeth are on your side."
✗ "A cyclist approaches a crossing with shark teeth on their side."

The user should feel like they're making a real decision, not answering a quiz about someone else.

**Exceptions — factual T/F and vocabulary-in-context prompts do not need second person.**

Some question types are naturally declarative or observational, and forcing second person makes them awkward:

- `true_false` propositions that state a rule directly: `"It is a legal requirement to have a bell on your bicycle in the Netherlands."` — this is a factual assertion, not a cycling moment, and reads better as a statement to evaluate.
- Vocabulary-in-context prompts where the user identifies a sign or word they have encountered: `"A sign at roadworks reads 'Pas op'. What does this mean?"` — the framing is naturally third-person because the sign is the subject.
- Fine/penalty knowledge questions: `"What is the fine for cycling at night without lights?"` — these are knowledge questions, not decisions.

For these types, clarity and natural phrasing take priority over strict second-person voice. Scenario and decision questions must still be second person.

---

## Question types

| Type | When to use | Options |
|---|---|---|
| `scenario_decision` | A real cycling moment requiring a judgement call | 2–3 options |
| `multiple_choice` | Knowledge of a rule, sign, law, or Dutch term | 4 options |
| `true_false` | Directly targeting a specific misconception | 2 options (True / False) |

**Ratio target:** ~60% scenario, ~30% multiple choice, ~10% true/false.

True/false should only be used when the misconception is clear and direct. Don't use true/false for nuanced situations — use scenario or multiple choice instead.

---

## Difficulty calibration

| Level | Definition | Examples |
|---|---|---|
| `easy` | Things a careful person from any country would probably get right using common sense | Zebra crossings, red lights, phone use |
| `medium` | Things specific to the Netherlands that differ from most countries | Right-before-left, mandatory cycle paths, cyclist traffic lights |
| `hard` | Things even experienced Dutch cyclists sometimes get wrong, or where two rules interact | Shark teeth overriding right-before-left, roundabout priority without markings, fietsstraat + unmarked intersection |

---

## Writing the prompt

**Structure:** Situation → decision moment. Give only the details needed to make the decision. No extra noise.

**Length:** 1–3 sentences. Prompts must be scannable. If it needs more than 3 sentences, it's too complex — split it into two questions.

**Format:**
- Start with "You are cycling…" or "You're cycling…" or "You approach…"
- State the specific detail that creates the decision (the sign, the road marking, the other road user)
- End with the decision question: "What do you do?", "Who has priority?", "Is this legal?", "What does this mean?"

**Good prompt:**
> "You're cycling toward a crossing. Shark teeth are painted on your side. Another cyclist is approaching from your right. Who goes first?"

**Weak prompt:**
> "According to Dutch traffic law, when shark teeth markings are present at an intersection and another road user is approaching from the right, which road user has the right of way?"

---

## Writing the options

### Wrong options — what makes them good

All four criteria should be considered for every wrong option. The best wrong options satisfy at least two:

1. **It's what most foreigners would instinctively do** — the "obvious" answer that turns out to be wrong in the Netherlands
2. **It's logically plausible but legally wrong** — sounds reasonable, doesn't hold up under Dutch law
3. **It's a rule from another country that doesn't apply here** — e.g. "vehicles in the roundabout have priority" (true in most countries, not in NL)
4. **It targets a specific named misconception** — e.g. "wider roads have priority", "faster traffic has priority", "cyclists always have priority on bike paths"

### Right options

State the correct action or fact plainly. Don't make it sound obviously correct — it should be defensible but not telegraphed.

### Scenario questions (2–3 options)

With only 2–3 options, every option must feel genuinely plausible. Never include an obviously absurd option. With 2 options, both should represent a real instinct someone could have.

### Multiple choice (4 options)

Avoid "all of the above" and "none of the above". Each option should be independently plausible. One can be closer to correct than the others — a "tempting wrong answer" — but only one is correct.

---

## Writing feedback

### Structure (always four parts)

```
title: "Correct" | "Not quite"
body:  2–3 sentences — correction + brief reason
rule:  The actual rule, plain English. Law citation optional.
tip:   One sentence mental hook for remembering on the road.
```

### Body text (2–3 sentences)

- Sentence 1: State what's correct and why
- Sentence 2: Explain the reasoning or the principle behind it
- Sentence 3 (optional): Real-world context — what this looks like on an actual Dutch street

Never start with "Actually…" or "Remember that…" — just state it directly.

For incorrect feedback: acknowledge the instinct that led to the wrong answer, then explain why it doesn't apply here.

**Good:**
> "The shark teeth override the right-before-left rule. Road markings always take precedence over default priority rules — check for markings before applying the default."

**Weak:**
> "Actually, you need to remember that shark teeth indicate a yield obligation which overrides the standard right-before-left priority rule that you might have been thinking of."

### Rule field

Plain English statement of the rule. Include an RVV article reference only when it adds weight (fines, legal obligations, things people might challenge). Skip it for practical safety rules or common-sense applications.

✓ `"RVV 1990 Art. 61a — handheld phone use prohibited while cycling."`
✓ `"Turning traffic always yields to straight-going traffic."`
✗ `"RVV 1990 Art. 15 — rechts heeft voorrang applies at unmarked intersections between equal road users."` (too much)

### Tip field

One short, memorable sentence. A mental hook — something visual or rhythmic that sticks.

✓ `"Teeth pointing at you = you yield. Always."`
✓ `"Round blue = mandatory. Red border = forbidden."`
✓ `"Near large vehicles: slow, eye contact, then proceed."`
✗ `"Remember to always check for road markings before applying default priority rules at intersections."` (too long, not a hook)

---

## Per-skill guidance

### skill_legal
High-specificity content. Always include the fine where relevant — specific numbers make rules memorable. Questions should cover: lights (active vs reflector), phone use, alcohol limit, riding two abreast, bell requirement, age rules for alcohol.

### skill_tram
Focus on the physical reality — trams can't stop or steer. Questions should drive home: trams always win, even on green; cross tracks at 90°; yield to disembarking passengers. The "green light doesn't override a tram" rule surprises almost everyone.

### skill_dutch_words
Test the word in context, not in isolation. "What does X mean on a sign you've just seen?" not "Translate the word X." Include: voorrang verlenen, haaientanden, fietsstraat, uitgezonderd, verboden, rijwielpad, voorrangsweg, doorrijden, voetgangersoversteekplaats.

### skill_roundabouts
The NL roundabout model is unique. Questions should cover: cyclist ring priority (and how to confirm it with shark teeth), signalling when exiting, the edge case where there are NO shark teeth (no assumed priority). Avoid making all roundabout questions about the same priority scenario.

### skill_pedestrians
Focus on zebra crossings (mandatory yield) and shared paths (mutual consideration). Include the edge case: must a cyclist yield at a zebra crossing on a cycle path? Yes.

### skill_mixed_scenarios
These are the hardest and most valuable questions. Always combine at least two rules. Good combinations: shark teeth + right-before-left, tram + green light, roundabout ring + no shark teeth, turning traffic + cycle path. The question should require the user to apply both rules to get to the right answer.

### skill_city_cycling
Practical urban safety. Door zone (1m from parked cars), contraflow lanes, positioning at junctions, blind spots near trucks and buses. Questions should feel like things that would actually happen on a busy Amsterdam street.

### skill_intersections
Priority road sign (yellow diamond), T-junctions vs crossroads, traffic lights (cyclist vs car), give-way lines. Include the common mistake of following the car light instead of the cyclist light.

---

## Quality checklist

Before finalising any question, check:

- [ ] Prompt is second person (or is a factual T/F, vocabulary-in-context, or fine/knowledge question — see Voice exceptions)
- [ ] Prompt is under 3 sentences
- [ ] Decision moment is clear — there's one specific thing the user has to decide
- [ ] Every wrong option is plausible (would a reasonable expat choose it?)
- [ ] No option is obviously absurd
- [ ] Feedback body is 2–3 sentences
- [ ] Feedback explains the *why*, not just the *what*
- [ ] Tip is a single memorable sentence
- [ ] Difficulty matches the calibration definition
- [ ] `status` is set to `"draft"` for new questions

---

## Data model (copy this for every new question)

```ts
{
  id: "q[skill_prefix]_[nn]",          // e.g. "ql5", "qv6", "qmix4"
  m: "[moduleId]",                      // e.g. "legal", "vocabulary", "priority"
  sk: "[Skill Name]",                   // display name e.g. "Legal", "Dutch Words"
  d: "easy" | "medium" | "hard",
  t: "multiple_choice" | "true_false" | "scenario_decision",
  p: "[prompt text]",
  opts: [
    { id: "a", l: "[option text]" },
    { id: "b", l: "[option text]" },
    // { id: "c", l: "[option text]" },  // 3rd option for MC or some scenarios
    // { id: "d", l: "[option text]" },  // 4th option for MC only
  ],
  c: "[correct option id]",
  sign: "[sign_id]",                    // optional — only for Signs module
  fb: {
    title: "Correct" | "Not quite",
    body: "[2–3 sentences]",
    rule: "[plain English rule, law ref optional]",
    tip: "[one memorable sentence]",
  },
  status: "draft",
},
```

---

## ID conventions

| Module | Prefix | Example |
|---|---|---|
| priority | qp | qp9, qp10 |
| signs | qs | qs7, qs8 |
| roadusers | qr | qr6, qr7 |
| infrastructure | qi | qi6, qi7 |
| legal | ql | ql5, ql6 |
| vocabulary | qv | qv6, qv7 |
| mixed scenarios | qmix | qmix1, qmix2 |

Mixed scenarios lives in the `priority` module (`m: "priority"`) since that's where combined-rule questions fit best. Use the `qmix` prefix for IDs.
