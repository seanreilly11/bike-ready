# Review Page - Free User FOMO Screen

## Spec

### Overview

The Review page for free users should not be a blank locked wall. Instead it should show the user exactly what they are missing - their real wrong answers, blurred so they can tell there is genuine content waiting but cannot interact with it. The goal is to create tangible FOMO: they can see their mistakes exist, they can see which modules they failed, they can see how many questions are waiting, but they cannot fix any of them without upgrading.

### Two states for free users

**State 1 - No wrong answers yet**

The user is free and has not yet answered any questions incorrectly (or has not answered enough questions to generate any wrong answers).

Show three ghost skeleton cards behind a blur and gradient overlay with a lock icon. The cards are not real questions - they are placeholder skeletons with grey bars. The purpose is to show what the review list looks like when populated, so the user understands what they are building toward.

Copy below the header: "Answer more questions in the modules and any you get wrong will appear here."

Lock overlay CTA: "Answer questions in the modules to build your review list - then unlock to fix them." + Unlock button.

**State 2 - Has wrong answers**

The user has real wrong answers in their progress. Show their actual question data, blurred and non-interactive, grouped by module.

Header copy: "You have [N] question[s] waiting for review. Go premium now to fix them before your next ride." where N is the exact count.

Layout from top to bottom:

1. Page header ("Review" eyebrow, "Fix your mistakes." heading, dynamic count copy)
2. Orange sticky unlock banner showing the question count and an "Unlock →" button
3. Real blurred question groups, grouped by module
4. Sticky bottom CTA card that fades in over a gradient

---

### Detailed behaviour

**Module headers - not blurred**

The module name and emoji and the count of wrong questions for that module are shown at full opacity and without blur. The user can see exactly which modules they have failed questions in. This is intentional - knowing you have failed Priority Rules 3 times is the specific sting that motivates payment.

Format: `[emoji] [Module Title]` left-aligned, `[N] to fix` right-aligned in orange.

**Question cards - blurred and non-interactive**

Each wrong question is shown as a card with:

- Red left border and red border colour (same style as the premium review list)
- ✗ icon in red on the left
- The question prompt text truncated at 82 characters with ellipsis
- Skill tag and difficulty pill below the prompt
- › chevron on the right

The card has `filter: blur(4px)` applied. `pointer-events: none` and `user-select: none` - clicking or selecting does nothing.

The real question text IS present in the DOM (not replaced with skeleton bars) because the user should be able to make out that there is real content there, even if they cannot read it clearly.

**Progressive opacity**

Groups beyond the first become progressively more faded to create a sense of depth:

- Group 0 (first module): opacity 1.0
- Group 1 (second module): opacity 0.7
- Group 2+ (third module and beyond): opacity 0.45

Within a group, cards beyond index 2 also fade:

- Cards 0 and 1: opacity 1.0 (within their group's opacity)
- Card 2+: `Math.max(0.25, 1 - (cardIndex - 1) * 0.3)`

**Sticky bottom CTA**

A sticky bottom section sits over the content as the user scrolls down. It uses a gradient fade (transparent → near-white) to blend into the blurred content above. On top of the gradient sits a floating card with:

- 🔓 open padlock emoji
- "Unlock to fix [N] mistake[s]" heading
- "Less than the fine for running a red light" subtext
- Full-width orange "Unlock for €4.99" button

The open padlock (not locked) signals it is one tap away.

**Orange top banner**

Below the header and above the question groups, a full-width orange banner shows:

- Bold white text: "[N] question[s] waiting for you"
- Subtext: "Fix these before your next ride"
- White "Unlock →" pill button on the right

**Premium users**

The existing premium review experience is unchanged. Premium users see their real wrong questions as interactive cards grouped by module, can tap into any question to answer it again, and clearing a question (answering correctly) removes it from the list.

---

### Copy summary

| Location                    | Copy                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Eyebrow                     | Review                                                                                         |
| Heading                     | Fix your mistakes.                                                                             |
| Subhead (no wrong answers)  | Answer more questions in the modules and any you get wrong will appear here.                   |
| Subhead (has wrong answers) | You have [N] question[s] waiting for review. Go premium now to fix them before your next ride. |
| Orange banner title         | [N] question[s] waiting for you                                                                |
| Orange banner sub           | Fix these before your next ride                                                                |
| Orange banner button        | Unlock →                                                                                       |
| Ghost overlay copy          | Answer questions in the modules to build your review list - then unlock to fix them.           |
| Bottom CTA heading          | Unlock to fix [N] mistake[s]                                                                   |
| Bottom CTA sub              | Less than the fine for running a red light                                                     |
| Bottom CTA button           | Unlock for €4.99                                                                               |
