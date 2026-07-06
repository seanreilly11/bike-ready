"use client";

import { useCallback } from "react";
import type { ModuleId } from "@/types";
import badgeDefinitions from "@/data/badges";
import { activeQuestions } from "@/hooks/useQuestions";
import { useAppStore } from "@/stores/appStore";
import { useUIStore } from "@/stores/uiStore";
import { useAnalytics } from "@/hooks/useAnalytics";
import persistBadge from "@/lib/mutations/persistBadge";

export function useBadges() {
  const user = useAppStore((s) => s.user);
  const earned = useAppStore((s) => s.earned);
  const newBadgeId = useUIStore((s) => s.newBadgeId);
  const { track } = useAnalytics();

  // Awards any badge by id: local store + toast + analytics, persisted
  // server-side when authenticated. Idempotent.
  const awardBadge = useCallback(
    async (badgeId: string) => {
      const badge = badgeDefinitions.find((b) => b.id === badgeId);
      if (!badge || useAppStore.getState().earned.includes(badgeId)) return;

      useAppStore.getState().earnBadge(badgeId);
      useUIStore.getState().showBadge(badgeId);
      track("badge_earned", { badge_id: badgeId });

      if (user) {
        await persistBadge(badgeId).catch(() => {
          // Non-fatal - the badge stays in the local store
        });
      }
    },
    [user, track],
  );

  const checkModuleBadge = useCallback(
    async (moduleId: ModuleId) => {
      const badge = badgeDefinitions.find((b) => b.moduleId === moduleId);
      if (!badge) return;

      const progress = useAppStore.getState().progress;
      const moduleQuestions = activeQuestions.filter(
        (q) => q.module === moduleId,
      );
      const allSeen = moduleQuestions.every((q) => progress[q.id]?.seen);
      if (!allSeen) return;

      await awardBadge(badge.id);
    },
    [awardBadge],
  );

  const dismissNewBadge = useCallback(() => {
    useUIStore.getState().clearBadge();
  }, []);

  const newBadge = badgeDefinitions.find((b) => b.id === newBadgeId) ?? null;

  return {
    earnedIds: new Set(earned),
    newBadge,
    awardBadge,
    checkModuleBadge,
    dismissNewBadge,
  };
}
