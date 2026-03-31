// Validates required environment variables at startup.
// Called from next.config.ts so it runs on every dev/build start.
// Throws immediately if anything is missing — fail loudly, not silently.

const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    // 'STRIPE_SECRET_KEY',
    // 'STRIPE_WEBHOOK_SECRET',
    // 'NEXT_PUBLIC_STRIPE_PRICE_ID',
    // "NEXT_PUBLIC_POSTHOG_KEY",
] as const;

export function validateEnv() {
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nCopy .env.local.example → .env.local and fill in the values.`,
        );
    }
}
