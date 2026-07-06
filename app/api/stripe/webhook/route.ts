import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { logError } from "@/lib/logger";
import { captureServerEvent } from "@/lib/posthogServer";

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;

    if (!userId) {
      return new NextResponse("No user id in metadata", { status: 400 });
    }

    // completed fires for async payment methods (SEPA, bank transfer) before
    // the money arrives; grant only once paid. The async_payment_succeeded
    // event re-delivers the same session with payment_status "paid".
    if (session.payment_status !== "paid") {
      return new NextResponse("OK - awaiting payment", { status: 200 });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        stripe_customer_id: session.customer as string,
        stripe_payment_id: session.payment_intent as string,
      })
      .eq("id", userId);

    if (error) {
      logError("stripe webhook", error);
      return new NextResponse("Database error", { status: 500 });
    }

    // Ground-truth revenue event - the browser may already be closed.
    await captureServerEvent(userId, "purchase_completed", {
      amount_total: session.amount_total,
      currency: session.currency,
      stripe_payment_id: session.payment_intent,
    });
  }

  return new NextResponse("OK", { status: 200 });
}
