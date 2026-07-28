// One-off: creates this app's product + one-time EUR price in the shared Paddle
// account via the Node SDK (the Paddle MCP may fail with an auth-format error).
// Run: node scripts/paddle-catalog-setup.mjs   (reads PADDLE_* from .env.local)
//
// Prints the price id to put in PADDLE_PRICE_ID. Safe to re-run only
// if you want ANOTHER product/price - it always creates new ones, so run once.
import fs from "node:fs";
import path from "node:path";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*export\s+/, ""))
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).replace(/^"|"$/g, "").trim()];
    }),
);

if (!env.PADDLE_API_KEY) throw new Error("PADDLE_API_KEY missing from .env.local");

const paddle = new Paddle(env.PADDLE_API_KEY, {
  environment:
    env.PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
});

const product = await paddle.products.create({
  name: "CycleDutch Premium",
  taxCategory: "standard",
  description: "One-time lifetime unlock of the full CycleDutch course.",
});
console.log("product:", product.id);

const price = await paddle.prices.create({
  productId: product.id,
  description: "CycleDutch Premium (one-time)",
  // amount is in the lowest denomination: "499" = EUR 4.99
  unitPrice: { amount: "499", currencyCode: "EUR" },
  // one-time purchase - no recurring billing cycle
  billingCycle: null,
});
console.log("PADDLE_PRICE_ID:", price.id);
