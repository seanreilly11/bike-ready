"use client";

import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePaddle } from "@/hooks/usePaddle";
import { startCheckoutAction } from "@/lib/actions/billing";
import { createClient } from "@/lib/supabase";
import { logError } from "@/lib/logger";

export function useUnlock(onClose?: () => void) {
  const { refreshPremiumStatus } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const setCheckoutError = useUIStore((s) => s.setCheckoutError);
  const { track } = useAnalytics();
  const paddle = usePaddle();

  return useCallback(async () => {
    setCheckoutError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Auth-first: a purchase must bind to an account.
    if (!user) {
      onClose?.();
      openAuth("upgrade");
      return;
    }

    try {
      const intent = await startCheckoutAction();
      if ("alreadyPremium" in intent) {
        await refreshPremiumStatus();
        track("gate_converted", {});
        onClose?.();
        return;
      }
      if (!paddle) throw new Error("Paddle.js not ready");
      track("checkout_started", {});
      // Email prefills automatically from the server-created customer record;
      // opening by customer id only (never {id} AND {email}) is the trust boundary.
      paddle.Checkout.open({
        items: [{ priceId: intent.priceId, quantity: 1 }],
        customer: { id: intent.customerId },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          successUrl: `${window.location.origin}/learn?upgraded=true`,
        },
      });
      onClose?.();
    } catch (err) {
      logError("useUnlock", err);
      setCheckoutError("Couldn't start checkout. Please try again.");
    }
  }, [refreshPremiumStatus, openAuth, onClose, track, setCheckoutError, paddle]);
}
