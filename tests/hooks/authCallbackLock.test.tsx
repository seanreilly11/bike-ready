import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type Callback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void | Promise<void>;

let capturedCallback: Callback | null = null;
let releaseDataCalls: () => void = () => {};
let dataCallStarted = false;

// Stands in for auth-js's lock: while the client is initializing, every
// supabase-js data call awaits initializePromise, so nothing resolves until
// the auth state change callback has returned. A callback that awaits one of
// these deadlocks the whole client - the real symptom being a sign-out that
// hangs forever.
function gatedCall<T>(value: T): Promise<T> {
  dataCallStarted = true;
  return new Promise<T>((resolve) => {
    const prev = releaseDataCalls;
    releaseDataCalls = () => {
      prev();
      resolve(value);
    };
  });
}

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockImplementation((cb: Callback) => {
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
      single: vi.fn(() => gatedCall({ data: null, error: null })),
    }),
  }),
}));

import { useAuth } from "@/hooks/useAuth";

const session = {
  user: { id: "user-1", email: "rider@example.com" },
} as unknown as Session;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("onAuthStateChange callback", () => {
  beforeEach(() => {
    capturedCallback = null;
    releaseDataCalls = () => {};
    dataCallStarted = false;
  });

  // auth-js runs subscriber callbacks INSIDE its auth lock and awaits them
  // before releasing it, so a callback that awaits a Supabase call can never
  // finish: that call is itself waiting on the lock. Every later auth call -
  // sign-out included - then queues behind a lock that is never released.
  it("returns without waiting on Supabase calls", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(capturedCallback).not.toBeNull();

    let settled = false;
    void Promise.resolve(capturedCallback!("SIGNED_IN", session)).then(() => {
      settled = true;
    });

    await flush();
    await flush();

    expect(settled).toBe(true);
    // The sync itself must still have been kicked off, just not awaited here.
    expect(dataCallStarted).toBe(true);

    releaseDataCalls();
  });
});
