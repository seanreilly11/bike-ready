import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BillingWriter } from "./webhook";

export async function isUserPremium(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .single();
  return data?.is_premium ?? false;
}

export async function getProviderCustomerId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("provider_customer_id")
    .eq("id", userId)
    .single();
  return data?.provider_customer_id ?? null;
}

export async function setProviderCustomerId(
  userId: string,
  customerId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ provider_customer_id: customerId })
    .eq("id", userId);
  if (error) throw new Error(`Failed to persist provider_customer_id: ${error.message}`);
}

// Grants premium for the account mapped to this Paddle customer id. Idempotent
// under concurrency: the false->true transition is a single conditional UPDATE
// (WHERE is_premium = false), and `granted` is derived from whether THIS call
// flipped the row. Two racing calls (transaction.completed + transaction.paid,
// or webhook + verify) therefore grant once and fire one revenue event; a
// retried/duplicate event, or no matching row, updates nothing.
export async function grantPremiumByProviderCustomerId(
  customerId: string,
  args: { transactionId: string | null },
): Promise<{ granted: boolean; userId: string | null }> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("provider_customer_id", customerId)
    .single();

  if (!profile) return { granted: false, userId: null };

  const { data: updated, error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_premium: true,
      premium_since: new Date().toISOString(),
      provider_transaction_id: args.transactionId,
    })
    .eq("id", profile.id)
    .eq("is_premium", false)
    .select("id");
  if (error) throw new Error(`Failed to grant premium: ${error.message}`);

  return { granted: (updated?.length ?? 0) > 0, userId: profile.id };
}

// Concrete writer injected into the webhook route (pure handler in webhook.ts).
export const billingWriter: BillingWriter = { grantPremiumByProviderCustomerId };
