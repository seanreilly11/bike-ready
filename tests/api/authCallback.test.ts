import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession, cookieGetAll } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  cookieGetAll: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { exchangeCodeForSession } })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: cookieGetAll })),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback checkout hand-off", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
    // Simulates the cookie store AFTER the exchange wrote session cookies.
    cookieGetAll.mockReset().mockReturnValue([
      { name: "sb-verifier", value: "stale" },
      { name: "sb-auth-token", value: "fresh-session" },
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards post-exchange cookies to /api/checkout, not the stale request header", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ url: "https://stripe.test/pay" }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/checkout",
      { headers: { cookie: "sb-verifier=stale" } },
    );
    const res = await GET(req);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/checkout",
      expect.objectContaining({
        method: "POST",
        headers: { cookie: "sb-verifier=stale; sb-auth-token=fresh-session" },
      }),
    );
    expect(res.headers.get("location")).toBe("https://stripe.test/pay");
  });

  it("redirects to checkout_failed when checkout is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unauthorized", { status: 401 })),
    );
    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=/checkout",
    );
    const res = await GET(req);
    expect(res.headers.get("location")).toContain("error=checkout_failed");
  });
});
