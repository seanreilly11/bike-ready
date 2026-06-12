"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import { useAnalytics } from "@/hooks/useAnalytics";
import fetchProgress from "@/lib/queries/fetchProgress";
import updateProgress from "@/lib/mutations/updateProgress";
import type { LocalProgress } from "@/types";

const LEGACY_STORAGE_KEY = "bikeready_progress";

function loadLegacyProgress(): LocalProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    // Legacy format is a flat Record<string, { seen, correct }>
    // Only treat it as legacy if it doesn't have the Zustand wrapper shape
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !("state" in (parsed as object))
    ) {
      return parsed as LocalProgress;
    }
    return {};
  } catch {
    return {};
  }
}

export function useAuth(): {
  user: User | null;
  isPremium: boolean;
  isLoading: boolean;
  sendMagicLink: (email: string, reason: "save_progress" | "upgrade") => Promise<void>;
  signOut: () => Promise<void>;
  refreshPremiumStatus: () => Promise<void>;
} {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const { track } = useAnalytics();

  const user = useAppStore((s) => s.user);
  const isPremium = useAppStore((s) => s.isPremium);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .single();
      return data?.is_premium ?? false;
    },
    [supabase],
  );

  const verifyPremium = useCallback(async () => {
    const res = await fetch("/api/premium/verify");
    if (!res.ok) return;
    const { is_premium } = (await res.json()) as { is_premium: boolean };
    if (is_premium) {
      useAppStore.getState().setPremium(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;
      const premium = sessionUser ? await fetchProfile(sessionUser.id) : false;
      useAppStore.getState().setUser(sessionUser);
      useAppStore.getState().setPremium(premium);
      if (sessionUser) {
        // Fetch Supabase progress and hydrate store
        try {
          const data = await fetchProgress();
          if (data) {
            const merged: LocalProgress = {};
            for (const row of data) {
              merged[row.question_id] = { seen: row.seen, correct: row.correct };
            }
            useAppStore.getState().hydrateProgress(merged);
          }
        } catch {
          // Non-fatal: store keeps whatever is in localStorage
        }
      }
      if (mounted) setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;

      if (event === "SIGNED_IN" && sessionUser) {
        const premium = await fetchProfile(sessionUser.id);
        useAppStore.getState().setUser(sessionUser);
        useAppStore.getState().setPremium(premium);

        // Migrate legacy localStorage progress to Supabase
        const legacy = loadLegacyProgress();
        const legacyEntries = Object.entries(legacy);
        if (legacyEntries.length > 0) {
          await Promise.all(
            legacyEntries.map(([questionId, { correct }]) =>
              updateProgress(questionId, correct),
            ),
          );
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          track('progress_migrated', { questions_count: legacyEntries.length });
        }

        // Fetch Supabase progress and hydrate store
        try {
          const data = await fetchProgress();
          if (data) {
            const merged: LocalProgress = {};
            for (const row of data) {
              merged[row.question_id] = { seen: row.seen, correct: row.correct };
            }
            useAppStore.getState().hydrateProgress(merged);
          }
        } catch {
          // Non-fatal
        }

        if (!premium) verifyPremium();
        if (mounted) setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        useAppStore.getState().setUser(null);
        useAppStore.getState().setPremium(false);
        useAppStore.getState().resetProgress();
        track('user_signed_out', {});
        if (mounted) setIsLoading(false);
      } else if (event === "INITIAL_SESSION") {
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase.auth, verifyPremium, track]);

  const refreshPremiumStatus = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) return;
    const premium = await fetchProfile(currentUser.id);
    useAppStore.getState().setPremium(premium);
  }, [supabase, fetchProfile]);

  const sendMagicLink = useCallback(
    async (email: string, reason: "save_progress" | "upgrade") => {
      const next = reason === "upgrade" ? "/checkout" : "/learn";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });
      if (error) throw error;
    },
    [supabase.auth],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  return { user, isPremium, isLoading, sendMagicLink, signOut, refreshPremiumStatus };
}
