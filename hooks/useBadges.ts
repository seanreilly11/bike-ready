"use client";

import { useCallback } from "react";
import type { ModuleId } from "@/types";
import { createClient } from "@/lib/supabase";
import badgeDefinitions from "@/data/badges";
import { activeQuestions } from "@/hooks/useQuestions";
import { useAppStore } from "@/stores/appStore";
import { useUIStore } from "@/stores/uiStore";

export function useBadges() {
  const supabase = createClient();
  const user = useAppStore((s) => s.user);
  const earned = useAppStore((s) => s.earned);
  const newBadgeId = useUIStore((s) => s.newBadgeId);

  const checkModuleBadge = useCallback(
    async (moduleId: ModuleId) => {
      const badge = badgeDefinitions.find((b) => b.moduleId === moduleId);
      if (!badge || earned.includes(badge.id)) return;

      const progress = useAppStore.getState().progress;
      const moduleQuestions = activeQuestions.filter(
        (q) => q.module === moduleId,
      );
      const allSeen = moduleQuestions.every((q) => progress[q.id]?.seen);
      if (!allSeen) return;

      // Award badge locally
      useAppStore.getState().earnBadge(badge.id);
      useUIStore.getState().showBadge(badge.id);

      // Persist to Supabase if authenticated
      if (user) {
        await supabase
          .from("badges")
          .insert({ user_id: user.id, badge_id: badge.id })
          .select()
          .single();
      }
    },
    [user, earned, supabase],
  );

  const dismissNewBadge = useCallback(() => {
    useUIStore.getState().clearBadge();
  }, []);

  const newBadge = badgeDefinitions.find((b) => b.id === newBadgeId) ?? null;

  return {
    earnedIds: new Set(earned),
    newBadge,
    checkModuleBadge,
    dismissNewBadge,
  };
}
