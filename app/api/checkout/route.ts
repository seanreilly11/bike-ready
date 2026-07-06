import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/cooldown";
import { logError } from "@/lib/logger";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Throttle Stripe Checkout session creation per user.
  if (isRateLimited(`checkout:${user.id}`, 5_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  // Check if already premium - don't create a duplicate session
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  if (profile?.is_premium) {
    return Response.json({ alreadyPremium: true });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL!;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        { price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 },
      ],
      success_url: `${baseUrl}/learn?upgraded=true`,
      cancel_url: `${baseUrl}/learn`,
      customer_email: user.email,
      // Payment-mode sessions don't create a Customer by default; without one
      // the webhook stores no stripe_customer_id and /api/premium/verify can
      // never reconcile a missed webhook.
      customer_creation: "always",
      metadata: { supabase_user_id: user.id },
    });
    return Response.json({ url: session.url });
  } catch (err) {
    logError("checkout POST", err);
    return new Response("Checkout failed", { status: 500 });
  }
}
