"use client";

import type { Question, ModuleId } from "@/types";
import questionsData from "@/data/questions.json";
import modules from "@/data/modules";

const TEST_PER_MODULE = 3;

// Module-level constant — imported at build time, never changes at runtime.
// Exported for use in other hooks (useProgress, useBadges) that need it
// outside the hook call pattern.
export const activeQuestions: Question[] = (questionsData as Question[]).filter(
    (q) => q.status === "active",
);

export function useQuestions() {
    function questionsByModule(moduleId: ModuleId): Question[] {
        return activeQuestions.filter((q) => q.module === moduleId);
    }

    // Returns ~18 questions spread evenly across all 6 modules.
    // Deterministic — same set every call.
    function buildTestSet(): Question[] {
        return modules.flatMap((mod) =>
            questionsByModule(mod.id as ModuleId).slice(0, TEST_PER_MODULE),
        );
    }

    return {
        allQuestions: activeQuestions,
        totalQuestions: activeQuestions.length,
        questionsByModule,
        buildTestSet,
    };
}
