"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { logError } from "@/lib/logger";
import { useAppStore } from "@/stores/appStore";

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

// Where both sign-in methods land. "upgrade" routes through the /checkout
// marker so the callback can hand off to the Paddle overlay.
function callbackUrl(reason: "save_progress" | "upgrade"): string {
  const next = reason === "upgrade" ? "/checkout" : "/learn";
  return `${window.location.origin}/auth/callback?next=${next}`;
}

/**
 * Reader for auth state plus the sign-in/sign-out actions. Deliberately has no
 * effects: every side effect lives in `useAuthBootstrap`, mounted once. Adding
 * one here multiplies it by the number of components calling this hook.
 */
export function useAuth(): {
  user: User | null;
  isPremium: boolean;
  isLoading: boolean;
  sendMagicLink: (email: string, reason: "save_progress" | "upgrade") => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signInWithGoogle: (reason: "save_progress" | "upgrade") => Promise<void>;
  signOut: () => Promise<void>;
  refreshPremiumStatus: () => Promise<void>;
} {
  const supabase = createClient();
  const router = useRouter();

  const user = useAppStore((s) => s.user);
  const isPremium = useAppStore((s) => s.isPremium);
  const isLoading = useAppStore((s) => s.authLoading);

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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl(reason) },
      });
      if (error) throw error;
    },
    [supabase.auth],
  );

  // The same signInWithOtp call mints both a link and a 6-digit token; which of
  // the two the user sees is decided by the email template. Verifying the token
  // here signs the user in IN THIS TAB - the whole point of the code path, since
  // no email client can be made to open its links in the tab that asked.
  // type: "email" covers both first-ever sign-up and returning sign-in, matching
  // signInWithOtp's own dual behaviour.
  const verifyEmailOtp = useCallback(
    async (email: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) throw error;
    },
    [supabase.auth],
  );

  // Same callback target as the magic link, so the upgrade hand-off
  // (/checkout -> /learn?checkout=1) behaves identically for both methods.
  // OAuth uses the same PKCE code exchange, so /auth/callback needs no changes.
  const signInWithGoogle = useCallback(
    async (reason: "save_progress" | "upgrade") => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl(reason) },
      });
      if (error) throw error;
    },
    [supabase.auth],
  );

  const signOut = useCallback(async () => {
    // scope: "local" ends THIS session. The default, "global", revokes the
    // refresh token on every device the user is signed in on - not what a
    // sign-out button means, and it makes success depend on a round-trip.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      // auth-js returns early WITHOUT clearing the local session for any error
      // that isn't 401/403/404, so the user is still signed in and no
      // SIGNED_OUT event fires. Swallowing this made the button look like it
      // did nothing; the caller needs to be able to tell the user.
      logError("signOut", error);
      throw error;
    }
    // Server components read the session from cookies, so they keep rendering
    // the authenticated view until the router re-fetches them.
    router.refresh();
  }, [supabase.auth, router]);

  return {
    user,
    isPremium,
    isLoading,
    sendMagicLink,
    verifyEmailOtp,
    signInWithGoogle,
    signOut,
    refreshPremiumStatus,
  };
}
