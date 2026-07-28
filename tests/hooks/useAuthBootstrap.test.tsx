import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type Callback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void | Promise<void>;

let capturedCallback: Callback | null = null;
let onAuthStateChangeCalls = 0;
let profileFetches = 0;
let releaseDataCalls: () => void = () => {};

// Stands in for auth-js's lock: while the client is initializing, every
// supabase-js data call awaits initializePromise, so nothing resolves until
// the auth state change callback has returned. A callback that awaits one of
// these deadlocks the client - the real symptom being auth calls that hang
// forever.
function gatedProfile(): Promise<{ data: null; error: null }> {
  profileFetches += 1;
  return new Promise((resolve) => {
    const prev = releaseDataCalls;
    releaseDataCalls = () => {
      prev();
      resolve({ data: null, error: null });
    };
  });
}

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockImplementation((cb: Callback) => {
        onAuthStateChangeCalls += 1;
        capturedCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => gatedProfile()),
    }),
  }),
}));

import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { useAuth } from "@/hooks/useAuth";

const session = {
  user: { id: "user-1", email: "rider@example.com" },
} as unknown as Session;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useAuthBootstrap", () => {
  beforeEach(() => {
    capturedCallback = null;
    onAuthStateChangeCalls = 0;
    profileFetches = 0;
    releaseDataCalls = () => {};
  });

  // auth-js runs subscriber callbacks INSIDE its auth lock and awaits them
  // before releasing it, so a callback that awaits a Supabase call can never
  // finish: that call is itself waiting on the lock.
  it("returns from the auth callback without waiting on Supabase calls", async () => {
    renderHook(() => useAuthBootstrap());
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    let settled = false;
    void Promise.resolve(capturedCallback!("SIGNED_IN", session)).then(() => {
      settled = true;
    });

    await flush();
    await flush();

    expect(settled).toBe(true);
    expect(profileFetches).toBe(1);

    releaseDataCalls();
  });

  // A restored session arrives twice - INITIAL_SESSION for the new subscriber
  // and SIGNED_IN from _recoverAndRefresh - and each sync writes back every
  // local answer the server is missing. Syncing per event doubled that traffic.
  it("syncs a restored session once, not per event", async () => {
    renderHook(() => useAuthBootstrap());
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!("INITIAL_SESSION", session);
    capturedCallback!("SIGNED_IN", session);

    await flush();
    await flush();

    expect(profileFetches).toBe(1);

    releaseDataCalls();
  });

  // Nine components call useAuth() - one only wants isPremium. Each extra
  // subscription used to bring a full server sync with it.
  it("is the only thing that subscribes to auth changes", async () => {
    renderHook(() => useAuthBootstrap());
    await waitFor(() => expect(onAuthStateChangeCalls).toBe(1));

    renderHook(() => useAuth());
    renderHook(() => useAuth());
    await flush();

    expect(onAuthStateChangeCalls).toBe(1);
  });
});
