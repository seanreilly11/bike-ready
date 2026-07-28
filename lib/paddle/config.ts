// Reads server-only secrets, so importing this from a client component must
// fail the build rather than silently return false: Next replaces
// non-NEXT_PUBLIC env vars with undefined in the client bundle, which would
// make billing look unconfigured instead of erroring. Neutralized under
// Vitest via the alias in vitest.config.ts.
import "server-only";

// Billing configured only when both the server API key and the webhook signing
// secret are present. Guards the checkout action and webhook route.
export function isPaddleConfigured(): boolean {
  return !!(process.env.PADDLE_API_KEY && process.env.PADDLE_WEBHOOK_SECRET);
}
