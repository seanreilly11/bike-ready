"use client";

import type { Question, ModuleId } from "@/types";
import questionsData from "@/data/questions.json";
import modules from "@/data/modules";

const TEST_PER_MODULE = 3;

// Module-level constant - imported at build time, never changes at runtime.
// Exported for use in other hooks (useProgress, useBadges) that need it
// outside the hook call pattern.
export const activeQuestions: Question[] = (questionsData as Question[]).filter(
  (q) => q.status === "active",
);

// Fisher-Yates on a copy - the source array is build-time constant.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useQuestions() {
  function questionsByModule(moduleId: ModuleId): Question[] {
    return activeQuestions.filter((q) => q.module === moduleId);
  }

  // 21 questions - TEST_PER_MODULE sampled at random from each module.
  // Resampled on every call: callers that need a stable set for a session
  // (the Test page) must hold the result in state.
  function buildTestSet(): Question[] {
    return modules.flatMap((mod) =>
      shuffle(questionsByModule(mod.id as ModuleId)).slice(0, TEST_PER_MODULE),
    );
  }

  return {
    allQuestions: activeQuestions,
    totalQuestions: activeQuestions.length,
    questionsByModule,
    buildTestSet,
  };
}
