import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateEnv } from "@/lib/validateEnv";

const BASE_VARS: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk",
  SUPABASE_SECRET_KEY: "sk",
  NEXT_PUBLIC_SUPABASE_REDIRECT_URL: "http://localhost:3000",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_POSTHOG_KEY: "ph",
  NEXT_PUBLIC_SENTRY_DSN: "dsn",
  SENTRY_ORG: "org",
  SENTRY_PROJECT: "proj",
  SENTRY_AUTH_TOKEN: "tok",
};

const STRIPE_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PRICE_ID",
] as const;

function stubProductionEnv(extra: Record<string, string> = {}) {
  vi.stubEnv("VERCEL_ENV", "production");
  for (const [k, v] of Object.entries({ ...BASE_VARS, ...extra })) {
    vi.stubEnv(k, v);
  }
}

describe("validateEnv premium requirements", () => {
  beforeEach(() => {
    // Ensure Stripe vars from the developer's real .env don't leak in
    for (const k of STRIPE_VARS) vi.stubEnv(k, "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in production when premium is enabled but Stripe vars are missing", () => {
    stubProductionEnv({ NEXT_PUBLIC_PREMIUM_ENABLED: "true" });
    expect(() => validateEnv()).toThrowError(/STRIPE_SECRET_KEY/);
  });

  it("passes in production when premium is enabled and Stripe vars are set", () => {
    stubProductionEnv({
      NEXT_PUBLIC_PREMIUM_ENABLED: "true",
      STRIPE_SECRET_KEY: "sk",
      STRIPE_WEBHOOK_SECRET: "whsec",
      NEXT_PUBLIC_STRIPE_PRICE_ID: "price",
    });
    expect(() => validateEnv()).not.toThrow();
  });

  it("does not require Stripe vars in production when premium is disabled", () => {
    stubProductionEnv({ NEXT_PUBLIC_PREMIUM_ENABLED: "false" });
    expect(() => validateEnv()).not.toThrow();
  });

  it("does not require Stripe vars outside production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const [k, v] of Object.entries(BASE_VARS)) vi.stubEnv(k, v);
    vi.stubEnv("NEXT_PUBLIC_PREMIUM_ENABLED", "true");
    expect(() => validateEnv()).not.toThrow();
  });
});
