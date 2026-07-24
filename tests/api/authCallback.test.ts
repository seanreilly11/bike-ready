import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { exchangeCodeForSession } })),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
  });

  it("hands an upgrade sign-in off to the client overlay via /learn?checkout=1", async () => {
    // Overlay checkout is client-side, so the callback no longer creates a
    // checkout session server-side - it lands on /learn with a flag the client
    // picks up to open the Paddle overlay.
    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/checkout",
    );
    const res = await GET(req);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/learn?checkout=1",
    );
  });

  it("redirects to the requested next path after a successful exchange", async () => {
    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/review",
    );
    const res = await GET(req);
    expect(res.headers.get("location")).toBe("http://localhost:3000/review");
  });

  it("falls back to /learn for a disallowed next path", async () => {
    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/evil",
    );
    const res = await GET(req);
    expect(res.headers.get("location")).toBe("http://localhost:3000/learn");
  });

  it("redirects to /learn?auth_error=1 when the code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "bad code" } });
    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/checkout",
    );
    const res = await GET(req);
    expect(res.headers.get("location")).toContain("auth_error=1");
  });
});
