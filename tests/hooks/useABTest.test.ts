import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useABTest } from "@/hooks/useABTest";

const mockTrack = vi.fn();

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: mockTrack, identify: vi.fn() }),
}));

// localStorage is reset after each test by tests/setup.ts

const VARIANTS = ["control", "variant_a", "variant_b"] as const;

describe("useABTest", () => {
  beforeEach(() => {
    mockTrack.mockClear();
  });

  // ── Core behaviour ─────────────────────────────────────────────────────────

  it("resolves to a valid variant from the provided list", async () => {
    localStorage.setItem("anon_id", "user-valid");
    const { result } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(VARIANTS).toContain(result.current);
  });

  it("returns the same variant on re-mount for the same user (stability)", async () => {
    localStorage.setItem("anon_id", "stable-user");

    const { result: r1 } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(r1.current).not.toBeNull());
    const first = r1.current;

    // Simulate navigating away and back (new hook instance, same localStorage)
    const { result: r2 } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(r2.current).not.toBeNull());

    expect(r2.current).toBe(first);
  });

  it("returns the pre-stored variant when one exists in localStorage", async () => {
    localStorage.setItem("ab_hero_copy", "variant_a");

    const { result } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current).toBe("variant_a");
  });

  it("still returns a valid variant when anon_id is absent (hashes empty seed)", async () => {
    // No anon_id, no stored assignment - empty seed still hashes deterministically
    // variants[0] is only the fallback on the server (typeof window === 'undefined')
    const { result } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(VARIANTS).toContain(result.current);
  });

  // ── Tracking ───────────────────────────────────────────────────────────────

  it("fires ab_variant_assigned on first-ever assignment", async () => {
    localStorage.setItem("anon_id", "new-user-track");
    const { result } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(mockTrack).toHaveBeenCalledOnce();
    expect(mockTrack).toHaveBeenCalledWith("ab_variant_assigned", {
      test: "hero_copy",
      variant: result.current,
    });
  });

  it("does NOT fire track event when variant was already stored", async () => {
    // Pre-assign - user is returning, not first assignment
    localStorage.setItem("ab_hero_copy", "control");

    const { result } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("track payload contains the actual variant that was assigned", async () => {
    localStorage.setItem("anon_id", "payload-check-user");
    const { result } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(result.current).not.toBeNull());

    const [, payload] = mockTrack.mock.calls[0];
    expect(payload.variant).toBe(result.current);
    expect(payload.test).toBe("hero_copy");
  });

  // ── Test isolation ─────────────────────────────────────────────────────────

  it("different test names return independent variants for the same user", async () => {
    localStorage.setItem("anon_id", "multi-test-user");

    const { result: r1 } = renderHook(() => useABTest("test_one", VARIANTS));
    const { result: r2 } = renderHook(() => useABTest("test_two", VARIANTS));

    await waitFor(() => expect(r1.current).not.toBeNull());
    await waitFor(() => expect(r2.current).not.toBeNull());

    // Each stored under its own key
    expect(localStorage.getItem("ab_test_one")).toBe(r1.current);
    expect(localStorage.getItem("ab_test_two")).toBe(r2.current);
  });

  it("persists the assigned variant to localStorage", async () => {
    localStorage.setItem("anon_id", "persist-user");
    const { result } = renderHook(() => useABTest("hero_copy", VARIANTS));
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(localStorage.getItem("ab_hero_copy")).toBe(result.current);
  });
});
