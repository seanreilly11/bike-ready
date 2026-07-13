import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/cooldown";
import { captureServerEvent } from "@/lib/posthogServer";

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each pass can hit the Stripe API; throttle per user to protect the quota.
  if (isRateLimited(`verify:${user.id}`, 10_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_premium, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Already premium - nothing to do
  if (profile?.is_premium) {
    return NextResponse.json({ is_premium: true });
  }

  // Direct session check - covers a missed webhook, where no customer id has
  // been stored yet. The id comes from Stripe's success_url redirect and is
  // only trusted if the session's metadata names this user.
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.metadata?.supabase_user_id === user.id &&
        session.payment_status === "paid"
      ) {
        await supabaseAdmin
          .from("profiles")
          .update({
            is_premium: true,
            premium_since: new Date().toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_payment_id: session.payment_intent as string,
          })
          .eq("id", user.id);
        // Ground-truth revenue event: the webhook was missed, so fire it here.
        // The webhook guards on is_premium, so a late delivery won't double-count.
        await captureServerEvent(user.id, "purchase_completed", {
          amount_total: session.amount_total,
          currency: session.currency,
          stripe_payment_id: session.payment_intent,
        });
        return NextResponse.json({ is_premium: true });
      }
    } catch {
      // Unknown/foreign session id - fall through to the customer check
    }
  }

  // No Stripe customer yet - definitely not premium
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ is_premium: false });
  }

  // Check Stripe directly for a completed payment
  const payments = await stripe.paymentIntents.list({
    customer: profile.stripe_customer_id,
    limit: 5,
  });

  const hasPaid = payments.data.some((p) => p.status === "succeeded");

  if (hasPaid) {
    await supabaseAdmin
      .from("profiles")
      .update({ is_premium: true, premium_since: new Date().toISOString() })
      .eq("id", user.id);
  }

  return NextResponse.json({ is_premium: hasPaid });
}
