import { useAppStore } from "@/stores/appStore";

// Reconciles premium status against Stripe via /api/premium/verify - covers
// the race where the user returns from checkout before the webhook lands.
// Pass the session_id from Stripe's success redirect when available so a
// fully missed webhook can still be reconciled.
// Never throws; a failed check just leaves the store as-is.
const verifyPremium = async (sessionId?: string): Promise<boolean> => {
  try {
    const query = sessionId
      ? `?session_id=${encodeURIComponent(sessionId)}`
      : "";
    const res = await fetch(`/api/premium/verify${query}`);
    if (!res.ok) return false;
    const { is_premium } = (await res.json()) as { is_premium: boolean };
    if (is_premium) {
      useAppStore.getState().setPremium(true);
    }
    return is_premium;
  } catch {
    return false;
  }
};

export default verifyPremium;
