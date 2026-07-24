import { NextRequest, NextResponse } from "next/server";
import type { TransactionNotification } from "@paddle/paddle-node-sdk";
import { getPaddle } from "@/lib/paddle/paddle";
import { isPaddleConfigured } from "@/lib/paddle/config";
import { handlePaddleEvent, type PaddleEventLike } from "@/lib/paddle/webhook";
import { billingWriter } from "@/lib/paddle/data";
import { captureServerEvent } from "@/lib/posthogServer";

// Compile-time guard: the fields handlePaddleEvent reads off `event.data` must
// keep existing on the SDK's real webhook payload type, so an upstream rename
// breaks the build here rather than silently no-op'ing grants via the cast below.
// TransactionNotification (not the API-response Transaction entity) is what the
// Node SDK types transaction.* event `.data` as.
export type _TxnFieldGuard = Pick<
  TransactionNotification,
  "id" | "customerId" | "currencyCode" | "details"
>;

export async function POST(req: NextRequest) {
  if (!isPaddleConfigured()) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification needs the raw body, not parsed JSON.
  const rawBody = await req.text();
  let event: PaddleEventLike;
  try {
    event = (await getPaddle().webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature,
    )) as unknown as PaddleEventLike;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await handlePaddleEvent(event, billingWriter);
    // Ground-truth revenue event — fired once, only on the transition to premium,
    // so a retry or a verify-then-webhook race never double-counts.
    if (result.granted && result.userId) {
      await captureServerEvent(result.userId, "purchase_completed", {
        amount_total: result.amountTotal,
        currency: result.currency,
        transaction_id: result.transactionId,
      });
    }
  } catch (error) {
    console.error("[paddle-webhook] failed to apply event", event.eventType, error);
    // Non-2xx makes Paddle retry, which is what we want on transient DB errors.
    return NextResponse.json({ error: "Failed to apply event" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
