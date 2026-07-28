// Validates required environment variables at startup.
// Called from next.config.ts so it runs on every dev/build start.
// Throws immediately if anything is missing - fail loudly, not silently.

const requiredAlways = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

// Analytics and error monitoring must be configured on the production
// deploy, but local dev and CI can run without them.
const requiredInProduction = [
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
] as const;

// Required only when the premium feature flag is on in production: checkout
// and the webhook crash at runtime without them, so fail the build instead.
const requiredForPremium = [
  "PADDLE_ENV",
  "PADDLE_API_KEY",
  "PADDLE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_PADDLE_PRICE_ID",
  "NEXT_PUBLIC_PADDLE_ENV",
  "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
] as const;

export function validateEnv() {
  const isProduction = process.env.VERCEL_ENV === "production";
  const premiumEnabled = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === "true";
  const required: readonly string[] = [
    ...requiredAlways,
    ...(isProduction ? requiredInProduction : []),
    ...(isProduction && premiumEnabled ? requiredForPremium : []),
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nCopy .env.local.example → .env.local and fill in the values.`,
    );
  }

  // Server and client must target the same Paddle environment. A split (server
  // production, client sandbox) would create charges the production webhook
  // never sees. Only checked when both are present.
  const serverEnv = process.env.PADDLE_ENV;
  const clientEnv = process.env.NEXT_PUBLIC_PADDLE_ENV;
  if (serverEnv && clientEnv && serverEnv !== clientEnv) {
    throw new Error(
      `PADDLE_ENV ("${serverEnv}") and NEXT_PUBLIC_PADDLE_ENV ("${clientEnv}") must match.`,
    );
  }
}
