// Earned badge ids for the authenticated user, null when signed out.
const fetchBadges = async (): Promise<string[] | null> => {
  const res = await fetch("/api/badges");
  if (res.status === 401) return null;
  const data = (await res.json()) as {
    badges?: { badge_id: string; earned_at: string }[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Failed to load badges");
  }
  return (data.badges ?? []).map((b) => b.badge_id);
};

export default fetchBadges;
