import { describe, it, expect, vi, afterEach } from "vitest";
import fetchBadges from "@/lib/queries/fetchBadges";
import persistBadge from "@/lib/mutations/persistBadge";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchBadges", () => {
  it("returns the earned badge ids", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          badges: [
            { badge_id: "badge_priority", earned_at: "2026-01-01" },
            { badge_id: "badge_signs", earned_at: "2026-01-02" },
          ],
        }),
      ),
    );
    expect(await fetchBadges()).toEqual(["badge_priority", "badge_signs"]);
  });

  it("returns null when unauthenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "Unauthorized" }, { status: 401 })),
    );
    expect(await fetchBadges()).toBeNull();
  });

  it("throws on server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "boom" }, { status: 500 })),
    );
    await expect(fetchBadges()).rejects.toThrow();
  });
});

describe("persistBadge", () => {
  it("POSTs the badge id to /api/badges", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await persistBadge("badge_master");

    expect(fetchMock).toHaveBeenCalledWith("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: "badge_master" }),
    });
  });

  it("throws on error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "boom" }, { status: 500 })),
    );
    await expect(persistBadge("badge_master")).rejects.toThrow();
  });
});
