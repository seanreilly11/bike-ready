import { describe, it, expect, vi, afterEach } from "vitest";
import saveTestResult from "@/lib/mutations/saveTestResult";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saveTestResult", () => {
  it("POSTs score and answers to /api/test-results", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await saveTestResult(85, { q1: "a" });

    expect(fetchMock).toHaveBeenCalledWith("/api/test-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score_pct: 85, answers: { q1: "a" } }),
    });
  });

  it("throws on an error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "boom" }, { status: 500 })),
    );
    await expect(saveTestResult(85, { q1: "a" })).rejects.toThrow();
  });
});
