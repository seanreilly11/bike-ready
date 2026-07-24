// Per-key in-memory cooldown to protect upstream quotas (Paddle API) from
// scripted hammering. Not a security control and not shared across serverless
// instances - counters reset on cold start. That's acceptable here: the goal
// is to blunt abusive bursts, not to enforce an exact limit.

const lastSeen = new Map<string, number>();

// Returns true if the key is within its cooldown window (i.e. should be
// rejected). Records the timestamp when the call is allowed through.
export function isRateLimited(key: string, windowMs: number): boolean {
  const now = Date.now();
  const previous = lastSeen.get(key);

  if (previous !== undefined && now - previous < windowMs) {
    return true;
  }

  lastSeen.set(key, now);

  // Opportunistic cleanup so the map can't grow unbounded.
  if (lastSeen.size > 10_000) {
    for (const [k, t] of lastSeen) {
      if (now - t > windowMs) lastSeen.delete(k);
    }
  }

  return false;
}
