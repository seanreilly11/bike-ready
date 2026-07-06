"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getStoredVariant, HERO_COPY_TEST } from "@/lib/abTest";
import fetchProgress from "@/lib/queries/fetchProgress";
import fetchBadges from "@/lib/queries/fetchBadges";
import updateProgress from "@/lib/mutations/updateProgress";
import persistBadge from "@/lib/mutations/persistBadge";
import { progressToUpload } from "@/lib/utils/progress";
import type { LocalProgress } from "@/types";

const LEGACY_STORAGE_KEY = "progress";
const SIGNUP_TRACKED_KEY = "signup_tracked";

// First-ever sign-in: with magic-link auth, email_confirmed_at is stamped the
// moment the first link is clicked - the same moment last_sign_in_at is first
// set, so the two coincide only on that first sign-in. Returning logins
// advance last_sign_in_at past it. (Comparing against created_at instead
// would miss anyone who opened the email late: created_at is when the link
// was requested, not clicked.) Exported for tests.
export function isFreshSignup(user: User): boolean {
  const confirmedAt = user.email_confirmed_at ?? user.confirmed_at;
  if (!confirmedAt || !user.last_sign_in_at) return false;
  const confirmed = new Date(confirmedAt).getTime();
  const lastSignIn = new Date(user.last_sign_in_at).getTime();
  return Math.abs(lastSignIn - confirmed) < 60_000;
}

// Two-way sync with Supabase: upload local answers the server doesn't have
// (progress made before this sign-in), then hydrate the store with the server
// rows. hydrateProgress merges, so neither side's answers are lost.
// Returns how many local answers were uploaded.
async function syncProgressWithServer(): Promise<number> {
  const data = await fetchProgress();
  if (!data) return 0;
  const server: LocalProgress = {};
  for (const row of data) {
    server[row.question_id] = { seen: row.seen, correct: row.correct };
  }
  const local = useAppStore.getState().progress;
  const uploads = progressToUpload(local, server);
  if (uploads.length > 0) {
    // Best-effort: a failed upload keeps its answer in the local store and is
    // retried on the next sync.
    await Promise.allSettled(
      uploads.map(({ questionId, correct }) =>
        updateProgress(questionId, correct),
      ),
    );
  }
  useAppStore.getState().hydrateProgress(server);
  return uploads.length;
}

// Same two-way sync for badges: push locally-earned badges the server is
// missing, then hydrate the store with the server's list.
async function syncBadgesWithServer(): Promise<void> {
  const serverBadges = await fetchBadges();
  if (!serverBadges) return;
  const local = useAppStore.getState().earned;
  const missing = local.filter((id) => !serverBadges.includes(id));
  if (missing.length > 0) {
    await Promise.allSettled(missing.map((id) => persistBadge(id)));
  }
  for (const id of serverBadges) {
    useAppStore.getState().earnBadge(id);
  }
}

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
  const { track, identify } = useAnalytics();

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
        try {
          await syncProgressWithServer();
          await syncBadgesWithServer();
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

        // Link the anonymous PostHog person to the authenticated user so
        // pre-signup events (cta_clicked, ab_variant_assigned) join the account.
        identify(sessionUser.id);

        // Fire once on first-ever sign-in so the hero variant → account funnel
        // has a clean conversion event. localStorage guards against repeat fires.
        if (
          isFreshSignup(sessionUser) &&
          localStorage.getItem(SIGNUP_TRACKED_KEY) !== "true"
        ) {
          localStorage.setItem(SIGNUP_TRACKED_KEY, "true");
          track("account_created", {
            hero_variant: getStoredVariant(HERO_COPY_TEST),
          });
        }

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

        // Upload pre-signup progress and badges, then hydrate from the server
        try {
          const uploaded = await syncProgressWithServer();
          if (uploaded > 0) {
            track("progress_migrated", { questions_count: uploaded });
          }
          await syncBadgesWithServer();
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
  }, [fetchProfile, supabase.auth, verifyPremium, track, identify]);

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
