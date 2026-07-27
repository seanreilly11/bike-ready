import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isFreshSignup } from "@/hooks/useAuth";

function makeUser(fields: Partial<User>): User {
  return { id: "u1", ...fields } as User;
}

describe("isFreshSignup", () => {
  it("detects a first sign-in even when the magic link is clicked late", () => {
    // Link requested 10:00 (account row created), opened 10:07
    const user = makeUser({
      created_at: "2026-07-06T10:00:00Z",
      email_confirmed_at: "2026-07-06T10:07:00Z",
      last_sign_in_at: "2026-07-06T10:07:00Z",
    });
    expect(isFreshSignup(user)).toBe(true);
  });

  it("returns false for a returning login", () => {
    const user = makeUser({
      created_at: "2026-07-01T10:00:00Z",
      email_confirmed_at: "2026-07-01T10:07:00Z",
      last_sign_in_at: "2026-07-06T09:00:00Z",
    });
    expect(isFreshSignup(user)).toBe(false);
  });

  it("falls back to confirmed_at when email_confirmed_at is absent", () => {
    const user = makeUser({
      created_at: "2026-07-06T10:00:00Z",
      confirmed_at: "2026-07-06T10:07:00Z",
      last_sign_in_at: "2026-07-06T10:07:30Z",
    });
    expect(isFreshSignup(user)).toBe(true);
  });

  it("returns false when confirmation or sign-in timestamps are missing", () => {
    expect(
      isFreshSignup(makeUser({ created_at: "2026-07-06T10:00:00Z" })),
    ).toBe(false);
    expect(
      isFreshSignup(
        makeUser({
          created_at: "2026-07-06T10:00:00Z",
          email_confirmed_at: "2026-07-06T10:07:00Z",
        }),
      ),
    ).toBe(false);
  });
});
