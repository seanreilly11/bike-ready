// Local Paddle webhook driver. Paddle can't reach localhost, so this signs
// payloads with PADDLE_WEBHOOK_SECRET the way Paddle does
// (paddle-signature: ts=<unix>;h1=HMAC_SHA256(`<ts>:<body>`)) and POSTs them to
// the local webhook route, exercising the real getPaddle().webhooks.unmarshal
// verification path.
//
//   node scripts/paddle-webhook-replay.mjs
//     Signature-contract checks (no DB writes):
//       missing signature -> 400 | bad signature -> 400 | valid unknown evt -> 200
//
//   node scripts/paddle-webhook-replay.mjs <event.json> [url]
//     Signs a real captured Paddle event payload and POSTs it (drives a real
//     transaction.completed to flip a user to premium). Needs the column-rename
//     migration applied and PADDLE_WEBHOOK_SECRET matching this .env.local.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const arg = process.argv[2];
const isFile = arg && arg.endsWith(".json");
const url =
  (isFile ? process.argv[3] : arg) ?? "http://localhost:3000/api/paddle/webhook";

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*export\s+/, ""))
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).replace(/^"|"$/g, "").trim()];
    }),
);

const secret = env.PADDLE_WEBHOOK_SECRET;
if (!secret) throw new Error("PADDLE_WEBHOOK_SECRET missing from .env.local");

// Paddle's signature scheme, matching what webhooks.unmarshal verifies.
function sign(body) {
  const ts = Math.floor(Date.now() / 1000);
  const h1 = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${body}`)
    .digest("hex");
  return `ts=${ts};h1=${h1}`;
}

async function post(label, body, signature, expected) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signature ? { "paddle-signature": signature } : {}),
    },
    body,
  });
  const text = (await res.text()).slice(0, 120);
  const mark = expected == null ? "" : res.status === expected ? " PASS" : " FAIL";
  console.log(`${label}: ${res.status} ${text}${mark}`);
  return res.status;
}

if (isFile) {
  const body = fs.readFileSync(path.resolve(arg), "utf8");
  const type = (() => {
    try {
      return JSON.parse(body).event_type;
    } catch {
      return "?";
    }
  })();
  await post(`replay ${type}`, body, sign(body));
} else {
  // Signature-contract checks. An unknown event type routes to the SDK's
  // GenericEvent (no heavy typed-entity construction), so it exercises verify +
  // routing without a complete payload or any DB write.
  const unknown = JSON.stringify({ event_type: "ping.test", data: { id: "x" } });
  await post("missing signature ", unknown, null, 400);
  await post("bad signature     ", unknown, "ts=1;h1=deadbeef", 400);
  await post("valid, unknown evt", unknown, sign(unknown), 200);
}
