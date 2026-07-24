import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/cooldown";
import { getPaddle } from "@/lib/paddle/paddle";
import {
  isUserPremium,
  getProviderCustomerId,
  grantPremiumByProviderCustomerId,
} from "@/lib/paddle/data";
import { captureServerEvent } from "@/lib/posthogServer";

// Reconciles premium against Paddle — covers a missed webhook. Lists the
// customer's completed transactions and grants if any exist. The webhook guards
// on the is_premium transition, so a late delivery won't double-count.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each pass can hit the Paddle API; throttle per user to protect the quota.
  if (isRateLimited(`verify:${user.id}`, 10_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (await isUserPremium(user.id)) {
    return NextResponse.json({ is_premium: true });
  }

  const customerId = await getProviderCustomerId(user.id);
  if (!customerId) {
    return NextResponse.json({ is_premium: false });
  }

  // Find a completed one-time transaction for this customer.
  for await (const txn of getPaddle().transactions.list({
    customerId: [customerId],
    status: ["completed"],
  })) {
    const result = await grantPremiumByProviderCustomerId(customerId, {
      transactionId: txn.id,
    });
    if (result.granted && result.userId) {
      await captureServerEvent(result.userId, "purchase_completed", {
        amount_total: txn.details?.totals?.total ?? null,
        currency: txn.currencyCode ?? null,
        transaction_id: txn.id,
      });
    }
    return NextResponse.json({ is_premium: true });
  }

  return NextResponse.json({ is_premium: false });
}
