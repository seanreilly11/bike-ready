import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { VALID_QUESTION_IDS } from "@/lib/validIds";
import { TEST_PASS_PCT } from "@/types";

// POST /api/test-results - record a completed test for the authenticated user
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    score_pct?: unknown;
    answers?: unknown;
  };
  const { score_pct, answers } = body;

  if (
    typeof score_pct !== "number" ||
    !Number.isInteger(score_pct) ||
    score_pct < 0 ||
    score_pct > 100
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (answers === null || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const entries = Object.entries(answers as Record<string, unknown>);
  const valid =
    entries.length <= VALID_QUESTION_IDS.size &&
    entries.every(
      ([questionId, optionId]) =>
        VALID_QUESTION_IDS.has(questionId) &&
        typeof optionId === "string" &&
        optionId.length <= 10,
    );
  if (!valid) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // passed is derived server-side so the client can't record a fake pass
  const { error } = await supabase.from("test_results").insert({
    user_id: user.id,
    score_pct,
    passed: score_pct >= TEST_PASS_PCT,
    answers,
  });

  if (error) {
    logError("test-results POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
