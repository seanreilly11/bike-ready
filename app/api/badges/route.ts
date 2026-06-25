import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { VALID_BADGE_IDS } from "@/lib/validIds";

// GET /api/badges - fetch all earned badges for the authenticated user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("badges")
    .select("badge_id, earned_at")
    .eq("user_id", user.id);

  if (error) {
    logError("badges GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ badges: data });
}

// POST /api/badges - award a badge to the authenticated user
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { badge_id?: string };
  const { badge_id } = body;

  if (typeof badge_id !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!VALID_BADGE_IDS.has(badge_id)) {
    return NextResponse.json({ error: "Unknown badge" }, { status: 400 });
  }

  const { error } = await supabase
    .from("badges")
    .insert({ user_id: user.id, badge_id });

  // Ignore unique-constraint violations (badge already earned). 23505 is the
  // Postgres unique_violation code - more robust than matching the message.
  if (error && error.code !== "23505") {
    logError("badges POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
