// Validates required environment variables at startup.
// Called from next.config.ts so it runs on every dev/build start.
// Throws immediately if anything is missing - fail loudly, not silently.

const requiredAlways = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_REDIRECT_URL",
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
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PRICE_ID",
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
}
