// Validates required environment variables at startup.
// Called from next.config.ts so it runs on every dev/build start.
// Throws immediately if anything is missing - fail loudly, not silently.

const requiredAlways = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_REDIRECT_URL",
] as const;

// Payments, analytics and error monitoring must be configured on the
// production deploy, but local dev and CI can run without them.
const requiredInProduction = [
  // "STRIPE_SECRET_KEY",
  // "STRIPE_WEBHOOK_SECRET",
  // "NEXT_PUBLIC_STRIPE_PRICE_ID",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
] as const;

export function validateEnv() {
  const isProduction = process.env.VERCEL_ENV === "production";
  const required: readonly string[] = isProduction
    ? [...requiredAlways, ...requiredInProduction]
    : requiredAlways;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nCopy .env.local.example → .env.local and fill in the values.`,
    );
  }
}
