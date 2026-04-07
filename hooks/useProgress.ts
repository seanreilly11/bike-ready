"use client";

import { useCallback } from "react";
import type { ModuleId, Question, DotState, ModuleStatus } from "@/types";
import { FREE_PER_MODULE } from "@/types";
import { useAppStore } from "@/stores/appStore";
import { useQuestions } from "@/hooks/useQuestions";
import modules from "@/data/modules";
import updateProgress from "@/lib/mutations/updateProgress";

export function useProgress() {
  const progress = useAppStore((s) => s.progress);
  const user = useAppStore((s) => s.user);
  const { questionsByModule, allQuestions } = useQuestions();

  const recordAnswer = useCallback(
    async (questionId: string, correct: boolean) => {
      // Optimistic, synchronous update via store
      useAppStore.getState().answerQuestion(questionId, correct);
      // Background write to Supabase if authenticated
      if (user) {
        updateProgress(questionId, correct).catch(() => {
          // Non-fatal — store already updated optimistically
        });
      }
    },
    [user],
  );

  // ---------------------------------------------------------------------------
  // Derived helpers
  // ---------------------------------------------------------------------------

  function getDotState(questionId: string, currentId: string): DotState {
    if (questionId === currentId) return "active";
    const p = progress[questionId];
    if (!p) return "unseen";
    if (p.correct) return "correct";
    return "seen";
  }

  function getModuleStatus(
    moduleId: ModuleId,
    isPremium: boolean,
  ): ModuleStatus {
    const moduleQuestions = questionsByModule(moduleId);
    const seen = moduleQuestions.filter((q) => progress[q.id]?.seen);
    const mod = modules.find((m) => m.id === moduleId);

    if (seen.length === 0) return "not_started";
    if (seen.length === moduleQuestions.length) return "complete";
    if (!isPremium && !mod?.alwaysFree && seen.length >= FREE_PER_MODULE)
      return "preview_done";
    return "in_progress";
  }

  function getReviewQueue(): Question[] {
    return allQuestions.filter((q) => {
      const p = progress[q.id];
      return p?.seen && !p?.correct;
    });
  }

  function getModuleSeen(moduleId: ModuleId): number {
    return questionsByModule(moduleId).filter((q) => progress[q.id]?.seen)
      .length;
  }

  function getTotalSeen(): number {
    return allQuestions.filter((q) => progress[q.id]?.seen).length;
  }

  function isPreviewComplete(isPremium: boolean): boolean {
    if (isPremium) return false;
    const gatedModuleIds = modules
      .filter((m) => !m.alwaysFree)
      .map((m) => m.id);
    return gatedModuleIds.every((id) => getModuleSeen(id) >= FREE_PER_MODULE);
  }

  function getCurrentQuestionIndex(moduleId: ModuleId): number {
    const moduleQuestions = questionsByModule(moduleId);
    const seenIds = new Set(
      moduleQuestions.filter((q) => progress[q.id]?.seen).map((q) => q.id),
    );
    const unseen = moduleQuestions.filter((q) => !seenIds.has(q.id));
    if (unseen.length === 0) return 0;
    return moduleQuestions.findIndex((q) => q.id === unseen[0].id);
  }

  return {
    progress,
    recordAnswer,
    getDotState,
    getModuleStatus,
    getReviewQueue,
    getModuleSeen,
    getTotalSeen,
    isPreviewComplete,
    getCurrentQuestionIndex,
  };
}
