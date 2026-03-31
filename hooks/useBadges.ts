"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import type { Badge, LocalProgress, ModuleId } from "@/types";
import { createClient } from "@/lib/supabase";
import badgeDefinitions from "@/data/badges";
import { activeQuestions } from "@/hooks/useQuestions";

export function useBadges(user: User | null) {
    const supabase = createClient();
    const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
    const [newBadge, setNewBadge] = useState<Badge | null>(null);

    // Load earned badges from Supabase
    useEffect(() => {
        if (!user) return;
        supabase
            .from("badges")
            .select("badge_id")
            .eq("user_id", user.id)
            .then(({ data }) => {
                if (data) setEarnedIds(new Set(data.map((r) => r.badge_id)));
            });
    }, [user, supabase]);

    // Check whether a module badge should be awarded after an answer
    const checkModuleBadge = useCallback(
        async (moduleId: ModuleId, progress: LocalProgress) => {
            if (!user) return;

            const badge = badgeDefinitions.find((b) => b.moduleId === moduleId);
            if (!badge || earnedIds.has(badge.id)) return;

            const moduleQuestions = activeQuestions.filter(
                (q) => q.module === moduleId,
            );
            const allSeen = moduleQuestions.every((q) => progress[q.id]?.seen);
            if (!allSeen) return;

            // Award badge
            const { error } = await supabase
                .from("badges")
                .insert({ user_id: user.id, badge_id: badge.id })
                .select()
                .single();

            if (!error) {
                setEarnedIds((prev) => new Set([...prev, badge.id]));
                setNewBadge(badge);
            }
        },
        [user, earnedIds, supabase],
    );

    const dismissNewBadge = useCallback(() => setNewBadge(null), []);

    return { earnedIds, newBadge, checkModuleBadge, dismissNewBadge };
}
