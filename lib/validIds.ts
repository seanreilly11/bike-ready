// Server-safe sets of known content ids, used to reject garbage writes on
// the progress/badges API routes. Built from the same static data the client
// renders, so it never drifts. No "use client" - importable in route handlers.
import questionsData from "@/data/questions.json";
import badges from "@/data/badges";
import type { Question } from "@/types";

export const VALID_QUESTION_IDS: ReadonlySet<string> = new Set(
  (questionsData as Question[])
    .filter((q) => q.status === "active")
    .map((q) => q.id),
);

export const VALID_BADGE_IDS: ReadonlySet<string> = new Set(
  badges.map((b) => b.id),
);
