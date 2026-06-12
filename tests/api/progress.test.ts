import { describe, it, expect, vi, beforeEach } from "vitest";
import { activeQuestions } from "@/hooks/useQuestions";

const { getUser, rpc } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    rpc,
  })),
}));

vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));

import { POST } from "@/app/api/progress/route";
import type { NextRequest } from "next/server";

const validId = activeQuestions[0].id;

function postRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/progress", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/progress", () => {
  beforeEach(() => {
    getUser.mockReset();
    rpc.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(postRequest({ question_id: validId, correct: true }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid body", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await POST(postRequest({ question_id: 123, correct: "yes" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an unknown question id", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await POST(postRequest({ question_id: "not_a_real_q", correct: true }));
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls the RPC without a user id and returns 200 on success", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    rpc.mockResolvedValue({ error: null });
    const res = await POST(postRequest({ question_id: validId, correct: true }));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("upsert_question_progress", {
      p_question_id: validId,
      p_correct: true,
    });
  });

  it("returns 500 when the RPC errors", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    rpc.mockResolvedValue({ error: { message: "boom" } });
    const res = await POST(postRequest({ question_id: validId, correct: false }));
    expect(res.status).toBe(500);
  });
});
