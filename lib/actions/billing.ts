"use server";
import { createClient } from "@/lib/supabase/server";
import { isUserPremium } from "@/lib/paddle/data";
import { getOrCreateProviderCustomer } from "@/lib/paddle/checkout";

export interface CheckoutIntent {
  customerId: string;
  priceId: string;
}

// Signed-in only. Establishes the customer mapping server-side and returns the
// customer + price the client overlay should open. The client never chooses the
// customer id — the trust boundary.
export async function startCheckoutAction(): Promise<
  { alreadyPremium: true } | CheckoutIntent
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (await isUserPremium(user.id)) return { alreadyPremium: true };

  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
  if (!priceId) throw new Error("Billing is not configured");

  const customerId = await getOrCreateProviderCustomer(user.id, user.email ?? "");
  return { customerId, priceId };
}
