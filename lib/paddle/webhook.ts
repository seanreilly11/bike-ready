// Paddle one-time transaction event -> premium grant. Kept free of "server-only"
// imports so the logic is unit-testable; the webhook route injects the real
// writer. Access is keyed off provider_customer_id (established server-side at
// checkout) — never custom_data, which the overlay does not send.

// Minimal shape we depend on from an unmarshalled Paddle event. The Node SDK
// returns camelCase entities (transaction.customerId, transaction.currencyCode).
export interface PaddleEventLike {
  eventType: string;
  data: {
    id?: string;
    customerId?: string;
    currencyCode?: string;
    details?: { totals?: { total?: string } } | null;
  };
}

export interface BillingWriter {
  grantPremiumByProviderCustomerId(
    customerId: string,
    args: { transactionId: string | null },
  ): Promise<{ granted: boolean; userId: string | null }>;
}

export interface HandleResult {
  granted: boolean;
  userId: string | null;
  amountTotal: string | null;
  currency: string | null;
  transactionId: string | null;
}

// A completed one-time transaction is the signal to grant lifetime access.
// transaction.paid is handled too (idempotent) so a payment-collected-first
// ordering still grants. No status->plan, no revoke: a one-time grant is
// permanent, so duplicate/stale events only re-hit an already-premium row.
const GRANT_EVENTS = new Set(["transaction.completed", "transaction.paid"]);

const NO_GRANT: HandleResult = {
  granted: false,
  userId: null,
  amountTotal: null,
  currency: null,
  transactionId: null,
};

export async function handlePaddleEvent(
  event: PaddleEventLike,
  writer: BillingWriter,
): Promise<HandleResult> {
  if (!GRANT_EVENTS.has(event.eventType)) return NO_GRANT;

  const customerId = event.data.customerId;
  if (!customerId) return NO_GRANT; // not resolvable to an account

  const transactionId = event.data.id ?? null;
  const { granted, userId } = await writer.grantPremiumByProviderCustomerId(
    customerId,
    { transactionId },
  );

  return {
    granted,
    userId,
    amountTotal: event.data.details?.totals?.total ?? null,
    currency: event.data.currencyCode ?? null,
    transactionId,
  };
}
