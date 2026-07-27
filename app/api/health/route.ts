// Health check for uptime monitoring. No auth, no dependencies - a 200
// means the app is serving requests.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
