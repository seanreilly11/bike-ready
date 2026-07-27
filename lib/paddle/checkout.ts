import { getPaddle } from "./paddle";
import { isPaddleConfigured } from "./config";
import { getProviderCustomerId, setProviderCustomerId } from "./data";

// Establishes the user <-> Paddle customer mapping BEFORE checkout opens, so the
// webhook can resolve the account by provider_customer_id and no client-supplied
// value can misdirect premium. Returns the Paddle customer id.
//
// No direct "server-only" import here (unlike paddle.ts/data.ts) so this stays
// unit-testable in isolation, matching the same tradeoff webhook.ts documents.
// The server-only guarantee still holds transitively: every call this function
// makes (getPaddle, getProviderCustomerId, setProviderCustomerId) is backed by a
// module that imports "server-only" itself.
export async function getOrCreateProviderCustomer(
  userId: string,
  email: string,
): Promise<string> {
  if (!isPaddleConfigured()) throw new Error("Billing is not configured");

  const existing = await getProviderCustomerId(userId);
  if (existing) return existing;

  // Paddle rejects fabricated addresses; a real email is required.
  if (!email) throw new Error("An account email is required to start checkout");

  // Reuse an existing Paddle customer for this email if one exists — a prior
  // create whose mapping upsert failed would otherwise 409 (customer already
  // exists) on every retry and lock the user out of checkout.
  const paddle = getPaddle();
  let customerId: string | undefined;
  for await (const customer of paddle.customers.list({ email: [email] })) {
    customerId = customer.id;
    break;
  }
  if (!customerId) {
    const created = await paddle.customers.create({ email });
    customerId = created.id;
  }

  await setProviderCustomerId(userId, customerId);
  return customerId;
}
