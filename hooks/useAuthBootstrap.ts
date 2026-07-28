"use client";

import { useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getStoredVariant, HERO_COPY_TEST } from "@/lib/abTest";
import fetchProgress from "@/lib/queries/fetchProgress";
import fetchBadges from "@/lib/queries/fetchBadges";
import updateProgress from "@/lib/mutations/updateProgress";
import persistBadge from "@/lib/mutations/persistBadge";
import verifyPremiumStatus from "@/lib/mutations/verifyPremium";
import { progressToUpload } from "@/lib/utils/progress";
import { isFreshSignup } from "@/hooks/useAuth";
import type { LocalProgress } from "@/types";

const LEGACY_STORAGE_KEY = "progress";
const SIGNUP_TRACKED_KEY = "signup_tracked";

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

/**
 * Owns every auth side effect: the state-change subscription, the sign-in
 * sync, and the loading flag every screen gates on. Mounted exactly once, by
 * `AuthBootstrap` in the root layout - `useAuth` is a reader and must stay one.
 * Nine components call `useAuth`, one of them only for `isPremium`, and each
 * extra subscription used to drag a full server sync along with it.
 */
export function useAuthBootstrap(): void {
  const supabase = createClient();
  const { track, identify } = useAnalytics();
  // A restored session is announced twice - INITIAL_SESSION for this new
  // subscriber and SIGNED_IN from _recoverAndRefresh - and each sync writes
  // back every local answer the server is missing. Sync per user, not per
  // event; cleared on sign-out so the next account syncs again.
  const syncedUserId = useRef<string | null>(null);

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

  useEffect(() => {
    let mounted = true;
    const setAuthLoading = useAppStore.getState().setAuthLoading;

    // Post-sign-in work. Runs under try/finally: this resolving is what clears
    // authLoading, and every screen gates on that. Any throw in here (blocked
    // localStorage in private browsing, a failed upload) would otherwise leave
    // the whole app stuck on its loading state.
    const handleSignedIn = async (sessionUser: User) => {
      try {
        const premium = await fetchProfile(sessionUser.id);
        useAppStore.getState().setUser(sessionUser);
        useAppStore.getState().setPremium(premium);

        // Link the anonymous PostHog person to the authenticated user so
        // pre-signup events (cta_clicked, ab_variant_assigned) join the account.
        identify(sessionUser.id);

        // Fire once on first-ever sign-in so the hero variant → account funnel
        // has a clean conversion event. localStorage guards against repeat
        // fires; the try guards storage being unavailable, since analytics
        // must never block sign-in.
        try {
          if (
            isFreshSignup(sessionUser) &&
            localStorage.getItem(SIGNUP_TRACKED_KEY) !== "true"
          ) {
            localStorage.setItem(SIGNUP_TRACKED_KEY, "true");
            track("account_created", {
              hero_variant: getStoredVariant(HERO_COPY_TEST),
            });
          }
        } catch {
          // Storage blocked - skip the once-only guard, don't fail sign-in
        }

        // Migrate legacy localStorage progress to Supabase. allSettled, not
        // all: a single failed upload must not reject this handler - that
        // would skip the sync below. The legacy key is cleared only when
        // every row landed, so a partial failure is retried on the next
        // sign-in rather than silently dropped.
        const legacy = loadLegacyProgress();
        const legacyEntries = Object.entries(legacy);
        if (legacyEntries.length > 0) {
          const results = await Promise.allSettled(
            legacyEntries.map(([questionId, { correct }]) =>
              updateProgress(questionId, correct),
            ),
          );
          const uploaded = results.filter(
            (r) => r.status === "fulfilled",
          ).length;
          if (uploaded === legacyEntries.length) {
            try {
              localStorage.removeItem(LEGACY_STORAGE_KEY);
            } catch {
              // Storage blocked - re-migrating is idempotent (upsert by id)
            }
          }
          if (uploaded > 0) {
            track("progress_migrated", { questions_count: uploaded });
          }
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

        if (!premium) verifyPremiumStatus();
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    const syncSession = (sessionUser: User | null) => {
      if (!sessionUser) {
        syncedUserId.current = null;
        useAppStore.getState().setUser(null);
        setAuthLoading(false);
        return;
      }
      if (syncedUserId.current === sessionUser.id) {
        setAuthLoading(false);
        return;
      }
      syncedUserId.current = sessionUser.id;
      // auth-js runs subscribers INSIDE its auth lock and awaits them before
      // releasing it, while every supabase-js data call awaits that same lock
      // (PostgREST resolves its token through auth.getSession()). Awaiting a
      // Supabase call from in here therefore deadlocks the client for the life
      // of the page: on a reload with an existing session, _recoverAndRefresh
      // emits SIGNED_IN from inside the initialize lock, this handler waits on
      // a query, and that query waits on the lock this handler is holding.
      // Every later auth call then queues behind it - which is how sign-out
      // hung forever with no error (queued calls never reach the 5s
      // lock-acquire timeout). So: stay synchronous, and hand the work to a
      // task that runs once the lock is free.
      setTimeout(() => {
        if (!mounted) return;
        void handleSignedIn(sessionUser);
      }, 0);
    };

    // No getSession() call on mount: auth-js emits INITIAL_SESSION to every new
    // subscriber, and SIGNED_IN when it recovers a stored session, so both
    // arrivals land here. Fetching the session separately as well is what made
    // a session-restore load run the whole sync twice.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;

      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        syncSession(sessionUser);
      } else if (event === "SIGNED_OUT") {
        // Local-only work: safe to run inline, nothing here touches Supabase.
        syncedUserId.current = null;
        useAppStore.getState().setUser(null);
        useAppStore.getState().setPremium(false);
        useAppStore.getState().resetProgress();
        track("user_signed_out", {});
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase.auth, track, identify]);
}
