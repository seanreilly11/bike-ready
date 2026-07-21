// Exercises /api/stripe/webhook locally without the Stripe CLI.
//
// Builds a checkout.session.completed event, signs it with STRIPE_WEBHOOK_SECRET
// using the same HMAC scheme Stripe uses, and POSTs it at the running dev server.
// The route's constructEvent() cannot tell this from a real delivery.
//
//   node scripts/stripe-webhook-test.mjs <supabase-user-id> [options]
//
//   --unpaid          payment_status "unpaid" (expect "OK - awaiting payment")
//   --async           checkout.session.async_payment_succeeded instead
//   --amount=<cents>  default 499
//   --url=<url>       default http://localhost:3000/api/stripe/webhook
//
// The user id must be a real profiles.id, otherwise the update matches no row.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Stripe from "stripe";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env.local reader - the script runs outside Next, so nothing has
// loaded the file for us.
function loadEnv() {
  const env = {};
  let raw;
  try {
    raw = readFileSync(path.join(root, ".env.local"), "utf8");
  } catch {
    die(".env.local not found");
  }
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function die(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const userId = args.find((a) => !a.startsWith("--"));
if (!userId) die("Usage: node scripts/stripe-webhook-test.mjs <supabase-user-id>");

const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const env = loadEnv();
const secret = env.STRIPE_WEBHOOK_SECRET;
if (!secret) die("STRIPE_WEBHOOK_SECRET is empty in .env.local");

const paid = !args.includes("--unpaid");
const event = {
  id: `evt_test_${Date.now()}`,
  object: "event",
  api_version: "2025-01-27.acacia",
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  pending_webhooks: 0,
  request: { id: null, idempotency_key: null },
  type: args.includes("--async")
    ? "checkout.session.async_payment_succeeded"
    : "checkout.session.completed",
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      object: "checkout.session",
      mode: "payment",
      amount_total: Number(flag("amount", "499")),
      currency: "eur",
      payment_status: paid ? "paid" : "unpaid",
      status: "complete",
      customer: `cus_test_${Date.now()}`,
      payment_intent: `pi_test_${Date.now()}`,
      metadata: { supabase_user_id: userId },
    },
  },
};

const payload = JSON.stringify(event);
const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
const url = flag("url", "http://localhost:3000/api/stripe/webhook");

const response = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": signature },
  body: payload,
});

console.log(`${event.type}  payment_status=${event.data.object.payment_status}`);
console.log(`→ ${response.status} ${await response.text()}`);
