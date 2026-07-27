import { describe, it, expect, vi, beforeEach } from "vitest";
import { activeQuestions } from "@/hooks/useQuestions";

const { getUser, insert } = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => ({ insert })),
  })),
}));

vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));

import { POST } from "@/app/api/test-results/route";
import type { NextRequest } from "next/server";

const q1 = activeQuestions[0].id;
const q2 = activeQuestions[1].id;

function postRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/test-results", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/test-results", () => {
  beforeEach(() => {
    getUser.mockReset();
    insert.mockReset().mockResolvedValue({ error: null });
  });

  it("returns 401 when not authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(postRequest({ score_pct: 90, answers: { [q1]: "a" } }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when score_pct is not an integer 0-100", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    for (const bad of [-1, 101, 55.5, "90", null]) {
      const res = await POST(postRequest({ score_pct: bad, answers: {} }));
      expect(res.status).toBe(400);
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns 400 when answers reference unknown question ids", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await POST(
      postRequest({ score_pct: 90, answers: { not_a_real_q: "a" } }),
    );
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts the result with passed derived from the pass mark", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await POST(
      postRequest({ score_pct: 80, answers: { [q1]: "a", [q2]: "b" } }),
    );
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith({
      user_id: "u1",
      score_pct: 80,
      passed: true,
      answers: { [q1]: "a", [q2]: "b" },
    });
  });

  it("derives passed false below the pass mark", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    await POST(postRequest({ score_pct: 79, answers: { [q1]: "a" } }));
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false }),
    );
  });

  it("returns 500 when the insert fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    insert.mockResolvedValue({ error: { message: "boom" } });
    const res = await POST(postRequest({ score_pct: 90, answers: { [q1]: "a" } }));
    expect(res.status).toBe(500);
  });
});
