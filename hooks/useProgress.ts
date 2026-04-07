"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  LocalProgress,
  ModuleId,
  Question,
  DotState,
  ModuleStatus,
} from "@/types";
import { FREE_PER_MODULE } from "@/types";
import { createClient } from "@/lib/supabase";
import { activeQuestions, useQuestions } from "@/hooks/useQuestions";
import modules from "@/data/modules";
import { useAuth } from "./useAuth";
import fetchProgress from "@/lib/queries/fetchProgress";
import updateProgress from "@/lib/mutations/updateProgress";

const STORAGE_KEY = "bikeready_progress";

function loadLocalProgress(): LocalProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalProgress) : {};
  } catch {
    return {};
  }
}

function saveLocalProgress(progress: LocalProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useProgress() {
  const { user } = useAuth();
  const supabase = createClient();
  const [progress, setProgress] = useState<LocalProgress>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const { questionsByModule } = useQuestions();
  // console.log({ user, progress });

  // Load on mount: Supabase if authenticated, localStorage otherwise
  useEffect(() => {
    setIsLoaded(false);
    async function load() {
      if (user) {
        const data = await fetchProgress();

        if (data) {
          const merged: LocalProgress = {};
          for (const row of data) {
            merged[row.question_id] = {
              seen: row.seen,
              correct: row.correct,
            };
          }
          setProgress(merged);
        }
      } else {
        setProgress(loadLocalProgress());
      }
      setIsLoaded(true);
    }
    load();
  }, [user, supabase]);

  // Record an answer: optimistic update + background write
  const recordAnswer = useCallback(
    async (questionId: string, correct: boolean) => {
      setProgress((prev) => {
        const existing = prev[questionId];
        const next: LocalProgress = {
          ...prev,
          [questionId]: {
            seen: true,
            correct: existing?.correct || correct,
          },
        };
        if (!user) saveLocalProgress(next);
        return next;
      });

      if (user) {
        await updateProgress(questionId, correct);
      }
    },
    [user, supabase],
  );

  // Migrate localStorage progress to Supabase after sign-up
  const migrateLocalProgress = useCallback(
    async (userId: string) => {
      const local = loadLocalProgress();
      const entries = Object.entries(local);
      if (entries.length === 0) return;

      await Promise.all(
        entries.map(([questionId, { correct }]) =>
          updateProgress(questionId, correct, userId),
        ),
      );

      localStorage.removeItem(STORAGE_KEY);
    },
    [supabase],
  );

  // Migrate localStorage progress to Supabase on sign-in
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await migrateLocalProgress(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [migrateLocalProgress, supabase.auth]);

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
    const moduleQuestions = activeQuestions.filter(
      (q) => q.module === moduleId,
    );
    const seen = moduleQuestions.filter((q) => progress[q.id]?.seen);
    const mod = modules.find((m) => m.id === moduleId);

    if (seen.length === 0) return "not_started";
    if (seen.length === moduleQuestions.length) return "complete";
    if (!isPremium && !mod?.alwaysFree && seen.length >= FREE_PER_MODULE) return "preview_done";
    return "in_progress";
  }

  function getReviewQueue(): Question[] {
    return activeQuestions.filter((q) => {
      const p = progress[q.id];
      return p?.seen && !p?.correct;
    });
  }

  function getModuleSeen(moduleId: ModuleId): number {
    return activeQuestions.filter(
      (q) => q.module === moduleId && progress[q.id]?.seen,
    ).length;
  }

  function getTotalSeen(): number {
    return activeQuestions.filter((q) => progress[q.id]?.seen).length;
  }

  function isPreviewComplete(isPremium: boolean): boolean {
    if (isPremium) return false;
    const gatedModuleIds = modules
      .filter((m) => !m.alwaysFree)
      .map((m) => m.id);
    return gatedModuleIds.every((id) => getModuleSeen(id) >= FREE_PER_MODULE);
  }

  function getCurrentQuestionIndex(moduleId: ModuleId): number {
    if (!user) return 0; // default to first question for unauthenticated users
    const moduleQuestions = questionsByModule(moduleId);
    const seenIds = new Set(
      moduleQuestions.filter((q) => progress[q.id]?.seen).map((q) => q.id),
    );
    const unseen = moduleQuestions.filter((q) => !seenIds.has(q.id));
    if (unseen.length === 0) return 0;
    const nextId = unseen[0].id;
    return moduleQuestions.findIndex((q) => q.id === nextId);
  }

  return {
    progress,
    isLoaded,
    recordAnswer,
    migrateLocalProgress,
    getDotState,
    getModuleStatus,
    getReviewQueue,
    getModuleSeen,
    getTotalSeen,
    isPreviewComplete,
    getCurrentQuestionIndex,
  };
}
