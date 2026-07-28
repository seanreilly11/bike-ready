import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const signOutMock = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh }),
  useParams: () => ({}),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: signOutMock,
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

import { useAuth } from "@/hooks/useAuth";

describe("signOut", () => {
  beforeEach(() => {
    signOutMock.mockReset().mockResolvedValue({ error: null });
    refresh.mockClear();
  });

  it("ends only this session, not every device", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    // The default scope is "global", which revokes the refresh token on every
    // device the user is signed in on - not what a sign-out button means.
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("surfaces a failed sign-out instead of resolving silently", async () => {
    // auth-js returns early WITHOUT clearing the local session for any error
    // that isn't 401/403/404, so the user is still signed in. Swallowing this
    // is what made the button look like it did nothing.
    signOutMock.mockResolvedValue({ error: new Error("network down") });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.signOut()).rejects.toThrow();
  });

  it("refreshes server-rendered state after signing out", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    // Server components read the session from cookies; without this they keep
    // rendering the authenticated view until a manual reload.
    expect(refresh).toHaveBeenCalled();
  });
});
