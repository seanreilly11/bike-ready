import { logError } from "@/lib/logger";

// Awards a badge server-side. The route treats an already-earned badge as
// success, so this is safe to retry.
const persistBadge = async (badgeId: string): Promise<void> => {
  const res = await fetch("/api/badges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ badge_id: badgeId }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const err = new Error(data.error || "Failed to persist badge");
    logError("persistBadge", err);
    throw err;
  }
};

export default persistBadge;
