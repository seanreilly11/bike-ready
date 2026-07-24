// Paddle one-time transaction event -> premium grant. Kept free of "server-only"
// imports so the logic is unit-testable; the webhook route injects the real
// writer. Access is keyed off provider_customer_id (established server-side at
// checkout) — never custom_data, which the overlay does not send.

// Minimal shape we depend on from an unmarshalled Paddle event. The Node SDK
// returns camelCase entities (transaction.customerId, transaction.currencyCode,
// transaction.items[].price.id).
export interface PaddleEventLike {
  eventType: string;
  data: {
    id?: string;
    customerId?: string;
    currencyCode?: string;
    items?: Array<{ price?: { id?: string | null } | null }> | null;
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

// True when the transaction contains a line item for the given price. Shared by
// the webhook handler and the verify route so both scope grants identically.
export function transactionHasPrice(
  data: { items?: Array<{ price?: { id?: string | null } | null }> | null },
  expectedPriceId: string,
): boolean {
  return (data.items ?? []).some((item) => item.price?.id === expectedPriceId);
}

export async function handlePaddleEvent(
  event: PaddleEventLike,
  writer: BillingWriter,
  expectedPriceId: string | undefined,
): Promise<HandleResult> {
  if (!GRANT_EVENTS.has(event.eventType)) return NO_GRANT;

  const customerId = event.data.customerId;
  if (!customerId) return NO_GRANT; // not resolvable to an account

  // Scope the grant to THIS app's price. The Paddle account is shared with other
  // apps, and customers/transactions are account-wide - so a customer who bought
  // a sibling app's product (same email -> same Paddle customer) would otherwise
  // be granted premium here for free. Fail closed if the price id is unset.
  if (!expectedPriceId || !transactionHasPrice(event.data, expectedPriceId)) {
    return NO_GRANT;
  }

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
