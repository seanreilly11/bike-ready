import "server-only";
import { logError } from "@/lib/logger";

// Server-side PostHog capture for ground-truth events (e.g. completed
// payments from the Stripe webhook) that can't rely on the browser still
// being open. Uses the public ingestion endpoint - no extra dependency.
// Never throws: analytics must not break the caller.
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key) return;

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: "CycleDutch-server" },
      }),
    });
  } catch (err) {
    logError("captureServerEvent", err);
  }
}
